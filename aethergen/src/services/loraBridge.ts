// LoRA-bridge: lightweight, IP-safe utilities to simulate low-rank adaptation
// and optimizer-moment projection between models with compatible blocks.

export interface LoraConfig {
  rank: number; // low-rank
  scale: number; // adaptation magnitude
}

export interface LoraAdaptation {
  A: number[][]; // in_dim x rank
  B: number[][]; // rank x out_dim
}

export function applyLora(weight: number[][], cfg: LoraConfig): { adapted: number[][]; delta: LoraAdaptation } {
  const inDim = weight.length;
  const outDim = weight[0]?.length || 0;
  const A: number[][] = Array.from({ length: inDim }, () => Array.from({ length: cfg.rank }, () => (Math.random()*2-1)*cfg.scale));
  const B: number[][] = Array.from({ length: cfg.rank }, () => Array.from({ length: outDim }, () => (Math.random()*2-1)*cfg.scale));
  // adapted = W + A @ B
  const adapted = weight.map((row, i) => row.map((w, j) => {
    let add = 0;
    for (let k = 0; k < cfg.rank; k++) add += A[i][k]*B[k][j];
    return w + add;
  }));
  return { adapted, delta: { A, B } };
}

export function projectMoments(moment: number[][], scale = 0.9): number[][] {
  // simple clipping + scaling to keep optimizer state stable
  return moment.map(row => row.map(v => Math.max(-1, Math.min(1, v*scale))));
}



