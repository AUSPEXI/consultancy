export type ContextBundle = { plan: any; events: any[]; graph_slice: any; semantic_hits: any[] }

export async function ingestContext(eventsTable: string, events: any[]): Promise<{ ok: boolean; staged?: string; error?: string }> {
  const res = await fetch(`.netlify/functions/context-ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events_table: eventsTable, events })
  })
  try { return await res.json() } catch { return { ok: false, error: 'bad_json' } }
}

export async function retrieveContext(actorId: string, opts?: { k_recent?: number; k_semantic?: number; k_graph?: number }): Promise<{ ok: boolean; bundle?: ContextBundle; error?: string }> {
  const q = new URLSearchParams({ actor_id: actorId })
  if (opts?.k_recent) q.set('k_recent', String(opts.k_recent))
  if (opts?.k_semantic) q.set('k_semantic', String(opts.k_semantic))
  if (opts?.k_graph) q.set('k_graph', String(opts.k_graph))
  const res = await fetch(`.netlify/functions/context-retrieve?${q.toString()}`)
  try { return await res.json() } catch { return { ok: false, error: 'bad_json' } }
}


