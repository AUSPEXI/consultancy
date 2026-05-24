import type { ContextConditioningConfig, LabeledExample, ContextFeatures } from '../types/contextTraining'

export type TrainingResult = {
  config: ContextConditioningConfig
  metrics: { utilityAtOp?: number; invarianceScore?: number }
  modelArtifact?: string
}

function buildContextVector(context: ContextFeatures | undefined, cfg: ContextConditioningConfig): number[] {
  if (!context) return []
  const vec: number[] = []
  // Windows
  for (const w of context.windows || []) {
    if (!cfg.windowFeatures.includes(w.windowName)) continue
    for (const [k, v] of Object.entries(w.counts || {})) vec.push(v)
    for (const [k, v] of Object.entries(w.rates || {})) vec.push(v)
  }
  // Episode
  if (cfg.includeEpisode && context.episode) {
    vec.push(context.episode.durationSec)
    vec.push(context.episode.roleTransitions)
  }
  // Motifs
  if (cfg.includeMotifs && context.motifs) {
    for (const m of context.motifs) vec.push(m.score)
  }
  // Manifold
  if (cfg.useManifold && context.manifold && context.manifold.values.length === cfg.manifoldDims) {
    vec.push(...context.manifold.values)
  }
  return vec
}

export function conditionExamplesWithContext(examples: LabeledExample[], cfg: ContextConditioningConfig): { X: number[][]; y: number[] } {
  const X: number[][] = []
  const y: number[] = []
  for (const ex of examples) {
    const base = Object.values(ex.features || {})
    const ctx = buildContextVector(ex.context, cfg)
    X.push(base.concat(ctx))
    y.push(ex.label)
  }
  return { X, y }
}


