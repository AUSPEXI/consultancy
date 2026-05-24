export type Causal8DMetrics = {
  invariantDrift: number; // lower better
  odeSmoothness: number; // 0..1
  causalPlausibility: number; // 0..1
};

export function analyzeCausal8D(data: any[], schema: any): Causal8DMetrics {
  if (!data?.length) return { invariantDrift: 0.5, odeSmoothness: 0.5, causalPlausibility: 0.5 };
  const fields = Object.keys(data[0]||{});
  // Invariant drift via sum conservation over top numeric fields
  const nums = fields.filter(f=>typeof data[0]?.[f]==='number');
  const take = nums.slice(0, Math.min(4, nums.length));
  const series = take.map(f=>data.map(r=>Number(r[f])||0));
  const totals = series.map(s=>s.reduce((a,b)=>a+b,0));
  const inv = variance(totals.map(x=>x/totals[0]||1));
  const invariantDrift = clamp01(inv);
  // ODE smoothness via second-difference energy
  const sd = take.length? mean(take.map(s=>secondDiffEnergy(s))):0.5;
  const odeSmoothness = clamp01(1/(1+sd));
  // Causal plausibility via lagged correlation (leading indicators)
  const cp = take.length>=2? meanLaggedCorr(series[0], series[1]):0.5;
  const causalPlausibility = clamp01((cp+1)/2);
  return { invariantDrift, odeSmoothness, causalPlausibility };
}

export function transformCausal8D(data: any[], schema: any){
  // Placeholder: identity transform with metrics
  return { data, metrics: analyzeCausal8D(data, schema) };
}

function clamp01(x:number){ return Math.max(0, Math.min(1, x)); }
function mean(a:number[]){ return a.reduce((x,y)=>x+y,0)/Math.max(1,a.length); }
function variance(a:number[]){ const m=mean(a); return a.reduce((s,v)=>s+(v-m)*(v-m),0)/Math.max(1,a.length); }
function secondDiffEnergy(seq:number[]):number{ if (seq.length<3) return 0; let s=0; for(let i=2;i<seq.length;i++){ const d=seq[i]-2*seq[i-1]+seq[i-2]; s+=d*d; } return s/seq.length; }
function meanLaggedCorr(a:number[], b:number[]):number {
  const lags = [1,2,3];
  const cs = lags.map(l=>pearson(a.slice(l), b.slice(0, b.length-l)));
  return mean(cs);
}
function pearson(a:number[], b:number[]):number{ if(!a.length||a.length!==b.length) return 0; const ma=mean(a), mb=mean(b); let n=0,da=0,db=0; for(let i=0;i<a.length;i++){ const xa=a[i]-ma, xb=b[i]-mb; n+=xa*xb; da+=xa*xa; db+=xb*xb; } const den=Math.sqrt(da*db)||1; return n/den; }


