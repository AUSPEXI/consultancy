// Extremely small in-browser autoencoder demo for educational purposes.
// Linear AE: z = x * We  (d_in x d_latent),  xhat = z * Wd  (d_latent x d_in)
// Trains with simple SGD on MSE using per-sample weights and a lrScale factor per step.

export interface AeTrainConfig {
  inputDim: number;
  latentDim: number;
  steps: number;
  baseLr: number;
}

export interface AeTrainResult {
  lossBefore: number;
  lossAfter: number;
  steps: number;
  lossHistory: number[];
}

function zeros(r: number, c: number): number[][] {
  return Array.from({ length: r }, () => Array(c).fill(0));
}

function randn(r: number, c: number, s = 0.01): number[][] {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => (Math.random() * 2 - 1) * s));
}

function matmul(A: number[][], B: number[][]): number[][] {
  const r = A.length, k = A[0].length, c = B[0].length;
  const out = zeros(r, c);
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      let sum = 0;
      for (let t = 0; t < k; t++) sum += A[i][t] * B[t][j];
      out[i][j] = sum;
    }
  }
  return out;
}

function transpose(A: number[][]): number[][] {
  const r = A.length, c = A[0].length;
  const out = zeros(c, r);
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) out[j][i] = A[i][j];
  return out;
}

function mse(X: number[][], Y: number[][]): number {
  let s = 0, n = 0;
  for (let i = 0; i < X.length; i++) {
    for (let j = 0; j < X[0].length; j++) { const d = X[i][j] - Y[i][j]; s += d * d; n++; }
  }
  return s / Math.max(1, n);
}

export function trainLinearAe(
  X: number[][],
  cfg: AeTrainConfig,
  lrScale: number[] = [],
  sampleWeight: number[] = []
): AeTrainResult {
  const n = X.length, d = cfg.inputDim, h = cfg.latentDim;
  let We = randn(d, h), Wd = randn(h, d);
  const Xmat = X; // rows as samples
  const X0 = Xmat.map(row => row.slice(0, d));
  // loss before
  let Z0 = matmul(X0, We); const Xhat0 = matmul(Z0, Wd); const before = mse(X0, Xhat0);
  const history: number[] = [before];
  // train
  for (let step = 0; step < cfg.steps; step++) {
    const lr = cfg.baseLr * (lrScale[step % lrScale.length] || 1.0);
    for (let i = 0; i < n; i++) {
      const w = sampleWeight[i % sampleWeight.length] || 1.0;
      // forward
      const xi = [X0[i]]; // 1 x d
      const zi = matmul(xi, We); // 1 x h
      const xhat = matmul(zi, Wd); // 1 x d
      // gradient of MSE: dL/dxhat = 2/n * (xhat - x)
      const gradXhat = [Array(d).fill(0)];
      for (let j = 0; j < d; j++) gradXhat[0][j] = (2 * (xhat[0][j] - xi[0][j]) / d) * w;
      // grads for Wd and We
      const ziT = transpose(zi);
      const gradWd = matmul(ziT, gradXhat); // h x d
      const gradZi = matmul(gradXhat, transpose(Wd)); // 1 x h
      const xiT = transpose(xi);
      const gradWe = matmul(xiT, gradZi); // d x h
      // update
      for (let a = 0; a < h; a++) for (let b = 0; b < d; b++) Wd[a][b] -= lr * gradWd[a][b];
      for (let a = 0; a < d; a++) for (let b = 0; b < h; b++) We[a][b] -= lr * gradWe[a][b];
    }
    // record loss per step
    const Zs = matmul(X0, We); const Xh = matmul(Zs, Wd); history.push(mse(X0, Xh));
  }
  let Z = matmul(X0, We); const Xhat = matmul(Z, Wd); const after = mse(X0, Xhat);
  return { lossBefore: before, lossAfter: after, steps: cfg.steps, lossHistory: history };
}

// -------- Deep AE (ReLU) ---------
export interface AeDeepConfig {
  inputDim: number;
  hidden1: number;
  latentDim: number;
  hidden2: number;
  steps: number;
  baseLr: number;
}

function relu(A: number[][]): number[][] {
  return A.map(row => row.map(v => Math.max(0, v)));
}

function reluGrad(A: number[][]): number[][] {
  return A.map(row => row.map(v => (v > 0 ? 1 : 0)));
}

function hadamard(A: number[][], B: number[][]): number[][] {
  const r = A.length, c = A[0].length; const out = zeros(r, c);
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) out[i][j] = A[i][j] * B[i][j];
  return out;
}

export function trainDeepAe(
  X: number[][],
  cfg: AeDeepConfig,
  lrScale: number[] = [],
  sampleWeight: number[] = []
): AeTrainResult {
  const n = X.length, d = cfg.inputDim, h1 = cfg.hidden1, zdim = cfg.latentDim, h2 = cfg.hidden2;
  let W1 = randn(d, h1), W2 = randn(h1, zdim), W3 = randn(zdim, h2), W4 = randn(h2, d);
  const X0 = X.map(row => row.slice(0, d));
  const forwardLoss = (): number => {
    const H1 = relu(matmul(X0, W1));
    const Z = relu(matmul(H1, W2));
    const H2 = relu(matmul(Z, W3));
    const Xhat = matmul(H2, W4);
    return mse(X0, Xhat);
  };
  const before = forwardLoss();
  const history: number[] = [before];
  for (let step = 0; step < cfg.steps; step++) {
    const lr = cfg.baseLr * (lrScale[step % Math.max(1, lrScale.length)] || 1.0);
    for (let i = 0; i < n; i++) {
      const w = sampleWeight[i % Math.max(1, sampleWeight.length)] || 1.0;
      const xi = [X0[i]]; // 1 x d
      const h1a = matmul(xi, W1); const h1r = relu(h1a);
      const za = matmul(h1r, W2); const zr = relu(za);
      const h2a = matmul(zr, W3); const h2r = relu(h2a);
      const xhat = matmul(h2r, W4);
      // grad at output
      const dXhat = [Array(d).fill(0)];
      for (let j = 0; j < d; j++) dXhat[0][j] = (2 * (xhat[0][j] - xi[0][j]) / d) * w;
      const h2rT = transpose(h2r);
      const gW4 = matmul(h2rT, dXhat);
      const dh2r = matmul(dXhat, transpose(W4));
      const dh2a = hadamard(dh2r, reluGrad(h2a));
      const zrT = transpose(zr);
      const gW3 = matmul(zrT, dh2a);
      const dzr = matmul(dh2a, transpose(W3));
      const dza = hadamard(dzr, reluGrad(za));
      const h1rT = transpose(h1r);
      const gW2 = matmul(h1rT, dza);
      const dh1r = matmul(dza, transpose(W2));
      const dh1a = hadamard(dh1r, reluGrad(h1a));
      const xiT = transpose(xi);
      const gW1 = matmul(xiT, dh1a);
      // updates
      for (let a = 0; a < h2; a++) for (let b = 0; b < d; b++) W4[a][b] -= lr * gW4[a][b];
      for (let a = 0; a < zdim; a++) for (let b = 0; b < h2; b++) W3[a][b] -= lr * gW3[a][b];
      for (let a = 0; a < h1; a++) for (let b = 0; b < zdim; b++) W2[a][b] -= lr * gW2[a][b];
      for (let a = 0; a < d; a++) for (let b = 0; b < h1; b++) W1[a][b] -= lr * gW1[a][b];
    }
    history.push(forwardLoss());
  }
  const after = forwardLoss();
  return { lossBefore: before, lossAfter: after, steps: cfg.steps, lossHistory: history };
}


