#!/usr/bin/env node
/**
 * GEO Lab Orchestrator
 *
 * Decides what to do next and does it. Run daily by GitHub Actions.
 *
 * Phases (auto-selected based on lab-state.json):
 *   design   — pick next experiment, generate DESIGN.md + variants via Claude API
 *   probe    — run probes for the active experiment, accumulate n
 *   analyze  — run statistics, generate video package, send email report
 *
 * Usage:
 *   node orchestrate.mjs [--force-phase design|probe|analyze] [--dry-run]
 *
 * Env (from .env or GitHub Actions secrets):
 *   ANTHROPIC_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY,
 *   PERPLEXITY_API_KEY, EMAIL_USER, EMAIL_APP_PASSWORD, REPORT_EMAIL
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { config } from 'dotenv';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');

config({ path: path.join(__dir, '.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const forcePhase = (() => {
  const idx = process.argv.indexOf('--force-phase');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

const MIN_N = 30;
const MAX_PROBES_PER_RUN = 2; // probe batches per daily run (each batch = 1 trial × all queries × all platforms)

// ── Helpers ──────────────────────────────────────────────────────────────────

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n');
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function callClaude(systemPrompt, userPrompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    log(`Running: node ${path.basename(scriptPath)} ${args.join(' ')}`);
    if (DRY_RUN) { log('[dry-run] skipped'); return resolve(''); }
    const child = spawn('node', [scriptPath, ...args], { stdio: 'inherit', env: process.env });
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Script exited with code ${code}`)));
  });
}

// ── Load experiment raw.json and count n ──────────────────────────────────────

async function countN(experimentDir) {
  const rawPath = path.join(experimentDir, 'results', 'raw.json');
  try {
    const raw = await readJson(rawPath);
    if (!raw.results || !raw.meta?.variants) return 0;
    const variants = raw.meta.variants;
    // Count minimum n across all variants
    const counts = {};
    for (const v of variants) counts[v] = 0;
    for (const r of raw.results) {
      if (counts[r.citations] !== undefined) {/* noop */}
      for (const v of variants) {
        if (r.citations !== undefined) counts[v]++;
      }
    }
    // Actually count per variant
    const perVariant = {};
    for (const v of variants) perVariant[v] = 0;
    for (const r of raw.results) {
      for (const v of variants) {
        if (r.citations && r.citations[v] !== undefined) perVariant[v]++;
      }
    }
    return Math.min(...Object.values(perVariant));
  } catch {
    return 0;
  }
}

// ── DESIGN PHASE ─────────────────────────────────────────────────────────────

