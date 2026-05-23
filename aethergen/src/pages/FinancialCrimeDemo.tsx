import React, { useState } from 'react'
import { Download, Shuffle, Play } from 'lucide-react'
import { createGraph, exportEdgesCsv, exportNodesCsv, GraphSynthesisConfig } from '../services/graphSynthesisService'
import { GraphEvaluationService } from '../services/graphEvaluationService'
import { platformApi } from '../services/platformApi'

export const FinancialCrimeDemo: React.FC = () => {
  const [seed, setSeed] = useState<number>(12345)
  const [alertsPerDay, setAlertsPerDay] = useState<number>(2000)
  const [status, setStatus] = useState<string>('')
  const [result, setResult] = useState<any>(null)
  const [graphCounts, setGraphCounts] = useState<{ nodes: number; edges: number } | null>(null)

  const generate = async () => {
    setStatus('Generating synthetic graph...')
    const cfg: GraphSynthesisConfig = {
      seed,
      nodes: { customers: 5000, accounts: 8000, merchants: 2000 },
      seasonality: { weekly: true, monthly: true },
      typologies: {
        structuring: { window_hours: 72, threshold: 1000 },
        mule_ring: { size: 12, reuse: 0.35 },
        card_testing: { burst: 50, cooldown_minutes: 10 },
        sanctions_evasion: { path_len_min: 3, path_len_max: 5 },
        first_party_abuse: { collusion_rate: 0.2 }
      }
    }
    const graph = createGraph(seed, cfg)
    setGraphCounts({ nodes: graph.nodes.length, edges: graph.edges.length })
    const evalSvc = new GraphEvaluationService()
    const op = { alerts_per_day: alertsPerDay }
    const evalRes = evalSvc.evaluate(graph, op)
    const sweep = evalSvc.sweep(graph, 'mule_ring.size', [10, 12, 15], op)
    setResult({ eval: evalRes, sweep: sweep.sweeps })
    setStatus('Done')

    if (platformApi.isLive()) {
      try {
        await platformApi.logMlflow({
          summary: {
            fc_nodes: graph.nodes.length,
            fc_edges: graph.edges.length,
            fc_alerts_per_day: alertsPerDay,
            fc_lift_vs_baseline: evalRes.utility.lift_vs_baseline,
            fc_region_max_delta: evalRes.stability.region_max_delta
          }
        })
      } catch {}
    }
  }

  const downloadCsv = async (type: 'nodes' | 'edges') => {
    const cfg: GraphSynthesisConfig = { seed, nodes: { customers: 1000, accounts: 1500, merchants: 500 } }
    const graph = createGraph(seed, cfg)
    const csv = type === 'nodes' ? exportNodesCsv(graph) : exportEdgesCsv(graph)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `graph_${type}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Financial Crime Lab</h1>
        <p className="text-gray-900 mb-6">Generate synthetic transaction graphs with typologies, evaluate at operating budgets, and export for analysis.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seed</label>
            <div className="flex items-center gap-2">
              <input type="number" value={seed} onChange={e => setSeed(parseInt(e.target.value||'0', 10))} className="w-full px-3 py-2 border rounded-lg" />
              <button onClick={() => setSeed(Math.floor(Math.random()*1e9))} className="px-3 py-2 bg-slate-100 rounded-lg"><Shuffle className="w-4 h-4"/></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alerts/day (OP)</label>
            <input type="number" value={alertsPerDay} onChange={e => setAlertsPerDay(parseInt(e.target.value||'0', 10))} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex items-end">
            <button onClick={generate} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"><Play className="w-4 h-4 mr-2"/> Run</button>
          </div>
        </div>

        {status && <div className="mb-4 text-sm text-slate-600">{status}</div>}

        {graphCounts && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-900">Nodes</div>
              <div className="text-2xl font-bold text-blue-900">{graphCounts.nodes.toLocaleString()}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-900">Edges</div>
              <div className="text-2xl font-bold text-blue-900">{graphCounts.edges.toLocaleString()}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-900">OP Alerts/day</div>
              <div className="text-2xl font-bold text-blue-900">{alertsPerDay.toLocaleString()}</div>
            </div>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Utility & Stability</h3>
              <div className="text-sm text-gray-900">Lift vs. baseline: {(result.eval.utility.lift_vs_baseline*100).toFixed(1)}% (CI [{(result.eval.utility.ci[0]*100).toFixed(0)}%, {(result.eval.utility.ci[1]*100).toFixed(0)}%])</div>
              <div className="text-sm text-gray-900">Region max delta: {(result.eval.stability.region_max_delta*100).toFixed(1)}%</div>
              <div className="text-sm text-gray-900">Product max delta: {(result.eval.stability.product_max_delta*100).toFixed(1)}%</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">Latency & Cost</h3>
              <div className="text-sm text-gray-900">p50/p95/p99: {result.eval.latency.p50}/{result.eval.latency.p95}/{result.eval.latency.p99} ms</div>
              <div className="text-sm text-gray-900">Cases/analyst-hour: {result.eval.cost.cases_per_analyst_hour.toFixed(1)}</div>
            </div>
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">Sensitivity (mule_ring.size)</h3>
              <div className="text-sm text-slate-700">{result.sweep.map((s:any)=>`${s.value}:${(s.lift*100).toFixed(1)}%`).join('  |  ')}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={()=>downloadCsv('nodes')} className="px-3 py-2 bg-slate-100 rounded-lg flex items-center"><Download className="w-4 h-4 mr-2"/>Nodes CSV</button>
          <button onClick={()=>downloadCsv('edges')} className="px-3 py-2 bg-slate-100 rounded-lg flex items-center"><Download className="w-4 h-4 mr-2"/>Edges CSV</button>
        </div>
      </div>
    </div>
  )
}


