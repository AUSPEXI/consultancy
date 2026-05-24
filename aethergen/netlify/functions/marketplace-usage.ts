import type { Handler } from '@netlify/functions'
import { ok, rateLimit, tooMany } from './_shared/supabase'

const handler: Handler = async (event) => {
  const rl = rateLimit(event, 'mp-usage', 120, 60)
  if (!rl.allowed) return tooMany(rl.retryAfter)
  // Demo usage snapshot (per-tenant would require auth)
  return ok({
    period: 'last_24h',
    totals: {
      calls: 1234,
      tokens: 987654,
      seconds: 43210
    },
    by_model: [
      { id: 'mdl_ago', calls: 600, tokens: 500000, seconds: 20000 },
      { id: 'mdl_432', calls: 400, tokens: 350000, seconds: 15000 },
      { id: 'mdl_uc', calls: 234, tokens: 137654, seconds: 8210 }
    ]
  })
}

export { handler }


