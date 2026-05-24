// Generic trainer wrapper to consume CODA updates

export interface MiniBatch<T> {
  samples: T[];
}

export interface TrainerHooks<T> {
  // Called per step with learning rate scale and per-sample weights
  step: (batch: MiniBatch<T>, lrScale: number, sampleWeights: number[]) => void;
}

export interface CodaSignal {
  lrScale: number[]; // per-step scale
  sampleWeight: number[]; // per-sample weights
}

export function trainWithCoda<T>(
  batches: MiniBatch<T>[],
  hooks: TrainerHooks<T>,
  signal: CodaSignal,
  baseSteps: number
) {
  for (let step = 0; step < baseSteps; step++) {
    const lr = signal.lrScale[step % Math.max(1, signal.lrScale.length)] || 1.0;
    const b = batches[step % Math.max(1, batches.length)];
    const w = b.samples.map((_, i) => signal.sampleWeight[i % Math.max(1, signal.sampleWeight.length)] || 1.0);
    hooks.step(b, lr, w);
  }
}



