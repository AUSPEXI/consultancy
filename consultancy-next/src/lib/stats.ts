// Shared frequentist stats for the product probe — ported from the geo-lab
// analyzer so the dashboard's head-to-head claims carry the same rigor as the
// research lab (a competitor comparison should report a p-value, not bare bars).

// Abramowitz–Stegun erf approximation (max error ~1.5e-7).
function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return Math.sign(x) * y;
}

// Standard normal CDF.
export function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

export interface TwoProportionResult {
  diffPp: number;   // (p1 - p2) in percentage points
  z: number;
  pValue: number;   // two-sided
}

// Two-proportion z-test (pooled). k successes out of n trials for each group.
export function twoProportionZ(k1: number, n1: number, k2: number, n2: number): TwoProportionResult {
  if (n1 === 0 || n2 === 0) return { diffPp: 0, z: 0, pValue: 1 };
  const p1 = k1 / n1;
  const p2 = k2 / n2;
  const pPool = (k1 + k2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  const z = se === 0 ? 0 : (p1 - p2) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  return { diffPp: Number(((p1 - p2) * 100).toFixed(1)), z: Number(z.toFixed(3)), pValue: Number(pValue.toFixed(4)) };
}

export type HeadToHeadVerdict = 'ahead' | 'behind' | 'inconclusive';

// Honest verdict for a brand-vs-competitor comparison at this sample size.
// Significant only at p < 0.05; otherwise "inconclusive at this n" — never claim
// a win the data can't support.
export function headToHeadVerdict(youK: number, youN: number, themK: number, themN: number): {
  verdict: HeadToHeadVerdict;
} & TwoProportionResult {
  const t = twoProportionZ(youK, youN, themK, themN);
  let verdict: HeadToHeadVerdict = 'inconclusive';
  if (t.pValue < 0.05) verdict = t.diffPp > 0 ? 'ahead' : 'behind';
  return { ...t, verdict };
}
