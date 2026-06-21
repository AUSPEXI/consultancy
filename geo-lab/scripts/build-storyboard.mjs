#!/usr/bin/env node
/**
 * GEO Lab — Storyboard Builder (Phase 2)
 *
 * Turns an experiment's finished video script into the two artefacts the
 * geo-experiment-dashboard app needs:
 *
 *   1. video/storyboard.project.json  — a StoryboardProject (the app's "Load
 *      Project" format): a 36-panel storyboard with per-panel visual direction,
 *      verbatim narration, b-roll notes, and comedic b-roll beats.
 *   2. video/voiceover.txt            — the flat, cue-free narration to paste
 *      straight into ElevenLabs. Built by concatenating the panels' own audio,
 *      so the spoken track is guaranteed to match the panel boundaries.
 *
 * This replaces the manual "ask Gemini for a storyboard" + "strip the visual
 * cues by hand" steps. Run it after generate-video-package.mjs.
 *
 * Usage: node scripts/build-storyboard.mjs <experiment-dir>
 *
 * Non-fatal: exits cleanly (code 0) if ANTHROPIC_API_KEY is unset.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
// Load scripts/.env if dotenv is available (local runs). In CI the env is already
// set, so a missing dotenv is non-fatal.
try {
  const { config } = await import('dotenv');
  config({ path: path.join(__dir, '.env') });
} catch { /* dotenv not installed — rely on the ambient environment */ }

const experimentDir = process.argv[2];
if (!experimentDir) {
  console.error('Usage: node scripts/build-storyboard.mjs <experiment-dir>');
  process.exit(1);
}

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.log('[build-storyboard] ANTHROPIC_API_KEY not set — skipping (non-fatal).');
  process.exit(0);
}

const PANEL_COUNT = 36;          // 6 rows × 6 cols, to match the app grid
const ROWS = 6;
const COLS = 6;
const MODEL = 'claude-opus-4-8';

async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// ── Load inputs ─────────────────────────────────────────────────────────────
const experimentId = path.basename(path.resolve(experimentDir));
const scriptPath = path.join(experimentDir, 'video', 'script.md');

const [script, finding, titles] = await Promise.all([
  fs.readFile(scriptPath, 'utf8').catch(() => {
    throw new Error('video/script.md not found — run generate-video-package.mjs first');
  }),
  fs.readFile(path.join(experimentDir, 'FINDING.md'), 'utf8').catch(() => ''),
  fs.readFile(path.join(experimentDir, 'video', 'titles.md'), 'utf8').catch(() => ''),
]);

let findingSummary = '';
try {
  const fj = JSON.parse(await fs.readFile(path.join(experimentDir, 'finding.json'), 'utf8'));
  findingSummary = JSON.stringify({
    hypothesis: fj.hypothesis,
    verdict: fj.verdict,
    bestVariant: fj.bestVariant,
    topEffect: fj.topEffect,
    significant: fj.significant,
    aggregate: fj.aggregate,
  }, null, 2);
} catch { /* non-fatal */ }

// ── Prompt ───────────────────────────────────────────────────────────────────
const systemPrompt = `You convert a finished YouTube video script into a STORYBOARD PROJECT (JSON) for L8EntSpace's GEO Lab cinematic recorder app.

You output ONLY a single JSON object inside a <STORYBOARD_JSON> ... </STORYBOARD_JSON> block. No prose outside it.

The schema (TypeScript) you must emit:

interface StoryboardPanel {
  panelId: number;     // 1..${PANEL_COUNT}, sequential
  row: number;         // 1..${ROWS}
  col: number;         // 1..${COLS}
  phase: string;       // beat label, e.g. "Hook","Hypothesis","Method","The Run","Results","The Fix","Rigor","Threats","Takeaway","Outro"
  visual: string;      // on-screen visual direction (from [ON SCREEN:] cues), one tight sentence
  audio: string;       // the VERBATIM spoken narration for this panel — cue-free, no brackets, no stage directions
  bRoll: string;       // short b-roll asset note (from [B-ROLL:] cues), or "" if none
  bRollComedic?: string; // see B-ROLL HUMOUR below — only on panels that get a comedic cutaway
  hasBRoll?: boolean;  // true ONLY on the ~6-8 panels that cut away to a comedic full-screen b-roll
  startTime: string;   // "m:ss"
  endTime: string;     // "m:ss"
}
interface StoryboardProject {
  schemaVersion: 1;
  experimentId: string;
  title: string;            // the video title (use the script/finding; pick the strongest)
  subtitle: string;         // one-line dossier description of what was tested
  headlineStat: string;     // the hero number, e.g. "100%"
  headlineStatLabel: string;// caption for it, e.g. "Claude Citations Lift"
  baselineDurationSec: number; // total authored length in seconds (estimate from narration; ~3 words/sec)
  panels: StoryboardPanel[];   // EXACTLY ${PANEL_COUNT} panels
}

HARD RULES:
- EXACTLY ${PANEL_COUNT} panels. panelId 1..${PANEL_COUNT}. row = ceil(panelId/${COLS}), col = ((panelId-1) % ${COLS}) + 1.
- The "audio" fields, read in order, ARE the complete narration — split the script's spoken prose across the 36 panels with NOTHING added and NOTHING dropped. Do not invent lines; do not include [ON SCREEN:]/[B-ROLL:] text in audio.
- Timings are contiguous: panel N's endTime equals panel N+1's startTime. Panel 1 starts at 0:00. The last panel ends at baselineDurationSec. Make each panel's duration roughly proportional to its narration length.
- Scientific integrity: the narration is already honest about preliminary/small-n caveats — preserve them; never strengthen a claim.

B-ROLL HUMOUR (important): B-roll here is COMIC PUNCTUATION — a short, funny cutaway that lightens otherwise dry, factual content by juxtaposition (the experiment-001 style). Choose ~6-8 well-spaced panels where a laugh lands well (a surprising stat, a paradox, a caveat, the outro). On those panels set hasBRoll:true and write bRollComedic as a vivid one-line gag brief for a Google Flow clip (e.g. a "10x" odds ratio as a citation bench-pressing a giant 10x). Keep it on-brand: clever, self-aware, never slapstick-for-its-own-sake. All other panels have hasBRoll omitted or false.`;

