import type { Handler } from '@netlify/functions'

type ResidualSignal = {
  modelId: string
  segment?: string
  timestamp: number
  margin?: number
  entropy?: number
  retrieval?: number
  correct?: boolean
}

function summarize(residuals: ResidualSignal[]) {
  const groups: Record<string, ResidualSignal[]> = {}
  for (const r of residuals) {
    const k = r.segment || 'global'
    if (!groups[k]) groups[k] = []
    groups[k].push(r)
  }
  const out: Record<string, any> = {}
  const q = (arr: number[], p: number) => {
    if (arr.length === 0) return undefined
    const a = arr.slice().sort((a,b)=>a-b)
    const idx = Math.max(0, Math.min(a.length-1, Math.floor(p*(a.length-1))))
    return a[idx]
  }
  for (const [seg, arr] of Object.entries(groups)) {
    const margins = arr.map(x=>x.margin!).filter(Number.isFinite)
    const ents = arr.map(x=>x.entropy!).filter(Number.isFinite)
    const rets = arr.map(x=>x.retrieval!).filter(Number.isFinite)
    const acc = arr.filter(x=>x.correct!==undefined)
    out[seg] = {
      n: arr.length,
      margin_p50: q(margins, 0.5),
      entropy_p50: q(ents, 0.5),
      retrieval_p50: q(rets, 0.5),
      error_rate: acc.length ? (acc.filter(x=>!x.correct).length/acc.length) : undefined
    }
  }
  return out
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  try {
    const body = JSON.parse(event.body || '{}')
    const residuals: ResidualSignal[] = Array.isArray(body?.residuals) ? body.residuals : []
    const target = typeof body?.targetCoverage === 'number' ? body.targetCoverage : 0.7
    const summary = summarize(residuals)
    // simple quantile-based thresholds based on a blended score
    const thresholds: Record<string, number> = {}
    for (const seg of Object.keys(summary)) {
      const segRes = residuals.filter(r => (r.segment||'global')===seg)
      const scores = segRes.map(r => 0.5*(r.margin??0) + 0.3*(1-(r.entropy??1)) + 0.2*(r.retrieval??0)).sort((a,b)=>b-a)
      const k = Math.max(0, Math.min(scores.length-1, Math.round(target * scores.length) - 1))
      thresholds[seg] = scores[k] ?? 1
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, summary, thresholds })
    }
  } catch (e: any) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: String(e?.message || e) }) }
  }
}


