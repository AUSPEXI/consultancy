#!/usr/bin/env node
/**
 * GEO Lab — Programme-level False Discovery Rate (FDR) ledger.
 *
 * Running ~1 significance test per experiment means that across the whole
 * research programme, by chance alone some "significant" findings are false
 * positives (~1 in 20 at α=0.05). A within-experiment p-value can't see this.
 *
 * This applies a Benjamini–Hochberg FDR correction across EVERY experiment's
 * primary endpoint (the CMH p-value), writes the resulting q-value back into each
 * finding.json, and emits results/ledger.json. A finding "survives FDR" when its
 * q-value < 0.05 — the honest, programme-wide bar.
 *
 * "Every claim on our dashboard is FDR-controlled across our entire research
 * programme" is a sentence competitors cannot say. That's the point.
 *
 * Usage: node scripts/fdr-ledger.mjs   (run from geo-lab/, after analyze)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dir, '..');
const experimentsDir = path.join(root, 'experiments');
const ALPHA = 0.05;

// Primary endpoint = the stratified CMH p-value (falls back to the headline
// effect's p-value if CMH isn't present).
function primaryP(f) {
  const cmh = Array.isArray(f.cmh) ? f.cmh[0] : f.cmh;
  if (cmh && typeof cmh.pValue === 'number') return cmh.pValue;
  if (f.topEffect && typeof f.topEffect.pValue === 'number') return f.topEffect.pValue;
  return null;
}

const dirs = (await fs.readdir(experimentsDir, { withFileTypes: true }))
  .filter(d => d.isDirectory() && !d.name.startsWith('_'))
  .map(d => d.name)
  .sort();

const items = [];
for (const d of dirs) {
  const fp = path.join(experimentsDir, d, 'finding.json');
  let f;
  try { f = JSON.parse(await fs.readFile(fp, 'utf8')); } catch { continue; }
  const p = primaryP(f);
  if (p === null) continue;
  items.push({ dir: d, path: fp, finding: f, p });
}

if (items.length === 0) {
  console.log('[fdr-ledger] No finding.json with a primary p-value found — nothing to do.');
  process.exit(0);
}

// Benjamini–Hochberg: sort ascending by p; q_i = p_i * m / rank; enforce
// monotonicity from the largest rank down so q is non-decreasing in p.
items.sort((a, b) => a.p - b.p);
const m = items.length;
let prevQ = 1;
for (let i = m - 1; i >= 0; i--) {
  const rank = i + 1;
  const q = Math.min(prevQ, (items[i].p * m) / rank);
  items[i].q = q;
  prevQ = q;
}

const computedAt = new Date().toISOString();
for (const it of items) {
  const qValue = Number(it.q.toFixed(4));
  it.finding.qValue = qValue;
  it.finding.fdr = {
    method: 'benjamini-hochberg',
    alpha: ALPHA,
    programmeSize: m,
    primaryP: it.p,
    qValue,
    survivesFdr: it.q < ALPHA,
    computedAt,
  };
  await fs.writeFile(it.path, JSON.stringify(it.finding, null, 2) + '\n');
}

const ledger = {
  method: 'benjamini-hochberg',
  alpha: ALPHA,
  programmeSize: m,
  computedAt,
  entries: items
    .slice()
    .sort((a, b) => a.q - b.q)
    .map(it => ({
      experiment: it.dir,
      lever: it.finding.lever ?? it.finding.slug ?? it.dir,
      verdict: it.finding.verdict ?? null,
      primaryP: it.p,
      qValue: Number(it.q.toFixed(4)),
      survivesFdr: it.q < ALPHA,
    })),
};

const resultsDir = path.join(root, 'results');
await fs.mkdir(resultsDir, { recursive: true });
await fs.writeFile(path.join(resultsDir, 'ledger.json'), JSON.stringify(ledger, null, 2) + '\n');

const survivors = ledger.entries.filter(e => e.survivesFdr).length;
console.log(`[fdr-ledger] ${m} experiments · ${survivors} survive FDR (q < ${ALPHA}) · wrote results/ledger.json + qValue into each finding.json`);
for (const e of ledger.entries) {
  console.log(`  ${e.survivesFdr ? '✓' : '·'} ${e.experiment}: p=${e.primaryP} → q=${e.qValue}`);
}
