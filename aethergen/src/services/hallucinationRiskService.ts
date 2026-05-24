export type RiskFeatures = {
  margin: number // higher is safer
  entropy: number // higher is riskier
  retrieval: number // higher is safer (support strength)
  selfConsistency?: number // optional, higher is safer
  supportDocs?: number // optional count normalized 0..1
}

export type RiskConfig = {
  weights: {
    margin: number
    entropy: number
    retrieval: number
    selfConsistency?: number
    supportDocs?: number
  }
  calibrationTarget: number // max hallucination rate, e.g. 0.05
}

export type RiskThreshold = {
  threshold: number // 0..1; risk >= threshold → intervene
  targetRate: number
  calibratedOn: number // n samples
}

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0
  return Math.max(0, Math.min(1, x))
}

function normalize(value: number): number {
  // Expect roughly 0..1 already; clamp to be safe
  return clamp01(value)
}

export function computeRisk(features: RiskFeatures, cfg?: Partial<RiskConfig>): number {
  const w = cfg?.weights || { margin: 0.35, entropy: 0.35, retrieval: 0.25, selfConsistency: 0.05, supportDocs: 0.0 }
  const margin = normalize(features.margin)
  const entropy = normalize(features.entropy)
  const retrieval = normalize(features.retrieval)
  const selfConsistency = normalize(features.selfConsistency ?? 0.5)
  const supportDocs = normalize(features.supportDocs ?? 0.0)

  // Risk is higher when margin low, entropy high, retrieval low, self-consistency low
  const raw = (
    w.margin * (1 - margin) +
    w.entropy * entropy +
    w.retrieval * (1 - retrieval) +
    (w.selfConsistency || 0) * (1 - selfConsistency) +
    (w.supportDocs || 0) * (1 - supportDocs)
  )

  // Map to 0..1
  return clamp01(raw)
}

export function calibrateRiskThreshold(samples: Array<{ features: RiskFeatures; hallucinated: boolean }>, targetRate: number): RiskThreshold {
  // Compute risk for each sample
  const withRisk = samples.map(s => ({ r: computeRisk(s.features), h: s.hallucinated }))
  // Sort by risk ascending; choose the largest threshold such that P(h|r < t) <= targetRate
  const sorted = withRisk.sort((a,b)=> a.r - b.r)
  let best = 1
  for (let i = 1; i <= sorted.length; i++) {
    const subset = sorted.slice(0, i)
    const rate = subset.reduce((acc, x) => acc + (x.h ? 1 : 0), 0) / subset.length
    if (rate <= targetRate) {
      best = sorted[i-1].r
    } else {
      break
    }
  }
  return { threshold: clamp01(best), targetRate: clamp01(targetRate), calibratedOn: samples.length }
}

export type RiskAction = 'generate' | 'fetch_more_context' | 'reroute' | 'abstain'

export function decideAction(risk: number, threshold: RiskThreshold): RiskAction {
  // Simple policy with two cut points: threshold and a high-risk buffer
  const high = clamp01(Math.min(1, threshold.threshold + 0.15))
  if (risk >= high) return 'abstain'
  if (risk >= threshold.threshold) return 'fetch_more_context'
  // Below threshold, safe to generate (or keep on device)
  return 'generate'
}

export const hallucinationRisk = {
  computeRisk,
  calibrateRiskThreshold,
  decideAction
}