async function designPhase(state, backlog) {
  const nextExp = backlog.experiments.find(e => e.status === 'queued' && e.n_per_variant > 0);
  if (!nextExp) {
    log('No queued experiments with n > 0 found. All done!');
    return;
  }

  log(`Designing experiment ${nextExp.id}: ${nextExp.title}`);

  const experimentDir = path.join(ROOT, 'experiments', `${nextExp.id}-${nextExp.slug}`);
  await fs.mkdir(path.join(experimentDir, 'variants'), { recursive: true });
  await fs.mkdir(path.join(experimentDir, 'results'), { recursive: true });
  await fs.mkdir(path.join(experimentDir, 'video'), { recursive: true });

  // Read context files
  const geoPrinciples = await fs.readFile(path.join(ROOT, 'context', 'geo-principles.md'), 'utf8');
  const methodology = await fs.readFile(path.join(ROOT, 'context', 'experiment-methodology.md'), 'utf8');
  const templateDesign = await fs.readFile(path.join(ROOT, 'experiments', '_template', 'DESIGN.md'), 'utf8');
  const templateA = await fs.readFile(path.join(ROOT, 'experiments', '_template', 'variants', 'A.md'), 'utf8');
  const templateB = await fs.readFile(path.join(ROOT, 'experiments', '_template', 'variants', 'B.md'), 'utf8');

  const systemPrompt = `You are the GEO Lab's experiment designer. You write rigorous, falsifiable A/B experiments on LLM citation behaviour.

RULES:
- One variable per experiment — variants differ in EXACTLY ONE factor.
- Write concrete, realistic content about a fictional B2B SaaS called "NovaCRM" that helps sales teams close deals faster. Use NovaCRM as the subject of all variants so the brand is neutral.
- Variants must be equal length (within 10%) unless length is the variable being tested.
- Queries must be phrased as real user questions, 3-5 paraphrases.
- The DESIGN.md hypothesis section must be a single sentence in the format: "If [change], then [citation rate will be higher/lower] for [query type], because [mechanism]."
- Return ONLY the file contents, clearly delimited as instructed.`;

  const userPrompt = `Design experiment ${nextExp.id}.

Hypothesis from queue: ${nextExp.hypothesis}
Variable: ${nextExp.variable}
Predicted winner: ${nextExp.predicted_winner}
Platforms: ${nextExp.platforms.join(', ')}
n per variant: ${nextExp.n_per_variant}

GEO Principles context:
${geoPrinciples}

Methodology context:
${methodology}

DESIGN.md template:
${templateDesign}

Variant A template:
${templateA}

Variant B template:
${templateB}

Produce three outputs, each delimited exactly as shown:

<DESIGN_MD>
[complete DESIGN.md content]
</DESIGN_MD>

<VARIANT_A>
[complete variants/A.md content — the CONTROL, 150-200 words about NovaCRM WITHOUT the lever]
</VARIANT_A>

<VARIANT_B>
[complete variants/B.md content — the TREATMENT, same length about NovaCRM WITH the lever applied]
</VARIANT_B>`;

  log('Calling Claude to write experiment design...');
  if (DRY_RUN) {
    log('[dry-run] Skipping Claude call');
  } else {
    const response = await callClaude(systemPrompt, userPrompt);

    const designMatch = response.match(/<DESIGN_MD>([\s\S]*?)<\/DESIGN_MD>/);
    const variantAMatch = response.match(/<VARIANT_A>([\s\S]*?)<\/VARIANT_A>/);
    const variantBMatch = response.match(/<VARIANT_B>([\s\S]*?)<\/VARIANT_B>/);

    if (!designMatch || !variantAMatch || !variantBMatch) {
      throw new Error('Claude response missing expected delimiters. Response:\n' + response.slice(0, 500));
    }

    await fs.writeFile(path.join(experimentDir, 'DESIGN.md'), designMatch[1].trim() + '\n');
    await fs.writeFile(path.join(experimentDir, 'variants', 'A.md'), variantAMatch[1].trim() + '\n');
    await fs.writeFile(path.join(experimentDir, 'variants', 'B.md'), variantBMatch[1].trim() + '\n');
    log(`Written: DESIGN.md, variants/A.md, variants/B.md`);
  }

  // Update backlog
  nextExp.status = 'running';
  nextExp.started_at = new Date().toISOString();
  await writeJson(path.join(ROOT, 'experiments', 'backlog.json'), backlog);

  // Update state
  state.active_experiment = {
    id: nextExp.id,
    slug: nextExp.slug,
    dir: `experiments/${nextExp.id}-${nextExp.slug}`,
    started_at: nextExp.started_at,
    n_target: nextExp.n_per_variant,
    platforms: nextExp.platforms,
  };
  state.last_design_run = new Date().toISOString();
  await writeJson(path.join(ROOT, 'lab-state.json'), state);

  log(`Experiment ${nextExp.id} designed. Pre-registration timestamp: ${nextExp.started_at}`);
}

// ── PROBE PHASE ───────────────────────────────────────────────────────────────

