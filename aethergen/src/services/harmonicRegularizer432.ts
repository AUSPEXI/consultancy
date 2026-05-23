export type HarmonicMetrics = {
  resonanceEntropy: number; // lower is tighter harmony
  cycleClosure: number; // 0..1, higher is better
  offGridVariance: number; // lower better vs 72 bpm grid
  chordPurity: number; // 0..1
};

const FIFTHS_ORDER = ['F','C','G','D','A','E','B'];

export function analyzeHarmony432(data: any[], fields: string[], bpm = 72): HarmonicMetrics {
  if (!data.length || fields.length<2) return { resonanceEntropy: 1, cycleClosure: 0.5, offGridVariance: 0.5, chordPurity: 0.5 };
  // Mutual information proxy via discretized correlation magnitudes
  const edges: number[] = [];
  for (let i=0;i<fields.length;i++){
    for (let j=i+1;j<fields.length;j++){
      const a = data.map(r=>Number(r[fields[i]])||0);
      const b = data.map(r=>Number(r[fields[j]])||0);
      const c = Math.abs(pearson(a,b));
      edges.push(c);
    }
  }
  const resonanceEntropy = shannonEntropy(edges);
  // Cycle closure: how many triplets align as fifths (co-linear correlations)
  const cycleClosure = clamp01(edges.filter(e=>e>0.6).length / Math.max(1, edges.length));
  // Off-grid timing variance vs bpm grid using a single numeric field
  const tfield = fields[0]; const seq = data.map(r=>Number(r[tfield])||0);
  const offGridVariance = clamp01(variance(modGrid(seq, bpm)));
  // Chord purity: ratio of strong edges to total
  const chordPurity = clamp01(edges.filter(e=>e>0.75).length / Math.max(1, edges.length));
  return { resonanceEntropy, cycleClosure, offGridVariance, chordPurity };
}

function clamp01(x:number){ return Math.max(0, Math.min(1,x)); }
function mean(a:number[]){ return a.reduce((x,y)=>x+y,0)/Math.max(1,a.length); }
function variance(a:number[]){ const m=mean(a); return a.reduce((s,v)=>s+(v-m)*(v-m),0)/Math.max(1,a.length); }
function pearson(a:number[],b:number[]){ const ma=mean(a), mb=mean(b); let n=0,da=0,db=0; for(let i=0;i<a.length;i++){const xa=a[i]-ma, xb=b[i]-mb; n+=xa*xb; da+=xa*xa; db+=xb*xb;} return n/(Math.sqrt(da*db)||1); }
function shannonEntropy(vals:number[]){ const bins = hist(vals, 10); return -bins.reduce((s,p)=> s + (p>0? p*Math.log2(p):0), 0)/Math.log2(bins.length||1); }
function hist(arr:number[], bins:number){ if(!arr.length) return new Array(bins).fill(0); const lo=Math.min(...arr), hi=Math.max(...arr); const w=(hi-lo)||1; const out=new Array(bins).fill(0); for(const v of arr){ const t=(v-lo)/w; const i=Math.min(bins-1, Math.max(0, Math.floor(t*bins))); out[i]++; } const n = arr.length; return out.map(x=>x/n); }
function modGrid(seq:number[], bpm:number){ if(seq.length<2) return [0]; const period = 60/Math.max(1,bpm); const base = seq[0]; return seq.map((t,i)=> ((t-base) % period) / period ); }


