import { analyzeAGO } from './agoResonantHypercube';
import { analyzeHarmony432 } from './harmonicRegularizer432';
import { computeAUM } from './aumCertificate';
import { certifyTriCoT } from './triCotValidator';

export type FroScores = {
  ago: number;
  harm: number; // 1 - resonanceEntropy
  aum: number;
  tricots: number;
  frs: number;
};

export type FroMirror = Array<{ scale: number; variantIndex: number; scores: FroScores }>;

export type FroResult = {
  frs: number;
  best: any[];
  scales: number;
  mirror: FroMirror;
};

export function runFractalResonanceOracle(data: any[], schema: any, opts?: { scales?: number; variantsPerScale?: number }): FroResult {
  const scales = Math.max(1, Math.min(5, opts?.scales ?? 3));
  const k = Math.max(2, Math.min(6, opts?.variantsPerScale ?? 3));
  const fields = Object.keys(data[0]||{});
  const mirror: FroMirror = [];
  const frsPerScale: number[] = [];
  let bestVariant: any[] = data;

  for (let s=0; s<scales; s++) {
    let bestScore = -1; let bestV: any[] = data;
    for (let v=0; v<k; v++) {
      const variant = variantAtScale(data, fields, s, v);
      const scores = scoreVariant(variant, schema);
      mirror.push({ scale: s, variantIndex: v, scores });
      if (scores.frs > bestScore) { bestScore = scores.frs; bestV = variant; }
    }
    bestVariant = bestV;
    frsPerScale.push(bestScore);
  }

  const frs = Math.max(0, Math.min(1, frsPerScale.reduce((a,b)=>a+b,0)/Math.max(1, frsPerScale.length) - 0.05*variance(frsPerScale)));
  return { frs, best: bestVariant, scales, mirror };
}

function variantAtScale(data: any[], fields: string[], s: number, v: number): any[] {
  const out: any[] = [];
  const alpha = 0.01 + 0.01*s; // scale growth
  const omega = 40 + 10*s;     // 432-like periodicity proxy
  for (let i=0;i<data.length;i++){
    const rec: any = { ...data[i] };
    for (const f of fields){
      const val = rec[f];
      if (typeof val === 'number'){
        // recursive modulation and sparsity gates
        const warm = (i+v) % 3 === 0 ? (1 + alpha) : ( (i+v)%3===2 ? (1 - alpha) : 1 );
        const mod = Math.sin(2*Math.PI*((i+1+v)/omega)) * (0.01 + 0.005*s);
        rec[f] = (val * warm) + mod;
      }
    }
    out.push(rec);
  }
  return out;
}

function scoreVariant(variant: any[], schema: any): FroScores {
  const fields = Object.keys(variant[0]||{});
  const ago = analyzeAGO(variant, schema).agoCoherence;
  const harm = Math.max(0, 1 - (analyzeHarmony432(variant, fields).resonanceEntropy||0));
  const aum = computeAUM(variant, fields).aumScore;
  const tricots = certifyTriCoT(variant).tricotscore;
  const frs = clamp01(0.35*ago + 0.25*harm + 0.2*aum + 0.2*tricots);
  return { ago, harm, aum, tricots, frs };
}

function clamp01(x:number){ return Math.max(0, Math.min(1,x)); }
function mean(a:number[]){ return a.reduce((x,y)=>x+y,0)/Math.max(1,a.length); }
function variance(a:number[]){ const m=mean(a); return a.reduce((s,v)=>s+(v-m)*(v-m),0)/Math.max(1,a.length); }


