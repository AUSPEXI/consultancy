#!/usr/bin/env node
/**
 * GEO Lab — Citation Results Analyzer
 *
 * Usage:
 *   node analyze.mjs <experiment-dir>
 *
 * Reads:  <experiment-dir>/results/raw.json
 * Writes: <experiment-dir>/FINDING.md
 */

import fs from 'fs/promises';
import path from 'path';

const experimentDir = process.argv[2];
if (!experimentDir) {
  console.error('Usage: node analyze.mjs <experiment-dir>');
  process.exit(1);
}

const rawPath = path.join(experimentDir, 'results', 'raw.json');
const raw = JSON.parse(await fs.readFile(rawPath, 'utf8').catch(() => {
  console.error(`No raw.json found. Run probe.mjs first.`);
  process.exit(1);
}));

const { meta, results } = raw;
const { variants, platforms } = meta;

// ── Two-proportion z-test ────────────────────────────────────────────────────
function twoProportionZ(p1, n1, p2, n2) {
  if (n1 === 0 || n2 === 0) return { z: 0, pValue: 1 };
  const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return { z: 0, pValue: 1 };
  const z = (p1 - p2) / se;
  // Two-tailed p-value approximation from z
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  return { z: +z.toFixed(3), pValue: +pValue.toFixed(4) };
}

function normalCDF(z) {
  // Abramowitz & Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const cdf = 1 - pdf * poly;
  return z >= 0 ? cdf : 1 - cdf;
}

function ci95(p, n) {
  if (n === 0) return [0, 0];
  const z = 1.96;
  const margin = z * Math.sqrt((p * (1 - p)) / n);
  return [+(Math.max(0, p - margin) * 100).toFixed(1), +(Math.min(1, p + margin) * 100).toFixed(1)];
}

// ── Aggregate citations ──────────────────────────────────────────────────────
const stats = {}; // stats[platform][variantId] = { cited, total }

for (const platform of platforms) {
  stats[platform] = {};
  for (const v of variants) {
    stats[platform][v] = { cited: 0, total: 0 };
  }
}

for (const r of results) {
  if (!stats[r.platform]) continue;
  for (const v of variants) {
    stats[r.platform][v].total++;
    if (r.citations[v]) stats[r.platform][v].cited++;
  }
}

