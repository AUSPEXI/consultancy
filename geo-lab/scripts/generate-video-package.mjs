#!/usr/bin/env node
/**
 * GEO Lab — Video Package Generator
 *
 * Reads FINDING.md from an experiment and calls Claude to produce the full
 * YouTube package: script, titles, thumbnail brief, description, pinned comment.
 *
 * Usage:
 *   node generate-video-package.mjs <experiment-dir>
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dir = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dir, '.env') });

const experimentDir = process.argv[2];
if (!experimentDir) {
  console.error('Usage: node generate-video-package.mjs <experiment-dir>');
  process.exit(1);
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
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content[0].text;
}

// Load files
const findingPath = path.join(experimentDir, 'FINDING.md');
const designPath = path.join(experimentDir, 'DESIGN.md');
const rootDir = path.resolve(__dir, '..');
const contextDir = path.join(rootDir, 'context');

const [finding, design, channelStrategy, brandContext] = await Promise.all([
  fs.readFile(findingPath, 'utf8').catch(() => { throw new Error('FINDING.md not found — run analyze.mjs first'); }),
  fs.readFile(designPath, 'utf8').catch(() => ''),
  fs.readFile(path.join(contextDir, 'youtube-channel.md'), 'utf8'),
  fs.readFile(path.join(contextDir, 'l8entspace-brand.md'), 'utf8'),
]);

const variantFiles = await fs.readdir(path.join(experimentDir, 'variants')).catch(() => []);
const variants = await Promise.all(
  variantFiles
    .filter(f => f.endsWith('.md'))
    .map(async f => ({ id: f.replace('.md', ''), content: await fs.readFile(path.join(experimentDir, 'variants', f), 'utf8') }))
);
const variantText = variants.map(v => `**Variant ${v.id}:**\n${v.content}`).join('\n\n---\n\n');

const systemPrompt = `You are the GEO Lab's video producer for Gwylym Pryce-Owen's YouTube channel about Generative Engine Optimization.

Your job is to turn a completed experiment finding into a compelling, trustworthy YouTube video package. The channel's authority depends on scientific integrity — never overstate results, never make claims that go beyond the data, and present null results honestly as valuable findings.

The audience: founders, marketers, and SEO/AEO practitioners who are smart, data-literate, and allergic to hype.

Hard rules:
- The number in the title MUST match the exact figure in FINDING.md.
- Null results get honest titles, BUT a null at low power is NOT proof of "no effect". If the result is null OR per-platform n is below 30 OR the finding flags low attribution sensitivity, you MUST NOT use absolute language like "did NOTHING", "doesn't matter", "zero effect", or a bare "0.0pp" as a definitive verdict. Frame it as the absence of a *detectable* effect at this power, e.g. "No measurable lift (preliminary, small sample)" or "I couldn't detect any effect — yet". Absence of evidence is not evidence of absence; say so in the script.
- Never imply a finding is conclusive when the threats section flags low n, a <5-day window, or low attribution sensitivity. The honest hook is the limitation, not fake certainty.
- L8EntSpace soft CTA goes at the END of the script only, using the exact approved language.
- Spoken script target: 1,200–1,800 words (8–12 min at speaking pace).
- Include [ON SCREEN:] cues and [B-ROLL:] suggestions throughout the script.`;

// Surface temporal metadata for the video producer — collection window and
// model drift are content assets, not just threats to validity. A video that
// says "collected across 14 days, no model drift" is more credible than one
// that doesn't mention it. A drift warning is an interesting narrative hook.
let temporalContext = '';
try {
  const findingJson = JSON.parse(await fs.readFile(path.join(experimentDir, 'finding.json'), 'utf8'));
  const span = findingJson.collectionSpanDays;
  const mv = findingJson.modelVersions ?? {};
  const drift = findingJson.modelDrift;
  const retests = findingJson.retests ?? [];
  temporalContext = `\n## Temporal & Reproducibility Context\n`;
  temporalContext += `- Collection window: ${span >= 1 ? `${span} days` : '< 1 day'}`;
  if (span < 5) temporalContext += ` ⚠ (narrow window — acknowledge in threats section)`;
  temporalContext += '\n';
  temporalContext += `- Model versions: ${Object.entries(mv).map(([p, v]) => `${p}: ${Array.isArray(v) ? v[v.length-1] : v}`).join(', ')}\n`;
  if (drift) temporalContext += `- ⚠ Model drift detected mid-experiment — mention explicitly in Threats section as an honest limitation.\n`;
  else temporalContext += `- No model drift: consistent engine versions across all batches — good for credibility.\n`;
  if (retests.length > 0) {
    temporalContext += `- Longitudinal re-tests: ${retests.length} re-test(s) conducted.\n`;
    for (const rt of retests) {
      const rtRates = Object.entries(rt.aggregate ?? {}).map(([v, s]) => `${v}: ${s.rate}%`).join(', ');
      temporalContext += `  - ${rt.collectionDate}: ${rtRates}\n`;
    }
    temporalContext += `  Include a "We re-tested this 30 days later" moment in the script.\n`;
  }
} catch { /* non-fatal */ }

