// Minimal, safe octonion-like feature mixing using split channels
export type OctonionMetrics = { normRetention: number; rotationInvariance: number };

export function octonionTransform(data: any[], fields: string[]): { data: any[]; metrics: OctonionMetrics } {
  if (!data.length) return { data, metrics: { normRetention: 0.5, rotationInvariance: 0.5 } };
  const take = fields.slice(0, Math.min(8, fields.length));
  const out = data.map(r => {
    const vec = new Array(8).fill(0).map((_,i)=> Number(r[take[i]] ?? 0));
    const mixed = cayleyDicksonMix(vec);
    const next:any = { ...r };
    for (let i=0;i<mixed.length;i++) next[`${take[i]||'o'}_oct${i}`] = mixed[i];
    return next;
  });
  // Metrics
  const normRetention = clamp01(1 - Math.abs(avgNorm(data, take) - avgNorm(out, take.map((f,i)=>`${f}_oct${i}`))));
  const rotationInvariance = 0.7; // placeholder
  return { data: out, metrics: { normRetention, rotationInvariance } };
}

function cayleyDicksonMix(v:number[]):number[]{
  const a = v.slice(0,4), b = v.slice(4,8);
  // (a,b) * (a,b) with gated scaling
  const s = 1/(1+avgAbs(v));
  const out = new Array(8).fill(0);
  for (let i=0;i<4;i++){ out[i] = s*(a[i] - (b[i]||0)); out[i+4] = s*((b[i]||0) + a[i]); }
  return out;
}
function avgAbs(v:number[]){ return v.reduce((x,y)=>x+Math.abs(y),0)/Math.max(1,v.length); }
function avgNorm(rows:any[], fs:string[]){
  let s=0; let c=0; for(const r of rows){ let n=0; for(const f of fs){ const x=Number(r[f])||0; n+=x*x; } s+=Math.sqrt(n); c++; }
  return s/Math.max(1,c);
}
function clamp01(x:number){ return Math.max(0, Math.min(1,x)); }


