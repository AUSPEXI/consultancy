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
  // Wilson score interval — correct at the boundaries (a normal-approx CI
  // wrongly collapses to [0,0] at p=0 and [100,100] at p=1).
  const z = 1.96, z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  const lo = Math.max(0, (centre - margin) / denom);
  const hi = Math.min(1, (centre + margin) / denom);
  return [+(lo * 100).toFixed(1), +(hi * 100).toFixed(1)];
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

// ── Temporal spread analysis ─────────────────────────────────────────────────
// Good temporal coverage means results aren't a snapshot of one model state.
// We flag experiments collected over < 5 days as having low temporal coverage.
const timestamps = results.map(r => r.timestamp).filter(Boolean).map(t => new Date(t).getTime());
const minTs = Math.min(...timestamps);
const maxTs = Math.max(...timestamps);
const collectionSpanDays = timestamps.length > 1 ? (maxTs - minTs) / (1000 * 60 * 60 * 24) : 0;

// Daily trial counts — useful for seeing if collection was uniform or bursty
const byDay = {};
for (const r of results) {
  if (!r.timestamp) continue;
  const day = r.timestamp.slice(0, 10);
  byDay[day] = (byDay[day] ?? 0) + 1;
}
const dayEntries = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));

// ── Model drift detection ────────────────────────────────────────────────────
// If a platform's model string changed mid-experiment, results from different
// batches are not strictly comparable. Warn in the report.
const modelVersions = meta.modelVersions ?? {};
const driftedPlatforms = Object.entries(modelVersions)
  .filter(([, versions]) => versions.length > 1)
  .map(([p, versions]) => ({ platform: p, versions }));

// ── Build report ─────────────────────────────────────────────────────────────
const designText = await fs.readFile(path.join(experimentDir, 'DESIGN.md'), 'utf8').catch(() => '');
const hypothesisMatch = designText.match(/## Hypothesis\n([\s\S]*?)(?=\n## |\n$)/);
const hypothesis = hypothesisMatch?.[1]?.trim() ?? '(no hypothesis recorded)';

let report = `# Experiment Finding\n\n`;
report += `**Hypothesis**: ${hypothesis}\n\n`;
report += `**Run at**: ${meta.runAt}\n`;
report += `**Collection window**: ${collectionSpanDays >= 1 ? `${collectionSpanDays.toFixed(1)} days` : `< 1 day`} (${new Date(minTs).toISOString().slice(0,10)} → ${new Date(maxTs).toISOString().slice(0,10)})\n`;
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

// ── Cross-platform aggregate (primary endpoint) ──────────────────────────────
// The aggregate test is pre-registered as the PRIMARY endpoint. Per-platform
// tests are exploratory and subject to multiple-comparisons inflation.
// Bonferroni-corrected threshold for k per-platform tests: α_adj = 0.05 / k.
const kTests = platforms.length;
const bonferroniAlpha = +(0.05 / kTests).toFixed(4);
report += `---\n\n## Aggregate (all platforms pooled) — PRIMARY ENDPOINT\n\n`;
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

// Aggregate significance test (primary endpoint)
const [aggControl, ...aggTreatments] = variants;
for (const trt of aggTreatments) {
  const ctrl = agg[aggControl];
  const trtS = agg[trt];
  const ctrlRate = ctrl.total > 0 ? ctrl.cited / ctrl.total : 0;
  const trtRate  = trtS.total  > 0 ? trtS.cited  / trtS.total  : 0;
  const { z: aggZ, pValue: aggP } = twoProportionZ(trtRate, trtS.total, ctrlRate, ctrl.total);
  const aggDiff = +((trtRate - ctrlRate) * 100).toFixed(1);
  const aggSig = aggP < 0.05;
  report += `**Aggregate ${trt} vs ${aggControl}** (primary): ${aggDiff > 0 ? '+' : ''}${aggDiff}pp, z=${aggZ}, p=${aggP} — ${aggSig ? '✓ significant' : '✗ not significant'}\n\n`;
}

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

// Temporal coverage
if (collectionSpanDays < 5) {
  report += `- **⚠ Low temporal coverage**: All ${results.length} trials collected over ${collectionSpanDays < 1 ? '< 1 day' : `${collectionSpanDays.toFixed(1)} days`}. Results reflect a narrow snapshot of model behaviour. Target ≥ 10 days for robust temporal coverage.\n`;
  report += `  - Trials per day: ${dayEntries.map(([d, n]) => `${d}: ${n}`).join(', ')}\n`;
} else {
  report += `- **Temporal coverage**: ${collectionSpanDays.toFixed(1)}-day collection window. ${collectionSpanDays >= 10 ? 'Good.' : 'Acceptable — 10+ days preferred.'}\n`;
  report += `  - Trials per day: ${dayEntries.map(([d, n]) => `${d}: ${n}`).join(', ')}\n`;
}

// Model drift
if (driftedPlatforms.length > 0) {
  report += `- **⚠ Model drift detected**: The following platforms served different model versions during collection — results from different batches may not be strictly comparable:\n`;
  for (const { platform, versions } of driftedPlatforms) {
    report += `  - ${platform.toUpperCase()}: ${versions.join(' → ')}\n`;
  }
} else {
  report += `- **Model versions stable**: No model version changes detected across batches (${Object.entries(meta.modelVersions ?? {}).map(([p, v]) => `${p}: ${v[0]}`).join(', ')}).\n`;
}

report += `- **Fast-mode vs live index**: This experiment tests in-context retrieval preference, not parametric training weight. Live-mode tests would be required for stronger external validity.\n`;
if (raw.attribution?.lowSensitivity) {
  report += `- **⚠ Low attribution sensitivity**: the variants share almost all text (smallest unique-fingerprint set = ${raw.attribution.minUniqueFingerprints}). The content-fingerprint scorer can barely tell them apart, so a null result here may be a measurement artifact rather than a true no-effect. Treat any null with extreme caution; make the variants more distinct on the tested dimension.\n`;
}
{
  const fv = variants[0];
  const perPlatformN = stats[platforms[0]]?.[fv]?.total ?? 0;
  const pooledN = platforms.reduce((sum, p) => sum + (stats[p]?.[fv]?.total ?? 0), 0);
  report += `- **Sample size**: ${perPlatformN} trials per platform-variant (${pooledN} pooled per variant). ${perPlatformN >= 30 ? 'Meets the lab minimum of 30 per platform-variant.' : '⚠ Below the lab minimum of 30 per platform-variant — treat as preliminary.'}\n`;
}
report += `- **Single variable assumption**: Valid only if variants differ in exactly the tested dimension.\n`;
report += `- **Multiple comparisons**: ${kTests} per-platform tests run alongside the primary aggregate test. Bonferroni-corrected α for per-platform comparisons = ${bonferroniAlpha}. Per-platform results with p > ${bonferroniAlpha} are exploratory.\n`;

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
  firstRunAt: meta.firstRunAt ?? null,
  collectionSpanDays: +collectionSpanDays.toFixed(1),
  collectionDays: dayEntries.map(([date, n]) => ({ date, n })),
  modelVersions: meta.modelVersions ?? {},
  modelDrift: driftedPlatforms.length > 0,
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
