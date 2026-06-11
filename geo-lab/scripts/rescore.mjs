#!/usr/bin/env node
/**
 * GEO Lab — Canonical citation scorer.
 *
 * Scores every stored response in raw.json by CONTENT FINGERPRINT: did the
 * response reproduce text that is UNIQUE to a given variant? This is the robust
 * way to attribute citations because:
 *   - Models mislabel sources (they'll quote variant B's stat but call it
 *     "Source A"), so label-based detection is noisy.
 *   - It needs no shuffleMap, so old and new records score identically.
 *   - It directly measures the experimental question: did the variant's
 *     distinctive content surface in the answer?
 *
 * Fingerprints are AUTO-DERIVED by diffing the variants — phrases present in one
 * variant but in no other. No per-experiment hardcoding.
 *
 * Run this BEFORE analyze.mjs so all records are scored consistently.
 *
 * Usage:  node scripts/rescore.mjs <experiment-dir>
 * Writes: <experiment-dir>/results/raw.json   (citations corrected in-place)
 *         <experiment-dir>/results/rescore-report.txt
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

// ── Load variants ────────────────────────────────────────────────────────────
const variantsDir = path.join(experimentDir, 'variants');
const variantFiles = (await fs.readdir(variantsDir)).filter(f => f.endsWith('.md'));
const variants = await Promise.all(
  variantFiles.map(async f => ({
    id: f.replace('.md', ''),
    content: await fs.readFile(path.join(variantsDir, f), 'utf8'),
  }))
);

// ── Auto-derive unique fingerprints by diffing variants ──────────────────────
// Normalise text, break into overlapping word-windows, keep windows that occur
// in exactly one variant.
function normalise(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, ' ')   // strip HTML comments
    .replace(/^#+\s.*$/gm, ' ')          // strip markdown headers
    .toLowerCase()
    .replace(/[^\w\s%]/g, ' ')           // keep word chars, spaces, %
    .replace(/\s+/g, ' ')
    .trim();
}

function windows(text, size = 5) {
  const words = text.split(' ');
  const out = [];
  for (let i = 0; i <= words.length - size; i++) {
    out.push(words.slice(i, i + size).join(' '));
  }
  return out;
}

const normalised = variants.map(v => ({ id: v.id, norm: normalise(v.content) }));

// Count window occurrences across all variants
const fingerprints = {};
for (const { id, norm } of normalised) {
  const myWindows = new Set(windows(norm));
  const unique = [];
  for (const w of myWindows) {
    // Skip windows that are mostly stopwords / too short on signal
    const otherHasIt = normalised.some(o => o.id !== id && o.norm.includes(w));
    if (!otherHasIt) unique.push(w);
  }
  fingerprints[id] = unique;
}

console.log('\nAuto-derived unique fingerprints per variant:');
for (const v of variants) {
  console.log(`  ${v.id}: ${fingerprints[v.id].length} unique phrases` +
    (fingerprints[v.id][0] ? ` (e.g. "${fingerprints[v.id][0]}")` : ' — WARNING: none found'));
}

// Guard: if any variant has no unique fingerprint, scoring is impossible.
const variantsWithoutFingerprint = variants.filter(v => fingerprints[v.id].length === 0);
if (variantsWithoutFingerprint.length > 0) {
  console.error(`\n❌ No unique fingerprint for: ${variantsWithoutFingerprint.map(v => v.id).join(', ')}`);
  console.error('   Variants are too similar to score by content. Aborting (citations unchanged).');
  process.exit(1);
}

// ── Score each response ──────────────────────────────────────────────────────
function score(response) {
  const cited = {};
  variants.forEach(v => { cited[v.id] = false; });
  if (!response) return cited;
  const norm = normalise(response);
  for (const v of variants) {
    cited[v.id] = fingerprints[v.id].some(fp => norm.includes(fp));
  }
  return cited;
}

let total = 0, changed = 0;
const results = raw.results.map(r => {
  if (!r.response) return r;
  total++;
  const newCitations = score(r.response);
  const old = r.citations || {};
  if (variants.some(v => newCitations[v.id] !== old[v.id])) changed++;
  return { ...r, citations: newCitations };
});

await fs.writeFile(rawPath, JSON.stringify({ ...raw, results }, null, 2));

// ── Report ───────────────────────────────────────────────────────────────────
const tally = {};
variants.forEach(v => { tally[v.id] = { cited: 0, n: 0 }; });
for (const r of results) {
  if (!r.response) continue;
  for (const v of variants) {
    tally[v.id].n++;
    if (r.citations[v.id]) tally[v.id].cited++;
  }
}

let report = `Canonical rescore — ${new Date().toISOString()}\n`;
report += `Scored ${total} responses; ${changed} citation records changed.\n`;
report += `Method: content-fingerprint (auto-derived unique phrases per variant)\n\n`;
report += `Variant | Cited | N | Rate\n--------|-------|---|-----\n`;
for (const v of variants) {
  const { cited, n } = tally[v.id];
  report += `${v.id.padEnd(7)} | ${String(cited).padEnd(5)} | ${n} | ${n ? (100 * cited / n).toFixed(1) + '%' : 'n/a'}\n`;
}

await fs.writeFile(path.join(experimentDir, 'results', 'rescore-report.txt'), report);
console.log(`\nScored ${total} responses, ${changed} changed.\n\n${report}`);
