import type { Handler } from '@netlify/functions'

type Json = Record<string, any>

const handler: Handler = async (event) => {
  try {
    const actor_id = event.queryStringParameters?.actor_id || ''
    const k_recent = parseInt(event.queryStringParameters?.k_recent || '50', 10)
    const k_semantic = parseInt(event.queryStringParameters?.k_semantic || '25', 10)
    const k_graph = parseInt(event.queryStringParameters?.k_graph || '2', 10)
    if (!actor_id) return { statusCode: 400, body: 'actor_id required' }
    // Placeholder: wire to Databricks SQL later. Here we just echo the retrieval plan.
    const bundle = { plan: { actor_id, k_recent, k_semantic, k_graph }, events: [], graph_slice: {}, semantic_hits: [] }
    return { statusCode: 200, body: JSON.stringify({ ok: true, bundle }) }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }


