export type AgoMetrics = {
  agoCoherence: number; // 0..1
  symmetry72Loss: number; // lower is better
  resonance432: number; // 0..1
  stability137: number; // 0..1
};

export type AgoOptions = {
  phi?: number; // golden ratio ~1.618
  targetBpm?: number; // e.g., 72
};

function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

export function analyzeAGO(data: any[], schema: any, opts: AgoOptions = {}): AgoMetrics {
  const n = Math.max(1, data?.length || 0);
  const fields = data[0] ? Object.keys(data[0]) : [];
  const phi = opts.phi ?? 1.61803398875;
  const targetBpm = opts.targetBpm ?? 72;

  // Approximate 72° rotational symmetry across paired axes by checking pairwise correlations
  let symScore = 0; let pairs = 0;
  for (let i=0;i<fields.length;i++) {
    for (let j=i+1;j<fields.length;j++) {
      const a = data.map(r=>num(r[fields[i]]));
      const b = data.map(r=>num(r[fields[j]]));
      if (a.every(isFinite) && b.every(isFinite)) {
        const corr = pearson(a,b);
        symScore += Math.abs(corr);
        pairs++;
      }
    }
  }
  const symmetry72Loss = pairs? clamp01(1 - symScore/pairs) : 0.5;

  // 432 Hz resonance proxy: target cycles per sequence window using FFT-like bin count (cheap)
  const seq = seqFromField(data, fields[0]);
  const resonance432 = clamp01(spectralPeakScore(seq, 4.32));

  // 137 stability proxy via KL-like divergence of histograms against phi-scaled reference
  const st = stabilityScore(data, phi);

  // AGO coherence: blend of the three
  const agoCoherence = clamp01(0.4*(1-symmetry72Loss) + 0.35*resonance432 + 0.25*st);
  return { agoCoherence, symmetry72Loss, resonance432, stability137: st };
}

export function transformWithAGO(data: any[], schema: any, opts: AgoOptions = {}): { data: any[]; metrics: AgoMetrics } {
  // MVP: no heavy transform; return metrics over original data
  const metrics = analyzeAGO(data, schema, opts);
  return { data, metrics };
}

// Helpers
function num(v: any): number { const n = Number(v); return Number.isFinite(n)? n : 0; }
function mean(a: number[]): number { return a.reduce((x,y)=>x+y,0)/Math.max(1,a.length); }
function pearson(a: number[], b: number[]): number {
  const ma = mean(a), mb = mean(b);
  let nume=0, da=0, db=0;
  for (let i=0;i<a.length;i++){ const xa=a[i]-ma, xb=b[i]-mb; nume+=xa*xb; da+=xa*xa; db+=xb*xb; }
  const den = Math.sqrt(da*db)||1; return nume/den;
}
function seqFromField(data: any[], field?: string): number[] {
  if (!field) return [];
  return data.map(r=>num(r[field]));
}
function spectralPeakScore(seq: number[], target: number): number {
  if (seq.length<8) return 0.5;
  // Autocorrelation lag near target bins
  const maxLag = Math.min(32, Math.floor(seq.length/4));
  const ac: number[] = [];
  for (let lag=1; lag<=maxLag; lag++) {
    let s=0; let c=0; for (let i=lag;i<seq.length;i++){ s += seq[i]*seq[i-lag]; c++; }
    ac.push(c? s/c : 0);
  }
  const idx = Math.min(ac.length-1, Math.max(0, Math.round(target*2))); // coarse map 4.32→~9
  const peak = ac[idx] || 0;
  const norm = Math.max(1e-6, Math.max(...ac.map(v=>Math.abs(v))));
  return peak/norm;
}
function stabilityScore(data: any[], phi: number): number {
  if (!data.length) return 0.5;
  const fields = Object.keys(data[0]||{});
  let agg = 0; let cnt=0;
  for (const f of fields){
    const vals = data.map(r=>num(r[f]));
    const h = hist(vals, 8);
    const ref = hist(vals.map(v=>v/phi), 8);
    agg += jsDivergence(h, ref);
    cnt++;
  }
  const d = cnt? agg/cnt : 0.5;
  return clamp01(1 - d); // lower divergence => higher stability
}
function hist(arr: number[], bins: number): number[] {
  if (!arr.length) return new Array(bins).fill(0);
  const lo = Math.min(...arr), hi = Math.max(...arr); const w = (hi-lo)||1;
  const out = new Array(bins).fill(0);
  for (const v of arr){ const t = (v-lo)/w; const i = Math.min(bins-1, Math.max(0, Math.floor(t*bins))); out[i]++; }
  const n = arr.length; return out.map(x=>x/n);
}
function jsDivergence(p: number[], q: number[]): number {
  const m = p.map((pi,i)=>(pi + (q[i]||0))/2);
  return 0.5*(kl(p,m)+kl(q,m));
}
function kl(p: number[], q: number[]): number {
  let s=0; for (let i=0;i<p.length;i++){ const pi=p[i]||1e-12, qi=q[i]||1e-12; s += pi*Math.log2(pi/qi); } return s;
}