const userPrompt = `Build the storyboard project for experiment "${experimentId}".

## The video script (source of narration + visual/b-roll cues)
${script}

## The finding (for title / headline stat / honesty)
${finding.slice(0, 4000)}

${findingSummary ? `## Finding summary (JSON)\n${findingSummary}\n` : ''}
${titles ? `## Title options (pick or adapt the strongest)\n${titles.slice(0, 800)}\n` : ''}
Return ONLY the <STORYBOARD_JSON> block with exactly ${PANEL_COUNT} panels, experimentId set to "${experimentId}".`;

console.log(`[build-storyboard] generating ${PANEL_COUNT}-panel storyboard for ${experimentId} via ${MODEL}...`);
const response = await callClaude(systemPrompt, userPrompt);

// ── Parse + validate ─────────────────────────────────────────────────────────
function extractJson(text) {
  const block = text.match(/<STORYBOARD_JSON>([\s\S]*?)<\/STORYBOARD_JSON>/);
  const raw = block ? block[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in model response');
  return JSON.parse(raw.slice(start, end + 1));
}

let project;
try {
  project = extractJson(response);
} catch (err) {
  console.error('[build-storyboard] Failed to parse model JSON:', err.message);
  process.exit(1);
}

const REQUIRED = ['panelId', 'row', 'col', 'phase', 'visual', 'audio', 'startTime', 'endTime'];
if (!Array.isArray(project.panels) || project.panels.length === 0) {
  console.error('[build-storyboard] Model returned no panels.');
  process.exit(1);
}
if (project.panels.length !== PANEL_COUNT) {
  console.warn(`[build-storyboard] Warning: got ${project.panels.length} panels (expected ${PANEL_COUNT}).`);
}
for (let i = 0; i < project.panels.length; i++) {
  const p = project.panels[i];
  for (const f of REQUIRED) {
    if (p[f] === undefined || p[f] === null || p[f] === '') {
      console.error(`[build-storyboard] Panel ${i + 1} missing "${f}".`);
      process.exit(1);
    }
  }
  if (p.bRoll === undefined) p.bRoll = '';
}

// Normalise the fields the app relies on.
project.schemaVersion = 1;
project.experimentId = experimentId;
if (!project.baselineDurationSec) project.baselineDurationSec = 330;
project.createdAt = new Date().toISOString().slice(0, 10);

// ── Write outputs ─────────────────────────────────────────────────────────────
const videoDir = path.join(experimentDir, 'video');
await fs.mkdir(videoDir, { recursive: true });

const projectPath = path.join(videoDir, 'storyboard.project.json');
await fs.writeFile(projectPath, JSON.stringify(project, null, 2) + '\n');

// Voiceover = the panels' own narration, in order. This guarantees the spoken
// track matches the panel boundaries the app will use for sync.
const voiceover = project.panels.map(p => p.audio.trim()).join('\n\n') + '\n';
const voiceoverPath = path.join(videoDir, 'voiceover.txt');
await fs.writeFile(voiceoverPath, voiceover);

const brollPanels = project.panels.filter(p => p.hasBRoll).map(p => p.panelId);
console.log(`[build-storyboard] ✅ ${project.panels.length} panels`);
console.log(`  Written: ${path.relative(process.cwd(), projectPath)}`);
console.log(`  Written: ${path.relative(process.cwd(), voiceoverPath)}  (${voiceover.split(/\s+/).length} words for ElevenLabs)`);
console.log(`  Comedic b-roll panels: ${brollPanels.length ? brollPanels.join(', ') : '(none)'}`);
