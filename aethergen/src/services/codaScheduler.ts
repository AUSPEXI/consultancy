// Collision-Optimized Data Accelerator (CODA) — simplified interface

export interface CodaState {
  windowEnergy: number; // conserved per window
  mass: number[]; // per-batch mass (uncertainty proxy)
  velocity: number[]; // per-batch velocity (update magnitude proxy)
}

export interface CodaUpdate {
  lrScale: number[]; // per-batch learning-rate scaling
  sampleWeight: number[]; // per-batch sampling weight
}

// Compute masses from uncertainty or curvature proxies
export function estimateMass(losses: number[]): number[] {
  const mean = losses.reduce((a,b)=>a+b,0)/Math.max(1,losses.length);
  const variance = losses.reduce((a,b)=>a+(b-mean)*(b-mean),0)/Math.max(1,losses.length);
  const base = 1/(Math.sqrt(variance)+1e-6);
  return losses.map(l => Math.max(0.1, base * (1/(Math.abs(l-mean)+1e-6))));
}

// One CODA step: redistribute energy to maximize information gain proxy
export function codaStep(state: CodaState, infoGain: number[]): { state: CodaState; update: CodaUpdate } {
  const n = infoGain.length;
  const totalMass = state.mass.reduce((a,b)=>a+b,0)+1e-8;
  // target velocity proportional to info gain and inverse mass
  const targetV = infoGain.map((ig,i)=> ig/(state.mass[i]+1e-6));
  const norm = targetV.reduce((a,b)=>a+b,0)+1e-8;
  const scale = Math.max(1e-6, state.windowEnergy / norm);
  const newV = targetV.map(v => v*scale);
  const lrScale = newV.map((v,i)=> v/Math.max(1e-6,state.velocity[i]||1));
  const sampleWeight = infoGain.map((ig)=> Math.max(0.01, ig / (Math.max(...infoGain)+1e-6)));
  return { state: { ...state, velocity: newV }, update: { lrScale, sampleWeight } };
}



