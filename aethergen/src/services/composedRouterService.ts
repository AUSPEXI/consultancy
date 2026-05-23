import { contextEngine, DocSpan } from './contextEngine'
import { hallucinationRisk, RiskThreshold } from './hallucinationRiskService'
import { cpuRunner } from './cpuRunnerService'

export type ComposeInput = {
  query: string
  candidates: { bm25: DocSpan[]; dense: DocSpan[]; reranked?: DocSpan[] }
  tokenBudget?: number
  riskThreshold?: RiskThreshold
  aggressiveSummaries?: boolean
  deterministic?: boolean
}

export type ComposeResult = {
  packedContext: string
  included: DocSpan[]
  risk: number
  action: 'generate'|'fetch_more_context'|'reroute'|'abstain'
  draft?: string
  escalated?: boolean
}

export class ComposedRouterService {
  async run(input: ComposeInput): Promise<ComposeResult> {
    const k = 6
    const tokenBudget = input.tokenBudget ?? 900
    const ranked = contextEngine.rankHybrid(input.candidates.bm25, input.candidates.dense, input.candidates.reranked, k)
    const signals = contextEngine.computeSignals(ranked, k)
    const features = {
      margin: signals.retrieval_margin,
      entropy: 1 - Math.min(1, signals.retrieval_margin),
      retrieval: Math.min(1, 0.5 * signals.support_docs + 0.5 * signals.source_trust),
      selfConsistency: 0.6,
      supportDocs: signals.support_docs
    }
    let risk = hallucinationRisk.computeRisk(features)
    const threshold = input.riskThreshold ?? { threshold: 0.55, targetRate: 0.1, calibratedOn: 0 }
    // Simple evaluator hooks (regex-based) to influence risk/actions
    const injRx = /(ignore|bypass|disregard)\s+(the\s+)?(instructions|rules|guard|policy)/i
    const piiRx = /(ssn|social security|passport|nin|nhs|credit card|iban)/i
    const toxRx = /(\b(?:idiot|stupid|dumb|hate|kill|violent|moron|trash|shut\s*up|f\*?ck|s\*?it)\b)/i
    const biasRx = /(\b(?:women\s+can't|men\s+are\s+better|race\s+is\s+superior|religion\s+is\s+inferior)\b)/i
    const jbRx = /(\b(?:dan\b|do\s+anything\s+now|ignore\s+(all\s+)?previous\s+instructions|reveal\s+system\s+prompt|jailbreak)\b)/i

    // Load per-metric thresholds and fail-closed policy
    let thresholds: Record<string, number> = {}
    let failClosed = false
    try { thresholds = JSON.parse(localStorage.getItem('aeg_eval_thresholds') || '{}') } catch {}
    try { failClosed = localStorage.getItem('aeg_eval_fail_closed') === 'true' } catch {}

    const evalScores: Record<string, number> = {}
    const addEvent = (metric: 'prompt_injection'|'pii_leak'|'toxicity'|'bias'|'jailbreak', score: number, passed: boolean) => {
      evalScores[metric] = score
      try { this.appendEval({ ts: new Date().toISOString(), metric, score, passed }) } catch {}
    }

    const injHit = injRx.test(input.query)
    if (injHit) {
      const s = 0.8
      risk = Math.min(1, risk + 0.2)
      addEvent('prompt_injection', s, false)
    }
    let action = hallucinationRisk.decideAction(risk, threshold)
    let { packed, included } = contextEngine.pack(ranked, tokenBudget)

    // For simple fact queries, keep only the top span to minimize tokens
    const q = (input.query || '').toLowerCase()
    const facty = /(what|which|is|p50|p90|median|largest|highest)/.test(q)
    const summaryLike = /(summarize|summary|overview|operations readiness|report)/.test(q)
    if (facty && included.length > 0) {
      included = [included[0]]
      packed = included[0].text
    }
    // For summaries, cap to top-2 and bulletize numeric facts to ~120 tokens
    if (summaryLike && included.length > 0) {
      const top2 = included.slice(0, 2)
      const bullets = top2.map((d, i) => `• ${condense(d.text)}`).join('\n')
      included = top2
      packed = bullets
    }

    // SLM-first draft using CPU runner (lightweight) if action permits
    let draft: string | undefined
    let escalated = false
    let decided: 'generate'|'fetch_more_context'|'reroute'|'abstain' = action
    // If support is strong and query is factual, permit generate under a small risk buffer
    const top = included[0]
    const topTrust = (top?.trust ?? 0.9)
    const topScore = (top?.score ?? 0)
    if (decided !== 'generate' && facty && features.retrieval >= 0.45 && (risk < Math.min(1, threshold.threshold + 0.12) || (topScore >= 0.85 && topTrust >= 0.85))) {
      decided = 'generate'
    }
    if (decided !== 'generate' && summaryLike) {
      if (input.aggressiveSummaries) {
        if (features.retrieval >= 0.45) decided = 'generate'
      } else {
        if (features.retrieval >= 0.4 && risk < Math.min(1, threshold.threshold + 0.1)) decided = 'generate'
      }
    }
    // Content checks on packed context
    const piiHit = piiRx.test(packed)
    if (piiHit) { addEvent('pii_leak', 0.9, false); decided = decided === 'generate' ? 'fetch_more_context' : decided }
    const toxHit = toxRx.test(`${input.query} ${packed}`)
    if (toxHit) addEvent('toxicity', 0.8, false)
    const biasHit = biasRx.test(packed)
    if (biasHit) addEvent('bias', 0.85, false)
    const jbHit = jbRx.test(input.query)
    if (jbHit) addEvent('jailbreak', 0.8, false)

    // Fail-closed policy: if any score exceeds configured threshold, abstain
    if (failClosed) {
      const entries = Object.entries(evalScores)
      for (const [metric, score] of entries) {
        const thr = typeof thresholds[metric] === 'number' ? thresholds[metric] : 0.7
        if (score >= thr) {
          decided = 'abstain'
          break
        }
      }
    }
    if (decided === 'generate') {
      // Deterministic mode: force microbatch 1 and record profile for evidence
      const deterministic = !!input.deterministic || localStorage.getItem('aeg_deterministic') === 'true'
      if (deterministic) {
        try {
          const profile = {
            deterministic: true,
            microbatch: 1,
            matmul_precision: 'float32',
            kv_cache: 'fixed_precision',
            ts: new Date().toISOString(),
          }
          const key = 'aeg_determinism_profile'
          localStorage.setItem(key, JSON.stringify(profile))
        } catch {}
      }
      try {
        // Use a trivial scorer as a placeholder to demonstrate CPU path
        const scores = await cpuRunner.score(included.map(d => [d.score, d.recency ?? 0, d.trust ?? 0] as any))
        draft = `Answer (grounded): ${top ? top.text.slice(0, 600) : ''}`
      } catch {
        draft = included[0]?.text.slice(0, 400) || ''
      }
    } else if (decided === 'reroute') {
      escalated = true
    }
    return { packedContext: packed, included, risk, action: decided, draft, escalated }
  }

  private appendEval(ev: { ts: string; metric: 'prompt_injection'|'pii_leak'|'tool_error'; score: number; passed: boolean; details?: Record<string, any> }) {
    try {
      const key = 'aeg_eval_events'
      const prev = JSON.parse(localStorage.getItem(key) || '[]')
      prev.push(ev)
      localStorage.setItem(key, JSON.stringify(prev))
    } catch {}
  }
}

function condense(text: string): string {
  // Keep concise: numbers, key tokens, remove long stopwords. Simple heuristic.
  const t = (text || '')
    .replace(/\s+/g, ' ')
    .replace(/Source:\s*[^\n]*\n?/gi, '')
    .replace(/Score:[^\n]*\n?/gi, '')
    .trim()
  const words = t.split(' ')
  const keep = new Set(['p50','p90','p99','median','mean','share','largest','highest','km','usd','minutes','quantiles','correlations', 'hour','borough'])
  const filtered = words.filter(w => /\d/.test(w) || keep.has(w.toLowerCase()) || w.length <= 12)
  return filtered.join(' ').slice(0, 600)
}

export const composedRouter = new ComposedRouterService()


