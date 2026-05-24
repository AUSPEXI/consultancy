import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function ContextDashboard() {
  const loc = useLocation()
  const [inv, setInv] = useState<any>(null)
  const [cf, setCf] = useState<any>(null)
  const [stab, setStab] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [resultsPath, setResultsPath] = useState('dbfs:/Volumes/aethergen/evidence/ab/compare/results.json')
  const [gates, setGates] = useState<{ invariance_improvement_min: number; counterfactual_avg_shift_max: number; context_stability_max_delta: number } | null>(null)

  async function fetchCollected() {
    setError(null)
    try {
      const res = await fetch(`.netlify/functions/metrics-collect?results_path=${encodeURIComponent(resultsPath)}`)
      const json = await res.json()
      if (json?.ok) {
        setInv(json.metrics.invariance)
        setCf(json.metrics.counterfactual)
        setStab(json.metrics.context_stability)
      } else {
        setError('collect failed')
      }
    } catch (e: any) {
      setError(e?.message || 'collect error')
    }
  }

  // Auto-load from query params and load gates/metrics
  useEffect(() => {
    try {
      const qs = new URLSearchParams(loc.search)
      const rp = qs.get('results_path')
      if (rp) setResultsPath(rp)
    } catch {}
    ;(async () => {
      try {
        const r=await fetch('/context-gates.json');
        if(r.ok) setGates(await r.json())
        else setError('Failed to load gates')
      } catch (e:any) { setError(e?.message || 'Failed to load gates') }
      await fetchCollected()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function downloadAcceptance() {
    if (!gates || !inv || !cf || !stab) {
      setError('Load metrics and gates first')
      return
    }
    const invPass = (inv.improvement ?? 0) >= gates.invariance_improvement_min
    const cfPass = (cf.avg_shift ?? Infinity) <= gates.counterfactual_avg_shift_max
    const stabPass = (stab.max_delta ?? Infinity) <= gates.context_stability_max_delta
    const lines = [
      `results_path: ${resultsPath}`,
      `invariance_improvement: ${inv.improvement ?? 'n/a'} (gate ${gates.invariance_improvement_min}) -> ${invPass ? 'PASS' : 'FAIL'}`,
      `counterfactual_avg_shift: ${cf.avg_shift ?? 'n/a'} (gate ${gates.counterfactual_avg_shift_max}) -> ${cfPass ? 'PASS' : 'FAIL'}`,
      `context_stability_max_delta: ${stab.max_delta ?? 'n/a'} (gate ${gates.context_stability_max_delta}) -> ${stabPass ? 'PASS' : 'FAIL'}`,
      `overall: ${(invPass && cfPass && stabPass) ? 'PASS' : 'FAIL'}`
    ].join('\n')
    const blob = new Blob([lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'acceptance.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function publishAcceptance() {
    if (!gates) { setError('Load gates first'); return }
    try {
      const ucTable = prompt('Optional UC object full name (e.g., catalog.schema.table or catalog.schema.model):') || undefined
      let ucType: any = undefined
      if (ucTable) {
        const t = prompt('UC object type (tables/models/functions/views). Default: tables') || ''
        if (t) ucType = t
      }
      const res = await fetch(`.netlify/functions/acceptance-publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results_path: resultsPath, gates, uc_table: ucTable, uc_object_type: ucType })
      })
      const json = await res.json()
      if (!json?.ok) setError('publish failed')
    } catch (e: any) { setError(e?.message || 'publish error') }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Context Metrics Dashboard (Dev)</h1>
      {error && <div className="mb-3 text-sm text-red-700">{error}</div>}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Results Path (DBFS)</label>
        <input className="w-full border rounded px-3 py-2" value={resultsPath} onChange={e=>setResultsPath(e.target.value)} />
        <button onClick={fetchCollected} className="mt-2 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Fetch Metrics</button>
      </div>
      <div className="mb-4">
        <button onClick={async()=>{ try { const r=await fetch('/context-gates.json'); if(r.ok) setGates(await r.json()); else setError('Failed to load gates') } catch(e:any){ setError(e?.message||'Failed to load gates') } }} className="px-3 py-2 bg-slate-800 text-white rounded hover:bg-slate-900">Load Gates</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">Invariance</h2>
          {gates && inv && (
            <div className={(inv.improvement ?? 0) >= gates.invariance_improvement_min ? 'text-emerald-600' : 'text-red-600'}>
              Gate: {(inv.improvement ?? 0) >= gates.invariance_improvement_min ? 'PASS' : 'FAIL'}
            </div>
          )}
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-80">{JSON.stringify(inv, null, 2)}</pre>
        </div>
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">Counterfactual</h2>
          {gates && cf && (
            <div className={(cf.avg_shift ?? Infinity) <= gates.counterfactual_avg_shift_max ? 'text-emerald-600' : 'text-red-600'}>
              Gate: {(cf.avg_shift ?? Infinity) <= gates.counterfactual_avg_shift_max ? 'PASS' : 'FAIL'}
            </div>
          )}
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-80">{JSON.stringify(cf, null, 2)}</pre>
        </div>
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">Context Stability</h2>
          {gates && stab && (
            <div className={(stab.max_delta ?? Infinity) <= gates.context_stability_max_delta ? 'text-emerald-600' : 'text-red-600'}>
              Gate: {(stab.max_delta ?? Infinity) <= gates.context_stability_max_delta ? 'PASS' : 'FAIL'}
            </div>
          )}
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-80">{JSON.stringify(stab, null, 2)}</pre>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Gate suggestions:</p>
        <ul className="list-disc pl-5">
          <li>invariance.improvement ≥ target</li>
          <li>counterfactual.avg_shift ≤ threshold</li>
          <li>context_stability.max_delta ≤ threshold</li>
        </ul>
        <button onClick={downloadAcceptance} className="mt-2 px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Download acceptance.txt</button>
        <button onClick={publishAcceptance} className="mt-2 ml-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Publish to UC Volume</button>
      </div>
    </div>
  )
}


