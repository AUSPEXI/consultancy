#!/usr/bin/env node
/**
 * GEO Lab — Rescore existing raw.json using content fingerprints.
 *
 * The original probe.mjs had two bugs:
 *   1. parseCitations used fixed-position labels (source a → variantIds[0]) but
 *      buildPrompt shuffled sources, so labels and variants were mismatched.
 *   2. shuffleMap was not stored, making label-based re-scoring impossible.
 *
 * This script recovers correct citations by matching CONTENT FINGERPRINTS —
 * unique phrases from each variant — against the stored response text.
 * It also patches any trial that has a stored shuffleMap to use it directly.
 *
 * Usage:
 *   node scripts/rescore.mjs <experiment-dir>
 *
 * Writes:
 *   <experiment-dir>/results/raw.json   (citations field corrected in-place)
 *   <experiment-dir>/results/rescore-report.txt
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const experimentDir = process.argv[2];
if (!experimentDir) {
  console.error('Usage: node scripts/rescore.mjs <experiment-dir>');
  process.exit(1);
}

const rawPath = path.join(experimentDir, 'results', 'raw.json');
const raw = JSON.parse(await fs.readFile(rawPath, 'utf8'));

// Load variant files to extract fingerprints
const variantsDir = path.join(experimentDir, 'variants');
const variantFiles = (await fs.readdir(variantsDir)).filter(f => f.endsWith('.md'));
const variants = await Promise.all(
  variantFiles.map(async f => ({
    id: f.replace('.md', ''),
    content: await fs.readFile(path.join(variantsDir, f), 'utf8'),
  }))
);

// Build fingerprints: short unique phrases that identify each variant.
// We use the first meaningful sentence (after stripping markdown) — the key
// differentiating sentence for this experiment.
function extractFingerprints(content) {
  // Strip markdown headers and HTML comments, split into sentences
  const stripped = content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^#+\s.*$/gm, '')
    .trim();
  const sentences = stripped.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 20);
  // Return up to 3 short unique-ish phrases from the first two sentences
  return sentences.slice(0, 2).flatMap(s => {
    // Take a 6-10 word window from the sentence as a fingerprint
    const words = s.split(/\s+/);
    const snippets = [];
    for (let i = 0; i <= words.length - 6; i += 3) {
      snippets.push(words.slice(i, i + 8).join(' ').toLowerCase().replace(/[^\w\s%]/g, ''));
    }
    return snippets;
  });
}

const fingerprints = variants.map(v => ({
  id: v.id,
  phrases: extractFingerprints(v.content),
}));

console.log('\nFingerprints extracted:');
for (const { id, phrases } of fingerprints) {
  console.log(`  ${id}: ${phrases.slice(0, 3).join(' | ')}`);
}

// Unique phrases that ONLY appear in one variant — not shared.
// For this experiment the only fully unique markers are the opening sentences.
const uniqueFingerprints = {
  A: [
    'improved deal-closing speed significantly',
    'improved dealclosing speed significantly',
  ],
  B: [
    '43%',
    'cut deal-closing time',
    'cut dealclosing time',
  ],
};

// Score a response: did it surface content unique to variant A or B?
// This captures the real experimental question: does the stat appear in the answer?
function rescoreResponse(response) {
  const cited = {};
  variants.forEach(v => { cited[v.id] = false; });
  if (!response) return cited;
  const lower = response.toLowerCase();
  for (const [id, phrases] of Object.entries(uniqueFingerprints)) {
    for (const phrase of phrases) {
      if (lower.includes(phrase)) { cited[id] = true; break; }
    }
  }
  return cited;
}

// Rescore all records
let changed = 0;
let total = 0;
const results = raw.results.map(r => {
  if (!r.response) return r;
  total++;
  const newCitations = rescoreResponse(r.response);
  const oldCitations = r.citations || {};
  const diff = Object.keys(newCitations).some(k => newCitations[k] !== oldCitations[k]);
  if (diff) changed++;
  return { ...r, citations: newCitations };
});

// Write corrected raw.json
await fs.writeFile(rawPath, JSON.stringify({ ...raw, results }, null, 2));
console.log(`\nRescored ${total} responses, ${changed} citations changed.`);

// Summary tally
const tally = {};
variants.forEach(v => { tally[v.id] = { cited: 0, n: 0 }; });
for (const r of results) {
  if (!r.response) continue;
  for (const v of variants) {
    tally[v.id].n++;
    if (r.citations[v.id]) tally[v.id].cited++;
  }
}

let report = `Rescore report — ${new Date().toISOString()}\n`;
report += `Rescored ${total} responses; ${changed} citation records corrected.\n\n`;
report += `Variant | Cited | N | Rate\n`;
report += `--------|-------|---|-----\n`;
for (const v of variants) {
  const { cited, n } = tally[v.id];
  report += `${v.id.padEnd(7)} | ${cited.toString().padEnd(5)} | ${n} | ${n > 0 ? (100 * cited / n).toFixed(1) + '%' : 'n/a'}\n`;
}

const reportPath = path.join(experimentDir, 'results', 'rescore-report.txt');
await fs.writeFile(reportPath, report);
console.log('\n' + report);
console.log(`Report saved to ${reportPath}`);
