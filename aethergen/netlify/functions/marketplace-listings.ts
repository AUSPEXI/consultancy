import type { Handler } from '@netlify/functions'
import { ok, rateLimit, tooMany } from './_shared/supabase'

const demo = [
  { id: 'mdl_ago', name: 'AGO Resonant Hypercube', provider: 'Aethergen', category: 'geometric', badges: ['Verified','Enterprise‑Ready'], pricing: { unit: '£/1K tokens', minMonthly: 499 }, evidence: { accuracy: 0.93, privacy: 0.91, latencyMs: 120 } },
  { id: 'mdl_432', name: 'Harmonic Regularizer 432', provider: 'Aethergen', category: 'harmonic', badges: ['Verified'], pricing: { unit: '£/1K tokens' }, evidence: { accuracy: 0.90, privacy: 0.92, latencyMs: 140 } },
  { id: 'mdl_uc', name: 'UC Pack — Synthetic Automotive', provider: 'Aethergen', category: 'databricks', badges: ['Delta','UC'], pricing: { unit: 'Private offer' }, evidence: { accuracy: 0.91, privacy: 0.95, latencyMs: 0 } }
]

const handler: Handler = async (event) => {
  const rl = rateLimit(event, 'mp-listings', 120, 60)
  if (!rl.allowed) return tooMany(rl.retryAfter)
  const id = event.queryStringParameters?.id
  if (id) {
    const it = demo.find(d => d.id === id)
    return ok({ item: it || null })
  }
  return ok({ items: demo })
}

export { handler }


