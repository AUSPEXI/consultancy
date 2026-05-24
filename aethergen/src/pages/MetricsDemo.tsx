import React, { useState, useEffect } from 'react'
import { submitMetricsRun, fetchMetricsResult } from '../services/metricsService'

export default function MetricsDemo() {
  const [datasetPath, setDatasetPath] = useState('dbfs:/Volumes/aethergen/evidence/datasets/sample.parquet')
  const [ucVolumePath, setUcVolumePath] = useState('dbfs:/Volumes/aethergen/evidence/metrics/demo')
  const [configJson, setConfigJson] = useState('{"fpr":0.01}')
  const [runId, setRunId] = useState<string | null>(null)
  const [state, setState] = useState<string>('IDLE')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!runId) return
    let cancelled = false
    async function poll() {
      try {
        const res = await fetchMetricsResult(runId)
        if (!cancelled) setState(res.state || 'UNKNOWN')
        if (res.state && ['TERMINATED','INTERNAL_ERROR','SKIPPED','FAILED'].includes(res.state)) return
        setTimeout(poll, 5000)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'poll error')
      }
    }
    poll()
    return () => { cancelled = true }
  }, [runId])

  async function onSubmit() {
    setError(null)
    setRunId(null)
    setState('SUBMITTING')
    try {
      let cfg: unknown = {}
      try { cfg = JSON.parse(configJson) } catch { cfg = {} }
      const res = await submitMetricsRun(datasetPath, ucVolumePath, cfg)
      if (res.ok && res.run_id) {
        setRunId(res.run_id)
        setState('PENDING')
      } else {
        setError(res.error || 'submit failed')
        setState('ERROR')
      }
    } catch (e: any) {
      setError(e?.message || 'submit error')
      setState('ERROR')
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Metrics Demo</h1>
      {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dataset Path (DBFS/UC)</label>
          <input className="w-full border rounded px-3 py-2" value={datasetPath} onChange={e=>setDatasetPath(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">UC Volume Output Path</label>
          <input className="w-full border rounded px-3 py-2" value={ucVolumePath} onChange={e=>setUcVolumePath(e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">results.json will be written under this path by Databricks</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Config (JSON)</label>
          <textarea className="w-full border rounded px-3 py-2 font-mono text-sm" rows={4} value={configJson} onChange={e=>setConfigJson(e.target.value)} />
        </div>
      </div>
      <button onClick={onSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Submit Metrics Run</button>
      <div className="mt-4 text-sm text-gray-700">
        <div>Run ID: <span className="font-mono">{runId || '-'}</span></div>
        <div>State: <span className="font-semibold">{state}</span></div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Ensure env vars DATABRICKS_HOST/TOKEN and METRICS_NOTEBOOK_PATH are configured in your serverless environment.
      </div>
    </div>
  )
}


