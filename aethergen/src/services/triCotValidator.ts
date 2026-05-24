export type TriCoTMetrics = { tricotscore: number; pass: boolean; failures?: Array<[number,number,number]> };

export function certifyTriCoT(data: any[]): TriCoTMetrics {
  if (!data?.length) return { tricotscore: 0.5, pass: false };
  const fields = Object.keys(data[0]||{});
  const nums = fields.filter(f=>typeof data[0]?.[f] === 'number').slice(0, 3);
  if (nums.length<3) return { tricotscore: 0.5, pass: false };
  const pts = data.map(r=> nums.map(f=> Number(r[f])||0));
  let ok=0, tot=0; const fails: Array<[number,number,number]> = [];
  for (let i=0;i<pts.length-2;i+=3){ const a=pts[i], b=pts[i+1], c=pts[i+2]; const curv = triangleCurvature(a,b,c); const pers = simplexPersistence(a,b,c); const score = 1/(1+Math.abs(curv)) * pers; const pass = score>0.6; if(pass) ok++; else fails.push([i,i+1,i+2]); tot++; }
  const tricotscore = tot? ok/tot : 0.5;
  return { tricotscore, pass: tricotscore>0.7, failures: fails };
}

function triangleCurvature(a:number[], b:number[], c:number[]): number {
  // proxy: area/edge^2 variation
  const area = Math.abs( (a[0]*(b[1]-c[1]) + b[0]*(c[1]-a[1]) + c[0]*(a[1]-b[1])) )/2;
  const e2 = dist2(a,b)+dist2(b,c)+dist2(c,a) || 1;
  return area / e2;
}
function dist2(x:number[], y:number[]):number{ let s=0; for(let i=0;i<Math.min(x.length,y.length);i++){ const d=x[i]-y[i]; s+=d*d; } return s; }
function simplexPersistence(a:number[],b:number[],c:number[]):number{ // 0..1
  const d = Math.max(Math.sqrt(dist2(a,b)), Math.sqrt(dist2(b,c)), Math.sqrt(dist2(c,a)));
  return Math.max(0, Math.min(1, 1/(1+d)));
}


