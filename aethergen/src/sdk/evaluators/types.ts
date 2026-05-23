export type EvaluationEvent = {
  ts: string
  metric: 'prompt_injection' | 'pii_leak' | 'tool_error'
  score: number // 0..1 risk
  passed: boolean
  details?: Record<string, any>
}

export type EvaluationSummary = {
  runId: string
  counts: Record<string, { n: number; fail: number; pass: number; avg: number }>
}


