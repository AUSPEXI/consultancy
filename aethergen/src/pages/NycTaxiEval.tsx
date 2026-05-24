import React from 'react'
import { composedRouter } from '../services/composedRouterService'
import type { DocSpan } from '../services/contextEngine'
import { Download, Play, BarChart3 } from 'lucide-react'

type RunResult = {
  id: number
  query: string
  baselineTokens: number
  composedTokens: number
  baselineCalls: number
  composedCalls: number
  baselineLatencyMs: number
  composedLatencyMs: number
  action: string
}

function approxTokens(text: string): number { return Math.ceil((text || '').length / 4) }

async function loadAnchors(): Promise<any | null> {
  try {
    const r = await fetch('/anchor-packs/nyc_taxi_anchors.json')
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

function buildDocSpans(pack: any): DocSpan[] {
  const spans: DocSpan[] = []
  const src = 'NYC Taxi Anchors'
  const q = pack?.aggregates?.quantiles || {}
  if (q.trip_distance_km) spans.push({ id: 'distq', source: src, text: `Trip distance km quantiles: p50 ${q.trip_distance_km.p50}, p90 ${q.trip_distance_km.p90}, p99 ${q.trip_distance_km.p99}.`, score: 0.9, recency: 0.6, trust: 0.9 })
  if (q.trip_time_min) spans.push({ id: 'timeq', source: src, text: `Trip time minutes quantiles: p50 ${q.trip_time_min.p50}, p90 ${q.trip_time_min.p90}, p99 ${q.trip_time_min.p99}.`, score: 0.85, recency: 0.6, trust: 0.9 })
  if (q.fare_amount) spans.push({ id: 'fareq', source: src, text: `Fare amount USD quantiles: p50 ${q.fare_amount.p50}, p90 ${q.fare_amount.p90}, p99 ${q.fare_amount.p99}.`, score: 0.8, recency: 0.6, trust: 0.9 })
  const seg = pack?.aggregates?.segments || {}
  if (Array.isArray(seg.pickup_borough)) {
    const text = 'Pickup borough shares: ' + seg.pickup_borough.map((r: any) => `${r.key} ${r.share}`).join(', ') + '.'
    spans.push({ id: 'borough', source: src, text, score: 0.8, recency: 0.6, trust: 0.85 })
  }
  if (Array.isArray(seg.hour_of_day)) {
    const text = 'Hour of day shares: ' + seg.hour_of_day.map((r: any) => `${r.key} ${r.share}`).join(', ') + '.'
    spans.push({ id: 'hour', source: src, text, score: 0.75, recency: 0.6, trust: 0.85 })
  }
  const corr = pack?.aggregates?.correlations || []
  if (Array.isArray(corr) && corr.length) {
    const text = 'Correlations: ' + corr.map((c: any) => `${c.pair[0]}~${c.pair[1]}=${c.pearson}`).join(', ') + '.'
    spans.push({ id: 'corr', source: src, text, score: 0.7, recency: 0.6, trust: 0.8 })
  }
  return spans
}

function synthQueries(pack: any, n = 30): string[] {
  const out: string[] = []
  const ds = pack?.aggregates?.quantiles?.trip_distance_km?.p50
  if (ds) out.push('What is the median (p50) trip distance in km?')
  const fare = pack?.aggregates?.quantiles?.fare_amount?.p90
  if (fare) out.push('What is the p90 fare amount in USD?')
  out.push('Which pickup borough has the largest share?')
  out.push('Which hour band has the largest share?')
  out.push('Is fare strongly correlated with trip distance?')
  while (out.length < n) out.push('Summarize NYC taxi anchors for operations readiness')
  return out.slice(0, n)
}

function exportCsv(rows: RunResult[]) {
  const header = 'id,query,baselineTokens,composedTokens,baselineCalls,composedCalls,baselineLatencyMs,composedLatencyMs,action\n'
  const body = rows.map(r => [r.id, JSON.stringify(r.query), r.baselineTokens, r.composedTokens, r.baselineCalls, r.composedCalls, r.baselineLatencyMs, r.composedLatencyMs, r.action].join(',')).join('\n')
  const blob = new Blob([header + body], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nyc_taxi_eval.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function NycTaxiEval() {
  const [rows, setRows] = React.useState<RunResult[]>([])
  const [isRunning, setIsRunning] = React.useState(false)
  const [summary, setSummary] = React.useState<{ tokensSavedPct: number; callsSavedPct: number; latencyPct: number } | null>(null)
  const [aggressive, setAggressive] = React.useState(false)

  const run = async () => {
    setIsRunning(true)
    const pack = await loadAnchors()
    const docs = buildDocSpans(pack)
    const queries = synthQueries(pack, 40)
    const newRows: RunResult[] = []
    let baseTokens = 0, compTokens = 0, baseCalls = 0, compCalls = 0, baseLat = 0, compLat = 0
    for (let i = 0; i < queries.length; i++) {
      const q = queries[i]
      // Baseline: wide context and one big-model call
      const baselinePacked = docs.map(d => d.text).join('\n')
      const baselineTok = Math.min(3000, approxTokens(baselinePacked))
      const baselineCalls = 1
      const baselineLatency = 900 + Math.round(baselineTok * 0.15)
      // Composed
      const res = await composedRouter.run({ query: q, candidates: { bm25: docs, dense: docs }, aggressiveSummaries: aggressive })
      const composedTok = approxTokens(res.packedContext)
      const composedCalls = res.escalated ? 1 : 0
      const composedLatency = 250 + Math.round(composedTok * 0.05) + (res.escalated ? 400 : 0)
      newRows.push({ id: i + 1, query: q, baselineTokens: baselineTok, composedTokens: composedTok, baselineCalls, composedCalls, baselineLatencyMs: baselineLatency, composedLatencyMs: composedLatency, action: res.action })
      baseTokens += baselineTok; compTokens += composedTok; baseCalls += baselineCalls; compCalls += composedCalls; baseLat += baselineLatency; compLat += composedLatency
    }
    setRows(newRows)
    const tokensSavedPct = baseTokens ? Math.round(100 * (1 - compTokens / baseTokens)) : 0
    const callsSavedPct = baseCalls ? Math.round(100 * (1 - compCalls / baseCalls)) : 0
    const latencyPct = baseLat ? Math.round(100 * (1 - compLat / baseLat)) : 0
    setSummary({ tokensSavedPct, callsSavedPct, latencyPct })
    setIsRunning(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center text-slate-900">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
            <h1 className="text-2xl font-bold">NYC Taxi Evaluation (Baseline vs Composed)</h1>
          </div>
          <p className="text-slate-700 mt-1">Open Anchor Pack: NYC TLC Trips. Simulated tokens/latency; real routing and risk decisions.</p>
          <div className="mt-4 flex gap-3 items-center">
            <button onClick={run} disabled={isRunning} className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
              <Play className="w-4 h-4 mr-1" /> {isRunning ? 'Running…' : 'Run 40 queries'}
            </button>
            <label className="inline-flex items-center text-slate-900 ml-2">
              <input type="checkbox" className="mr-2" checked={aggressive} onChange={e=>setAggressive(e.target.checked)} />
              Allow summary auto‑generate when support is high
            </label>
            <button onClick={() => exportCsv(rows)} disabled={!rows.length} className="inline-flex items-center bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 disabled:opacity-50">
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </button>
          </div>
          {summary && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3"><div className="text-sm text-slate-600">Token reduction</div><div className="text-2xl font-bold text-slate-900">{summary.tokensSavedPct}%</div></div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-3"><div className="text-sm text-slate-600">Calls avoided</div><div className="text-2xl font-bold text-slate-900">{summary.callsSavedPct}%</div></div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3"><div className="text-sm text-slate-600">Latency improvement</div><div className="text-2xl font-bold text-slate-900">{summary.latencyPct}%</div></div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 text-slate-900 font-semibold">Per-query results</div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-900 font-semibold">#</th>
                  <th className="text-left px-3 py-2 text-slate-900 font-semibold">Query</th>
                  <th className="text-right px-3 py-2 text-slate-900 font-semibold">Tokens (base)</th>
                  <th className="text-right px-3 py-2 text-slate-900 font-semibold">Tokens (comp)</th>
                  <th className="text-right px-3 py-2 text-slate-900 font-semibold">Calls (base)</th>
                  <th className="text-right px-3 py-2 text-slate-900 font-semibold">Calls (comp)</th>
                  <th className="text-right px-3 py-2 text-slate-900 font-semibold">Latency ms (base)</th>
                  <th className="text-right px-3 py-2 text-slate-900 font-semibold">Latency ms (comp)</th>
                  <th className="text-left px-3 py-2 text-slate-900 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-800">{r.id}</td>
                    <td className="px-3 py-2 text-slate-900 max-w-[420px] truncate" title={r.query}>{r.query}</td>
                    <td className="px-3 py-2 text-right text-slate-800">{r.baselineTokens}</td>
                    <td className="px-3 py-2 text-right text-slate-900 font-semibold">{r.composedTokens}</td>
                    <td className="px-3 py-2 text-right text-slate-800">{r.baselineCalls}</td>
                    <td className="px-3 py-2 text-right text-slate-900 font-semibold">{r.composedCalls}</td>
                    <td className="px-3 py-2 text-right text-slate-800">{r.baselineLatencyMs}</td>
                    <td className="px-3 py-2 text-right text-slate-900 font-semibold">{r.composedLatencyMs}</td>
                    <td className="px-3 py-2 text-slate-900">{r.action}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={9} className="px-3 py-6 text-center text-slate-900">Click Run to generate results.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}


