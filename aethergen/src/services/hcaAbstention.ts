export type HcaMetrics = { abstainRate: number; calibratedGain: number };

export function harmonicConsensusAbstain(scores: number[], harmonicConf: number[], tau = 0.4, alpha = 0.5): { keep: boolean[]; metrics: HcaMetrics } {
  const keep: boolean[] = [];
  let kept=0;
  for (let i=0;i<scores.length;i++){
    const s = scores[i]||0; const h = harmonicConf[i]||0.5;
    const composite = alpha*h + (1-alpha)*s;
    const k = composite >= tau; keep.push(k); if(k) kept++;
  }
  const abstainRate = 1 - kept/Math.max(1, scores.length);
  const calibratedGain = Math.max(0, (average(scores.filter((_,i)=>keep[i])) - average(scores)) || 0);
  return { keep, metrics: { abstainRate, calibratedGain } };
}

function average(x:number[]){ if(!x.length) return 0; return x.reduce((a,b)=>a+b,0)/x.length; }


