export interface CalibrationPoint {
  score: number; // higher is better (e.g., margin 1-entropy)
  correct: boolean;
}

export interface ConformalModel {
  threshold: number; // score threshold for acceptance
  targetCoverage: number; // desired acceptance rate
}

export function calibrateThreshold(points: CalibrationPoint[], targetCoverage: number): ConformalModel {
  if (points.length === 0) return { threshold: Infinity, targetCoverage };
  const scores = points.map(p => p.score).sort((a, b) => b - a);
  const k = Math.max(0, Math.min(scores.length - 1, Math.round(targetCoverage * scores.length) - 1));
  const threshold = scores[k] ?? Number.POSITIVE_INFINITY;
  return { threshold, targetCoverage };
}

export function evaluateSelective(points: CalibrationPoint[], model: ConformalModel) {
  let accepted = 0, abstained = 0, wrong = 0, correct = 0;
  for (const p of points) {
    if (p.score >= model.threshold) {
      accepted++;
      if (p.correct) correct++; else wrong++;
    } else {
      abstained++;
    }
  }
  const n = points.length || 1;
  return {
    coverage: accepted / n,
    abstain: abstained / n,
    errorRate: wrong / Math.max(1, accepted),
    correctRate: correct / Math.max(1, accepted)
  };
}

export function synthScores(n: number): CalibrationPoint[] {
  // Simulate scores: mix of good and uncertain samples
  return Array.from({ length: n }, () => {
    const margin = Math.random();
    const entropy = Math.random();
    const score = 0.6 * margin + 0.4 * (1 - entropy);
    const correct = score + (Math.random() * 0.25 - 0.125) > 0.5;
    return { score, correct };
  });
}

export type GroupScores = Record<string, CalibrationPoint[]>;

export function calibratePerGroup(groups: GroupScores, targetCoverage: number) {
  const thresholds: Record<string, number> = {};
  const evals: Record<string, ReturnType<typeof evaluateSelective>> = {} as any;
  for (const key of Object.keys(groups)) {
    const model = calibrateThreshold(groups[key], targetCoverage);
    thresholds[key] = model.threshold;
    evals[key] = evaluateSelective(groups[key], model);
  }
  return { thresholds, evals };
}

export interface RawSignal {
  margin?: number; // top1 - top2 probability margin in [0,1]
  entropy?: number; // token/sequence entropy in [0,1]
  retrieval?: number; // retrieval coverage/citation match in [0,1]
  correct?: boolean; // optional ground truth for evaluation
}

export function buildPointsFromSignals(signals: RawSignal[], weights: { margin?: number; entropy?: number; retrieval?: number } = {}): CalibrationPoint[] {
  const wMargin = weights.margin ?? 0.5;
  const wEntropy = weights.entropy ?? 0.3;
  const wRetrieval = weights.retrieval ?? 0.2;
  const wSum = wMargin + wEntropy + wRetrieval || 1;
  const wm = wMargin / wSum, we = wEntropy / wSum, wr = wRetrieval / wSum;
  return signals.map(s => {
    const margin = clamp01(s.margin ?? 0);
    const entropy = clamp01(s.entropy ?? 1);
    const retrieval = clamp01(s.retrieval ?? 0);
    const score = wm * margin + we * (1 - entropy) + wr * retrieval;
    return { score, correct: Boolean(s.correct) };
  });
}

export function parseSignalsCSV(csv: string): RawSignal[] {
  const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const idx = {
    margin: header.indexOf('margin'),
    entropy: header.indexOf('entropy'),
    retrieval: header.indexOf('retrieval'),
    correct: header.indexOf('correct')
  };
  return lines.slice(1).map(line => {
    const parts = line.split(',');
    const num = (i: number) => (i >= 0 && i < parts.length ? Number(parts[i]) : NaN);
    return {
      margin: safe(num(idx.margin)),
      entropy: safe(num(idx.entropy)),
      retrieval: safe(num(idx.retrieval)),
      correct: String(parts[idx.correct] ?? '').trim().toLowerCase() === '1' || String(parts[idx.correct] ?? '').trim().toLowerCase() === 'true'
    } as RawSignal;
  });
}

function safe(v: number) {
  return isFinite(v) ? v : undefined;
}

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }


