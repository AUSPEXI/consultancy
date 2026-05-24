export type StepKind = 'generation' | 'cleaning' | 'benchmark' | 'rag' | 'tools' | 'llm';

export interface CostEstimate { tokens?: number; latencyMs?: number; costUSD?: number; notes?: string[] }

export function estimateStep(kind: StepKind, params: Record<string, any>): CostEstimate {
  const notes: string[] = [];
  switch (kind) {
    case 'generation': {
      const n = params.records ?? 1000;
      const baseMs = Math.max(200, (n / 1500) * 1000);
      return { latencyMs: baseMs, costUSD: 0, notes: ['local pipeline'] };
    }
    case 'cleaning': {
      const n = params.records ?? 1000;
      return { latencyMs: (n / 5000) * 1000, costUSD: 0, notes: ['CPU-only'] };
    }
    case 'benchmark': {
      const models = params.models ?? 5;
      const ms = models * 300;
      return { latencyMs: ms, costUSD: 0, notes: ['synthetic benchmarks'] };
    }
    case 'rag': {
      const docs = params.docs ?? 1000;
      return { latencyMs: Math.min(2000, docs / 50), costUSD: 0, notes: ['BM25 in-browser'] };
    }
    case 'tools': {
      const calls = params.calls ?? 1;
      return { latencyMs: calls * 200, costUSD: 0, notes: ['simulated tool latency'] };
    }
    case 'llm': {
      const tokens = params.tokens ?? 512;
      const cost = 0; // local default
      return { tokens, latencyMs: Math.max(300, tokens * 3), costUSD: cost, notes: ['heuristic/local'] };
    }
    default:
      return { costUSD: 0, notes: [] };
  }
}


