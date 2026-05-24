export type ContextWindowFeature = {
  windowName: string
  counts: Record<string, number>
  rates?: Record<string, number>
}

export type EpisodeFeature = {
  episodeId: string
  durationSec: number
  roleTransitions: number
}

export type GraphMotifFeature = {
  motif: string
  score: number
}

export type ManifoldEmbedding = {
  dims: number
  values: number[]
}

export type ContextFeatures = {
  actorId: string
  timestampIso: string
  windows: ContextWindowFeature[]
  episode?: EpisodeFeature
  motifs?: GraphMotifFeature[]
  manifold?: ManifoldEmbedding
}

export type LabeledExample = {
  features: Record<string, number>
  label: number
  context?: ContextFeatures
}

export type ContextConditioningConfig = {
  useManifold: boolean
  manifoldDims: number
  includeMotifs: boolean
  includeEpisode: boolean
  windowFeatures: string[]
}


