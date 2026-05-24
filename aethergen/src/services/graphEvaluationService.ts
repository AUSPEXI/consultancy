import { SyntheticGraph } from './graphSynthesisService'

export type OperatingBudget = { alerts_per_day: number }

export interface EvalResult {
  operating_point: OperatingBudget
  utility: { tpr: number; fpr: number; lift_vs_baseline: number; ci: [number, number] }
  stability: { region_max_delta: number; product_max_delta: number }
  latency: { p50: number; p95: number; p99: number }
  cost: { cases_per_analyst_hour: number; escalations_per_day: number }
  sweeps?: Array<{ param: string; value: number; lift: number }>
}

export class GraphEvaluationService {
  evaluate(graph: SyntheticGraph, op: OperatingBudget): EvalResult {
    // Placeholder deterministic computations for demo; wire real metrics later
    const n = graph.edges.length
    const base = Math.max(1, Math.min(0.5, n / 500000))
    const tpr = clamp(base + 0.1, 0, 1)
    const fpr = clamp(0.01, 0, 1)
    const lift = 0.12
    const ci: [number, number] = [0.10, 0.14]
    const stability = { region_max_delta: 0.021, product_max_delta: 0.018 }
    const latency = { p50: 60, p95: 110, p99: 180 }
    const cost = { cases_per_analyst_hour: 7.5, escalations_per_day: op.alerts_per_day }
    return { operating_point: op, utility: { tpr, fpr, lift_vs_baseline: lift, ci }, stability, latency, cost }
  }

  sweep(graph: SyntheticGraph, param: string, values: number[], op: OperatingBudget): EvalResult {
    const base = this.evaluate(graph, op)
    const sweeps = values.map(v => ({ param, value: v, lift: 0.1 + 0.01 * (v - values[0]) }))
    return { ...base, sweeps }
  }
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }


