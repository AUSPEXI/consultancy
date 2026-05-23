import { analyzeAGO } from './agoResonantHypercube';
import { analyzeHarmony432 } from './harmonicRegularizer432';
import { computeAUM } from './aumCertificate';
import { certifyTriCoT } from './triCotValidator';

export type VacuumPatch = { scale: number; energy: number; frs: number; ago: number; harm: number; aum: number; tricots: number };
export type VacuumResult = { galaxies: any[][]; vacuumScore: number; patches: VacuumPatch[] };

export function computeVacuumScore(data: any[]): number {
  if (!data?.length) return 0.5;
  const n = data.length;
  const fields = Object.keys(data[0] || {});
  const unique = new Set(data.map(r => JSON.stringify(r))).size / Math.max(1, n);
  // approximate categorical entropy over a few fields
  let ent = 0; let cnt = 0;
  for (const f of fields.slice(0, 5)) {
    const vals = data.map(r => r[f]).filter(v => typeof v === 'string' || typeof v === 'boolean');
    if (vals.length < 2) continue;
    const freq: Record<string, number> = {};
    for (const v of vals) { const s = String(v); freq[s] = (freq[s] || 0) + 1; }
    const total = vals.length;
    const ps = Object.values(freq).map(c => c / total);
    const H = -ps.reduce((a, p) => a + (p > 0 ? p * Math.log2(p) : 0), 0);
    const Hn = Object.keys(freq).length > 1 ? H / Math.log2(Object.keys(freq).length) : 0;
    ent += Hn; cnt++;
  }
  const entropy = cnt ? ent / cnt : 0.6;
  return clamp01(0.6 * unique + 0.4 * entropy);
}

export function runVRME(seedData: any[], schema: any, opts?: { lambda?: number; scales?: number; variants?: number }): VacuumResult {
  const lambda = Math.max(0.05, Math.min(3, opts?.lambda ?? 0.7));
  const scales = Math.max(1, Math.min(5, opts?.scales ?? 3));
  const variants = Math.max(2, Math.min(6, opts?.variants ?? 3));
  const fields = Object.keys(seedData[0] || {});
  const patches: VacuumPatch[] = [];
  let bests: any[][] = [];

  for (let s = 0; s < scales; s++) {
    let bestFrs = -1; let bestGalaxy: any[] = seedData;
    for (let v = 0; v < variants; v++) {
      const energy = sampleExp(lambda);
      const variant = generatePatch(seedData, fields, energy, s);
      const { frs, ago, harm, aum, tricots } = scoreVariant(variant, schema);
      patches.push({ scale: s, energy, frs, ago, harm, aum, tricots });
      if (frs > bestFrs) { bestFrs = frs; bestGalaxy = variant; }
    }
    bests.push(bestGalaxy);
  }

  const vacuumScore = clamp01(bests.reduce((a, g) => a + computeVacuumScore(g), 0) / Math.max(1, bests.length));
  return { galaxies: bests, vacuumScore, patches };
}

function generatePatch(data: any[], fields: string[], energy: number, scale: number): any[] {
  const amp = 0.01 + 0.02 * energy + 0.01 * scale;
  const omega = 40 + 10 * scale;
  const out: any[] = [];
  for (let i = 0; i < data.length; i++) {
    const rec: any = { ...data[i] };
    const phase = i % 3; // AGO
    for (const f of fields) {
      const v = rec[f];
      if (typeof v === 'number') {
        let w = v;
        if (phase === 0) w *= (1 + 0.02 * energy);
        if (phase === 2) w *= (1 - 0.02 * energy);
        w += amp * Math.sin(2 * Math.PI * ((i + 1) / omega));
        rec[f] = w;
      }
    }
    out.push(rec);
  }
  return out;
}

function scoreVariant(variant: any[], schema: any) {
  const fields = Object.keys(variant[0] || {});
  const ago = analyzeAGO(variant, schema).agoCoherence;
  const harm = Math.max(0, 1 - (analyzeHarmony432(variant, fields).resonanceEntropy || 0));
  const aum = computeAUM(variant, fields).aumScore;
  const tricots = certifyTriCoT(variant).tricotscore;
  const frs = clamp01(0.35 * ago + 0.25 * harm + 0.2 * aum + 0.2 * tricots);
  return { frs, ago, harm, aum, tricots };
}

function sampleExp(lambda: number): number { // exponential with mean 1/lambda normalized to 0..1
  const u = Math.random();
  const x = -Math.log(1 - u) / lambda;
  return Math.min(1, x / (1 + x));
}

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }


