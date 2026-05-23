import React, { useState } from 'react'
import { ingestContext, retrieveContext, type ContextBundle } from '../services/contextService'

export default function ContextStudio() {
  const [actorId, setActorId] = useState('actor-001')
  const [eventsJson, setEventsJson] = useState('[{"id":"e1","actor_id":"actor-001","ts":"2025-01-01T00:00:00Z","kind":"visit","payload":{}}]')
  const [bundle, setBundle] = useState<ContextBundle | null>(null)
  const [msg, setMsg] = useState<string>('')

  async function onIngest() {
    try {
      const events = JSON.parse(eventsJson)
      const res = await ingestContext('aethergen.context_events', events)
      setMsg(res.ok ? `Staged at ${res.staged}` : (res.error || 'ingest failed'))
    } catch (e: any) {
      setMsg(e?.message || 'parse error')
    }
  }

  async function onRetrieve() {
    const res = await retrieveContext(actorId, { k_recent: 50, k_semantic: 25, k_graph: 2 })
    if (res.ok && res.bundle) setBundle(res.bundle)
    else setMsg(res.error || 'retrieve failed')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Context Studio (Dev)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Actor ID</label>
          <input className="w-full border rounded px-3 py-2" value={actorId} onChange={e=>setActorId(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Events (JSON array)</label>
          <textarea className="w-full border rounded px-3 py-2 font-mono text-sm" rows={6} value={eventsJson} onChange={e=>setEventsJson(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        <button onClick={onIngest} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Ingest</button>
        <button onClick={onRetrieve} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900">Retrieve</button>
      </div>
      {msg && <div className="mb-3 text-sm text-gray-700">{msg}</div>}
      {bundle && (
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">Context Bundle</h2>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-96">{JSON.stringify(bundle, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}


