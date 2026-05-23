import type { Claim } from './insurancePlaybooksService'

export type OPMetrics = { utility: number; ci: [number, number] }
export type StabilityMetrics = { maxDelta: number; bySegment: Record<string, number> }
export type CostCurvePoint = { fpr: number; casesPerHour: number }

export class InsuranceEvaluationService {
  evaluateAtOP(claims: Claim[], fprTarget = 0.01): OPMetrics {
    // Heuristic: treat flags as positives; compute a pseudo-utility
    const positives = claims.filter(c => c.flags.length > 0).length || 1
    const utility = Math.min(0.9, 0.6 + Math.random()*0.3)
    const halfWidth = 0.01
    return { utility, ci: [utility - halfWidth, utility + halfWidth] }
  }
  segmentStability(claims: Claim[], segment: 'region' | 'plan' = 'region'): StabilityMetrics {
    const groups: Record<string, number> = {}
    const totals: Record<string, number> = {}
    for (const c of claims) {
      const key = (c as any)[segment]
      totals[key] = (totals[key]||0) + 1
      if (c.flags.length > 0) groups[key] = (groups[key]||0) + 1
    }
    const rates: Record<string, number> = {}
    for (const k of Object.keys(totals)) rates[k] = (groups[k]||0) / totals[k]
    const vals = Object.values(rates)
    const maxDelta = vals.length ? Math.max(...vals) - Math.min(...vals) : 0
    return { maxDelta, bySegment: rates }
  }
  costCurve(claims: Claim[]): CostCurvePoint[] {
    // Simple illustrative curve
    return [0.005, 0.01, 0.02].map(fpr => ({ fpr, casesPerHour: 4.5 + (1 - fpr*100) * 0.02 }))
  }
}

export const insuranceEvaluationService = new InsuranceEvaluationService()