const userPrompt = `Produce the complete YouTube video package for this experiment.

## The Finding
${finding}
${temporalContext}
## Experiment Design (for context)
${design}

## Content Variants Tested
${variantText}

## Channel Strategy
${channelStrategy}

## Brand & CTA Guidelines
${brandContext}

---

Produce all seven outputs, each delimited exactly as shown:

<SCRIPT_MD>
Full spoken script in 7-part format:
1. Hook (0:00–0:20) — open on the surprising result, then rewind to the question
2. Hypothesis (0:20–1:00) — what we tested and why it might matter
3. Method (1:00–3:00) — variants on screen, the probe, n, the four engines. Show DESIGN.md timestamp as pre-registration proof.
4. The Run (3:00–5:00) — describe watching probes execute, raw responses
5. The Result (5:00–8:00) — rates, the chart, the p-value, plain conclusion
6. Threats to Validity (8:00–9:30) — what could be wrong. This builds authority. Cover: temporal collection window (how many days, was it a snapshot?), model version stability/drift, fast-mode vs live-mode distinction, and multiple comparisons. Say it plainly — "here's why you shouldn't fully trust this" is what separates a scientist from a hype merchant.
7. What it means for you (9:30–end) — practical takeaway + soft Auspexi CTA (approved language only)

Include [ON SCREEN:] cues for charts, variant comparisons, terminal output, and data tables.
Include [B-ROLL:] notes for visual suggestions.
Target 1,200–1,800 words (8–12 min at speaking pace).
</SCRIPT_MD>

<SHORTS_HOOK_MD>
A self-contained 45–60 second vertical Shorts script.
Format:
- Line 1: The hook (the result as a provocative statement — first 3 words must stop the scroll)
- Lines 2–8: Rapid context (what was tested, one-line method)
- Lines 9–12: The result stated plainly with the real number
- Lines 13–15: The implication + CTA ("Full experiment linked in bio" or "Watch the full breakdown")
Include [ON SCREEN:] cues — Shorts lives or dies on the visual, so be specific (text overlays, split-screen A/B, result card animation).
Include [CAPTION:] for the auto-caption hook (first 5 words viewers see in feed).
Write for re-read velocity — each line should work standalone if someone scrolls past mid-video.
No Auspexi pitch in Shorts — channel authority comes first.
</SHORTS_HOOK_MD>

<TITLES_MD>
5 title options for the long-form video, ranked 1–5, each ≤ 60 characters, each with a one-line rationale.
Include the real number from the finding.
At least one title must lead with the result, not the question.
Include 2 bonus Shorts title options (≤ 40 chars, front-loaded with the result number).
</TITLES_MD>

<THUMBNAIL_MD>
Visual concept brief for the long-form thumbnail (not the image itself).
Must include:
- The key number (large, high-contrast)
- A/B split showing the two variants (left = control, right = treatment)
- An arrow showing direction of effect
- Gwylym's face position and expression suggestion
- Colour palette: dark background (#09090b), high-contrast white text, single accent colour
- Text overlays: max 6 words total across the whole thumbnail
Also include a separate Shorts thumbnail brief (square crop, single bold stat, no face required).
</THUMBNAIL_MD>

<DESCRIPTION_MD>
[150-word SEO description with finding in first sentence]
[5–7 chapter timestamps matching the script]
[Links section: L8EntSpace website, experiment folder placeholder, related videos placeholder]
[3–5 relevant hashtags]
[L8EntSpace™ on first mention]
</DESCRIPTION_MD>

<PINNED_COMMENT_MD>
2–3 sentences: where to find the raw data + step-by-step reproduction instructions (model, prompt structure, n, command to run).
</PINNED_COMMENT_MD>

<CONTENT_CALENDAR_MD>
A brief repurposing plan for this experiment's content:
- Shorts (post day 1 — the hook)
- Long-form (post day 2–3)
- LinkedIn post (1 paragraph, the finding as a provocative claim + link)
- X/Twitter thread (5 tweets: hook → method → result → implication → CTA)
- Community post / pinned comment (raw data availability)
Keep each item to 2–3 sentences max. This is a production checklist, not copy.
</CONTENT_CALENDAR_MD>`;

console.log('Generating video package via Claude...');
const response = await callClaude(systemPrompt, userPrompt);

// Parse outputs
function extractBlock(tag, text) {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : null;
}

const outputs = {
  'video/script.md': extractBlock('SCRIPT_MD', response),
  'video/shorts-hook.md': extractBlock('SHORTS_HOOK_MD', response),
  'video/titles.md': extractBlock('TITLES_MD', response),
  'video/thumbnail.md': extractBlock('THUMBNAIL_MD', response),
  'video/description.md': extractBlock('DESCRIPTION_MD', response),
  'video/pinned-comment.md': extractBlock('PINNED_COMMENT_MD', response),
  'video/content-calendar.md': extractBlock('CONTENT_CALENDAR_MD', response),
};

const videoDir = path.join(experimentDir, 'video');
await fs.mkdir(videoDir, { recursive: true });

for (const [filename, content] of Object.entries(outputs)) {
  if (!content) {
    console.warn(`Warning: ${filename} not found in Claude response`);
    continue;
  }
  await fs.writeFile(path.join(experimentDir, filename), content + '\n');
  console.log(`Written: ${filename}`);
}

console.log('\nVideo package complete.');
console.log(`Files in: ${path.join(experimentDir, 'video/')}`);