// ── Build report ─────────────────────────────────────────────────────────────
const designText = await fs.readFile(path.join(experimentDir, 'DESIGN.md'), 'utf8').catch(() => '');
const hypothesisMatch = designText.match(/## Hypothesis\n([\s\S]*?)(?=\n## |\n$)/);
const hypothesis = hypothesisMatch?.[1]?.trim() ?? '(no hypothesis recorded)';

let report = `# Experiment Finding\n\n`;
report += `**Hypothesis**: ${hypothesis}\n\n`;
report += `**Run at**: ${meta.runAt}\n`;
report += `**Variants**: ${variants.join(', ')}\n`;
report += `**Platforms**: ${platforms.join(', ')}\n`;
report += `**Trials per variant**: ${meta.trialsPerVariant}\n\n`;

report += `---\n\n## Results by Platform\n\n`;

const allSignificant = [];
const allNonSignificant = [];

for (const platform of platforms) {
  report += `### ${platform.toUpperCase()}\n\n`;
  report += `| Variant | Cited | n | Citation Rate | 95% CI |\n`;
  report += `|---------|-------|---|---------------|--------|\n`;

  const rates = {};
  for (const v of variants) {
    const s = stats[platform][v];
    const rate = s.total > 0 ? s.cited / s.total : 0;
    rates[v] = { rate, n: s.total, cited: s.cited };
    const [lo, hi] = ci95(rate, s.total);
    report += `| ${v} | ${s.cited} | ${s.total} | ${(rate * 100).toFixed(1)}% | [${lo}%, ${hi}%] |\n`;
  }
  report += '\n';

  // Pairwise comparisons (control = first variant)
  const control = variants[0];
  for (let i = 1; i < variants.length; i++) {
    const treatment = variants[i];
    const ctrl = rates[control];
    const trt = rates[treatment];
    const { z, pValue } = twoProportionZ(trt.rate, trt.n, ctrl.rate, ctrl.n);
    const diff = ((trt.rate - ctrl.rate) * 100).toFixed(1);
    const sig = pValue < 0.05;
    const sigLabel = sig ? '✓ significant (p < 0.05)' : '✗ not significant';
    report += `**${treatment} vs ${control}**: ${diff > 0 ? '+' : ''}${diff}pp, z=${z}, p=${pValue} — ${sigLabel}\n\n`;
    if (sig) allSignificant.push({ platform, control, treatment, diff, pValue });
    else allNonSignificant.push({ platform, control, treatment, diff, pValue });
  }
}

// ── Cross-platform aggregate ─────────────────────────────────────────────────
report += `---\n\n## Aggregate (all platforms pooled)\n\n`;
report += `| Variant | Cited | n | Citation Rate |\n`;
report += `|---------|-------|---|---------------|\n`;

const agg = {};
for (const v of variants) {
  agg[v] = { cited: 0, total: 0 };
  for (const p of platforms) {
    agg[v].cited += stats[p][v].cited;
    agg[v].total += stats[p][v].total;
  }
  const rate = agg[v].total > 0 ? agg[v].cited / agg[v].total : 0;
  report += `| ${v} | ${agg[v].cited} | ${agg[v].total} | ${(rate * 100).toFixed(1)}% |\n`;
}
report += '\n';

// ── Plain-English conclusion ─────────────────────────────────────────────────
report += `---\n\n## Conclusion\n\n`;
if (allSignificant.length > 0) {
  report += `**Significant effects found** in ${allSignificant.length} comparison(s):\n`;
  for (const s of allSignificant) {
    report += `- On ${s.platform.toUpperCase()}: ${s.treatment} vs ${s.control}: ${s.diff > 0 ? '+' : ''}${s.diff}pp (p=${s.pValue})\n`;
  }
  report += '\n';
} else {
  report += `**No significant effects found** across any platform at α=0.05.\n\n`;
  report += `This is a valid null result. The tested variable does not appear to affect citation rates under these conditions.\n\n`;
}

// ── Threats to validity ──────────────────────────────────────────────────────
report += `---\n\n## Threats to Validity\n\n`;
report += `- **Model versioning**: Results reflect platform behaviour at time of run. Model updates may change these outcomes.\n`;
report += `- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.\n`;
report += `- **n=${meta.trialsPerVariant} per variant**: ${meta.trialsPerVariant >= 30 ? 'Meets the lab minimum.' : '⚠ Below the lab minimum of 30 — treat as preliminary.'}\n`;
report += `- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.\n`;
if (allSignificant.length > 1) {
  report += `- **Multiple comparisons**: ${allSignificant.length} simultaneous tests inflate the false-positive rate. Treat findings as exploratory unless pre-registered.\n`;
}

// ── Machine-readable finding ─────────────────────────────────────────────────
// Consumed by publish-finding.mjs to push results into the dashboard's
// content-recommendation loop. Keep this in sync with the prose report above.
const aggregate = {};
let bestVariant = null;
let bestRate = -1;
for (const v of variants) {
  const rate = agg[v].total > 0 ? agg[v].cited / agg[v].total : 0;
  aggregate[v] = { cited: agg[v].cited, total: agg[v].total, rate: +(rate * 100).toFixed(1) };
  if (allSignificant.length > 0 && rate > bestRate) {
    bestRate = rate;
    bestVariant = v;
  }
}

// Largest significant effect (absolute pp) — the headline a recommendation leans on.
const topEffect = allSignificant
  .map(s => ({ ...s, absDiff: Math.abs(parseFloat(s.diff)) }))
  .sort((a, b) => b.absDiff - a.absDiff)[0] || null;

const findingJson = {
  runAt: meta.runAt,
  variants,
  platforms,
  trialsPerVariant: meta.trialsPerVariant,
  hypothesis,
  aggregate,
  significant: allSignificant.map(s => ({
    platform: s.platform,
    control: s.control,
    treatment: s.treatment,
    diffPp: parseFloat(s.diff),
    pValue: s.pValue,
  })),
  verdict: allSignificant.length > 0 ? 'significant' : 'null',
  bestVariant,
  topEffect: topEffect
    ? { platform: topEffect.platform, treatment: topEffect.treatment, diffPp: parseFloat(topEffect.diff), pValue: topEffect.pValue }
    : null,
};

// ── Save ─────────────────────────────────────────────────────────────────────
await fs.writeFile(path.join(experimentDir, 'FINDING.md'), report);
await fs.writeFile(path.join(experimentDir, 'finding.json'), JSON.stringify(findingJson, null, 2) + '\n');
console.log(`\nFINDING.md + finding.json written to ${experimentDir}/`);
console.log('\nNext: node scripts/video-script.mjs ' + experimentDir);
