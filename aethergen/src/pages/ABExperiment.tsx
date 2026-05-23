import React, { useState } from 'react'
import { submitABExperiment } from '../services/abService'
import { fetchMetricsResult } from '../services/metricsService'
import { useNavigate } from 'react-router-dom'

export default function ABExperiment() {
  const nav = useNavigate()
  const [runId, setRunId] = useState<string | null>(null)
  const [state, setState] = useState<string>('IDLE')
  const [msg, setMsg] = useState<string>('')
  const [baselinePath, setBaselinePath] = useState('dbfs:/Volumes/aethergen/evidence/ab/baseline')
  const [contextPath, setContextPath] = useState('dbfs:/Volumes/aethergen/evidence/ab/context')
  const [outPath, setOutPath] = useState('dbfs:/Volumes/aethergen/evidence/ab/compare')

  async function onSubmit() {
    setMsg('')
    setRunId(null)
    setState('SUBMITTING')
    const jobSpec = undefined
    const res = await fetch(`.netlify/functions/ab-submit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_spec: jobSpec, baseline_path: baselinePath, context_path: contextPath, out_path: outPath })
    }).then(r=>r.json()).catch(()=>({ ok:false, error:'network'}))
    if (res.ok && res.run_id) {
      setRunId(res.run_id)
      setState('PENDING')
      poll(res.run_id)
    } else {
      setState('ERROR')
      setMsg(res.error || 'submit failed')
    }
  }

  async function poll(id: string) {
    const res = await fetchMetricsResult(id)
    setState(res.state || 'UNKNOWN')
    if (!res.state || ['TERMINATED','INTERNAL_ERROR','SKIPPED','FAILED'].includes(res.state)) {
      // On completion, deep-link to dashboard with results_path
      if (['TERMINATED'].includes(res.state || '')) {
        nav(`/context-dashboard?results_path=${encodeURIComponent(outPath + '/results.json')}`)
      }
      return
    }
    setTimeout(() => poll(id), 5000)
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">A/B Context Experiment (Dev)</h1>
      <div className="space-y-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Baseline Path</label>
          <input className="w-full border rounded px-3 py-2" value={baselinePath} onChange={e=>setBaselinePath(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Context Path</label>
          <input className="w-full border rounded px-3 py-2" value={contextPath} onChange={e=>setContextPath(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Compare Out Path</label>
          <input className="w-full border rounded px-3 py-2" value={outPath} onChange={e=>setOutPath(e.target.value)} />
        </div>
      </div>
      <button onClick={onSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Submit A/B Job</button>
      <div className="mt-4 text-sm text-gray-700">
        <div>Run ID: <span className="font-mono">{runId || '-'}</span></div>
        <div>State: <span className="font-semibold">{state}</span></div>
      </div>
      {msg && <div className="mt-2 text-sm text-gray-700">{msg}</div>}
    </div>
  )
}


