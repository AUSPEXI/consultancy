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
  fs.readFile(path.join(contextDir, 'auspexi-brand.md'), 'utf8'),
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
- Null results get honest titles (e.g. "Turns out it doesn't matter — I tested 240 prompts").
- Auspexi soft CTA goes at the END of the script only, using the exact approved language.
- Spoken script target: 1,200–1,800 words (8–12 min at speaking pace).
- Include [ON SCREEN:] cues and [B-ROLL:] suggestions throughout the script.`;

const userPrompt = `Produce the complete YouTube video package for this experiment.

## The Finding
${finding}

## Experiment Design (for context)
${design}

## Content Variants Tested
${variantText}

## Channel Strategy
${channelStrategy}

## Brand & CTA Guidelines
${brandContext}

---

Produce all five outputs, each delimited exactly as shown:

<SCRIPT_MD>
[Full spoken script in 7-part format: Hook → Hypothesis → Method → The Run → The Result → Threats to Validity → What it means for you + CTA]
Include [ON SCREEN:] cues for any data, charts, or variant comparisons.
Include [B-ROLL:] notes for visual suggestions.
Target 1,200–1,800 words.
</SCRIPT_MD>

<TITLES_MD>
[5 title options, ranked 1–5, each ≤ 60 characters, each with a one-line rationale]
Include real numbers from the finding.
</TITLES_MD>

<THUMBNAIL_MD>
[Visual concept brief: the key number, A vs B comparison, arrow showing direction, colour palette]
</THUMBNAIL_MD>

<DESCRIPTION_MD>
[150-word SEO description with finding in first sentence]
[5–7 chapter timestamps matching the script]
[Links section: Auspexi website, experiment folder placeholder, related videos placeholder]
[Auspexi™ on first mention]
</DESCRIPTION_MD>

<PINNED_COMMENT_MD>
[2–3 sentences: where to find the raw data + step-by-step reproduction instructions]
</PINNED_COMMENT_MD>`;

console.log('Generating video package via Claude...');
const response = await callClaude(systemPrompt, userPrompt);

// Parse outputs
function extractBlock(tag, text) {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : null;
}

const outputs = {
  'video/script.md': extractBlock('SCRIPT_MD', response),
  'video/titles.md': extractBlock('TITLES_MD', response),
  'video/thumbnail.md': extractBlock('THUMBNAIL_MD', response),
  'video/description.md': extractBlock('DESCRIPTION_MD', response),
  'video/pinned-comment.md': extractBlock('PINNED_COMMENT_MD', response),
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