async function probePhase(state) {
  if (!state.active_experiment) {
    log('No active experiment. Run design phase first.');
    return false;
  }

  const exp = state.active_experiment;
  const experimentDir = path.join(ROOT, exp.dir);

  const currentN = await countN(experimentDir);
  log(`Current n: ${currentN} / ${exp.n_target}`);

  if (currentN >= exp.n_target) {
    log('n target reached — triggering analyze phase');
    return true; // signal to caller: ready to analyze
  }

  const trialsThisRun = Math.min(MAX_PROBES_PER_RUN, exp.n_target - currentN);
  const platformArg = exp.platforms.join(',');

  log(`Running ${trialsThisRun} trial batch across [${platformArg}]...`);

  await runScript(path.join(__dir, 'probe.mjs'), [
    experimentDir,
    '--platform', platformArg,
    '--trials', String(trialsThisRun),
  ]);

  const newN = await countN(experimentDir);
  log(`n after probe: ${newN} / ${exp.n_target}`);

  state.last_probe_run = new Date().toISOString();
  await writeJson(path.join(ROOT, 'lab-state.json'), state);

  return newN >= exp.n_target;
}

// ── ANALYZE PHASE ─────────────────────────────────────────────────────────────

async function analyzePhase(state, backlog) {
  if (!state.active_experiment) {
    log('No active experiment to analyze.');
    return;
  }

  const exp = state.active_experiment;
  const experimentDir = path.join(ROOT, exp.dir);

  // Run statistical analysis
  log('Running statistical analysis...');
  await runScript(path.join(__dir, 'analyze.mjs'), [experimentDir]);

  // Generate video package
  log('Generating video package...');
  await runScript(path.join(__dir, 'generate-video-package.mjs'), [experimentDir]);

  // Send email report
  log('Sending report email...');
  await runScript(path.join(__dir, 'send-report.mjs'), [experimentDir]);

  // Publish the finding into the dashboard recommendation loop (non-fatal)
  log('Publishing finding to dashboard...');
  try {
    await runScript(path.join(__dir, 'publish-finding.mjs'), [experimentDir]);
  } catch (err) {
    log(`Publish step failed (non-fatal): ${err.message}`);
  }

  // Mark experiment complete
  const expEntry = backlog.experiments.find(e => e.id === exp.id);
  if (expEntry) {
    expEntry.status = 'complete';
    expEntry.completed_at = new Date().toISOString();
    await writeJson(path.join(ROOT, 'experiments', 'backlog.json'), backlog);
  }

  // Archive and reset state
  if (!state.history) state.history = [];
  state.history.push({ ...exp, completed_at: new Date().toISOString() });
  state.active_experiment = null;
  state.queue_position = (state.queue_position || 0) + 1;
  await writeJson(path.join(ROOT, 'lab-state.json'), state);

  log(`Experiment ${exp.id} complete. Next experiment will be designed on next Monday run.`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

const statePath = path.join(ROOT, 'lab-state.json');
const backlogPath = path.join(ROOT, 'experiments', 'backlog.json');

const state = await readJson(statePath);
const backlog = await readJson(backlogPath);

const dayOfWeek = new Date().getUTCDay(); // 0=Sun, 1=Mon
const isMonday = dayOfWeek === 1;
const hasActiveExperiment = !!state.active_experiment;

// Determine phase
let phase = forcePhase;
if (!phase) {
  if (!hasActiveExperiment && isMonday) {
    phase = 'design';
  } else if (!hasActiveExperiment && !isMonday) {
    log('No active experiment and not Monday — waiting for Monday to design next experiment.');
    phase = 'wait';
  } else {
    phase = 'probe'; // will self-escalate to analyze if n is reached
  }
}

log(`Phase: ${phase}${DRY_RUN ? ' [DRY RUN]' : ''}`);

switch (phase) {
  case 'design':
    await designPhase(state, backlog);
    break;

  case 'probe': {
    const ready = await probePhase(state, backlog);
    if (ready) {
      // Re-read state in case probe updated it
      const freshState = await readJson(statePath);
      await analyzePhase(freshState, backlog);
    }
    break;
  }

  case 'analyze': {
    const freshState = await readJson(statePath);
    await analyzePhase(freshState, backlog);
    break;
  }

  case 'wait':
    log('Nothing to do today.');
    break;

  default:
    log(`Unknown phase: ${phase}`);
    process.exit(1);
}

log('Orchestrator done.');
