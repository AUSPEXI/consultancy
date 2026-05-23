export type AumMetrics = {
  aumScore: number; // 0..1
  sustainSmoothness: number; // 0..1
  fadeSymmetry: number; // 0..1
  pass: boolean;
  certificateId: string;
  failures?: string[];
};

export function computeAUM(data: any[], fields: string[]): AumMetrics {
  if (!data.length || fields.length===0) return base(false, ['no_data']);
  const seq = data.map(r=>Number(r[fields[0]])||0);
  const n = seq.length;
  const third = Math.max(1, Math.floor(n/3));
  const A = seq.slice(0, third);
  const U = seq.slice(third, 2*third);
  const M = seq.slice(2*third);
  const vA = variance(A), vU = variance(U), vM = variance(M);
  const sustainSmoothness = clamp01(1/(1+Math.abs(vU - (vA+vM)/2)));
  const fadeSymmetry = clamp01(1 - Math.abs(mean(M) - mean(A)) / (Math.abs(mean(A))+Math.abs(mean(M))+1e-6));
  const aumScore = clamp01(0.5*sustainSmoothness + 0.5*fadeSymmetry);
  const pass = aumScore > 0.6 && sustainSmoothness > 0.55 && fadeSymmetry > 0.55;
  return { aumScore, sustainSmoothness, fadeSymmetry, pass, certificateId: `AUM_${hash(seq)}` };
}

function clamp01(x:number){ return Math.max(0, Math.min(1,x)); }
function mean(a:number[]){ return a.reduce((x,y)=>x+y,0)/Math.max(1,a.length); }
function variance(a:number[]){ const m=mean(a); return a.reduce((s,v)=>s+(v-m)*(v-m),0)/Math.max(1,a.length); }
function base(pass:boolean, failures:string[]):AumMetrics{ return { aumScore: 0.5, sustainSmoothness: 0.5, fadeSymmetry: 0.5, pass, certificateId: 'AUM_none', failures }; }
function hash(arr:number[]):string{ let h=2166136261>>>0; for(const x of arr){ const v=Math.floor((x*1e6) % 2**32); h^=v; h=Math.imul(h,16777619);} return (h>>>0).toString(16); }


