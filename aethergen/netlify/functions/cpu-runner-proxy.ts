import type { Handler } from '@netlify/functions'

type Json = Record<string, any>

const DIRECT_BASE = process.env.CPU_RUNNER_BASE || '' // e.g., http://localhost:8088

async function proxy(op: string, payload: Json) {
  if (!DIRECT_BASE) throw new Error('CPU runner base not configured')
  const path = op === 'score' ? '/score' : op === 'rerank' ? '/rerank' : ''
  if (!path) throw new Error('Unsupported operation')
  const res = await fetch(`${DIRECT_BASE.replace(/\/$/,'')}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const txt = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${txt}`)
  try { return JSON.parse(txt) } catch { return {} }
}

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'method not allowed' }
    const body = event.body ? JSON.parse(event.body) as Json : {}
    const op = String(body.op || '').toLowerCase()

    if (DIRECT_BASE) {
      // Attempt direct proxy to local CPU runner
      const result = await proxy(op, body)
      return { statusCode: 200, body: JSON.stringify(result) }
    }

    // Fallback stub: compute a simple weighted score in-process
    if (op === 'score') {
      const features: any[] = Array.isArray(body.features) ? body.features : []
      const w = body.weights || {}
      const wm = Number.isFinite(w.margin) ? Number(w.margin) : 0.5
      const we = Number.isFinite(w.entropy) ? Number(w.entropy) : 0.3
      const wr = Number.isFinite(w.retrieval) ? Number(w.retrieval) : 0.2
      const ws = wm + we + wr || 1
      const scores = features.map((f:any) => {
        const margin = clamp01(Number(f.margin ?? 0))
        const entropy = clamp01(Number(f.entropy ?? 1))
        const retrieval = clamp01(Number(f.retrieval ?? 0))
        return (wm/ws)*margin + (we/ws)*(1-entropy) + (wr/ws)*retrieval
      })
      return { statusCode: 200, body: JSON.stringify({ scores }) }
    }

    if (op === 'rerank') {
      const docs: string[] = Array.isArray(body.docs) ? body.docs.map(String) : []
      // No real model: just identity order fallback
      const order = docs.map((_, i) => i)
      return { statusCode: 200, body: JSON.stringify({ order }) }
    }

    return { statusCode: 400, body: 'unknown operation' }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

function clamp01(v: number) { return Math.max(0, Math.min(1, v)) }

export { handler }


