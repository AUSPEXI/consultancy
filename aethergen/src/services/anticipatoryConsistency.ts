export type ACIMetrics = { aci: number; fieldSensitivity: Record<string, number> };

export function computeACI(data: any[]): ACIMetrics {
  if (!data?.length) return { aci: 0.5, fieldSensitivity: {} };
  const fields = Object.keys(data[0]||{});
  const sens: Record<string, number> = {};
  let agreements: number[] = [];
  for (const f of fields){
    const vals = data.map(r=> Number((r as any)[f]) || 0);
    // bootstrap subspace: compare median directions under noise
    const a = direction(vals);
    const b = direction(vals.map(v=>v + gaussian(0, 0.1*std(vals))));
    const agree = 1 - Math.abs(a-b);
    sens[f] = Math.max(0, Math.min(1, agree));
    agreements.push(agree);
  }
  const aci = Math.max(0, Math.min(1, average(agreements) - 0.5*std(agreements)));
  return { aci, fieldSensitivity: sens };
}

function average(x:number[]){ return x.reduce((a,b)=>a+b,0)/Math.max(1,x.length); }
function std(x:number[]){ const m=average(x); return Math.sqrt(x.reduce((s,v)=>s+(v-m)*(v-m),0)/Math.max(1,x.length)); }
function gaussian(mu:number, sigma:number){ const u=Math.random(), v=Math.random(); return mu + sigma*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function direction(x:number[]){ if (x.length<2) return 0.5; let inc=0, dec=0; for(let i=1;i<x.length;i++){ if(x[i]>x[i-1]) inc++; else if(x[i]<x[i-1]) dec++; } const tot=inc+dec||1; return inc/tot; }


