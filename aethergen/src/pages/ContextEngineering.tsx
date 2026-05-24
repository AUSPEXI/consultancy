import React, { useMemo, useState } from 'react'
import { Brain, Layers, Filter, Zap } from 'lucide-react'
import { contextEngine, type DocSpan } from '../services/contextEngine'
import { hallucinationRisk } from '../services/hallucinationRiskService'
import { platformApi } from '../services/platformApi'

export default function ContextEngineering() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center mb-2 text-gray-900">
            <Brain className="w-7 h-7 mr-3 text-indigo-600" />
            <h1 className="text-3xl font-bold">Context Engineering</h1>
          </div>
          <p className="text-gray-700 max-w-3xl">Hybrid retrieval, query planning, and context quality signals that feed our Risk Guard and evidence.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow"><Layers className="w-6 h-6 text-emerald-600" /><h3 className="font-bold mt-2 text-gray-900">Hybrid Retrieval</h3><p className="text-sm text-gray-800">BM25 + dense + reranker with recency/trust boosts and MMR de-dup.</p></div>
          <div className="bg-white rounded-xl p-6 shadow"><Filter className="w-6 h-6 text-indigo-600" /><h3 className="font-bold mt-2 text-gray-900">Signals</h3><p className="text-sm text-gray-800">retrieval_margin, support_docs, recency_score, source_trust, format_health.</p></div>
          <div className="bg-white rounded-xl p-6 shadow"><Zap className="w-6 h-6 text-amber-600" /><h3 className="font-bold mt-2 text-gray-900">Budget Packer</h3><p className="text-sm text-gray-800">Packs top spans within token budget with provenance for evidence.</p></div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow">
          <h3 className="font-bold mb-2 text-gray-900">How it integrates</h3>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li>Signals feed the Hallucination Risk Guard for sufficiency checks</li>
            <li>Provenance is added to evidence as <code>context_provenance.json</code></li>
            <li>Policy: if sufficiency low, fetch/clarify/abstain before generation</li>
          </ul>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mt-8">
          <h3 className="font-bold mb-2 text-gray-900">Live Demo (mocked)</h3>
          <p className="text-gray-700 mb-3">Ranks hybrid spans, computes signals, maps to risk, and logs a compact summary (MLflow when live mode is enabled).</p>
          <DemoHarness />
        </div>
      </div>
    </div>
  )
}

function DemoHarness() {
  const [result, setResult] = useState<{ risk: number; margin: number; retrieval: number } | null>(null)
  async function runOnce() {
    // Mocked candidates
    const bm25: DocSpan[] = [
      { id: 'a', source: 'kb/a', text: 'Policy overview and thresholds for region NA 2025Q3', score: 0.82, recency: 0.9, trust: 0.9 },
      { id: 'b', source: 'kb/b', text: 'Legacy SOP unrelated details', score: 0.55, recency: 0.2, trust: 0.6 }
    ]
    const dense: DocSpan[] = [
      { id: 'c', source: 'kb/c', text: 'Operating point selection and acceptance checks', score: 0.78, recency: 0.8, trust: 0.85 },
      { id: 'a', source: 'kb/a', text: 'Policy overview and thresholds for region NA 2025Q3', score: 0.70, recency: 0.9, trust: 0.9 }
    ]
    const spans = contextEngine.rankHybrid(bm25, dense, undefined, 4)
    const signals = contextEngine.computeSignals(spans)
    const features = {
      margin: signals.retrieval_margin,
      entropy: 1 - signals.source_trust,
      retrieval: (signals.support_docs + signals.recency_score) / 2,
      supportDocs: signals.support_docs
    }
    const risk = hallucinationRisk.computeRisk(features as any)
    setResult({ risk, margin: features.margin, retrieval: features.retrieval })
    try {
      await platformApi.postMetrics('/log-mlflow', {
        run: 'context-engineering-demo',
        params: { demo: 'context' },
        metrics: {
          ctx_margin: features.margin,
          ctx_retrieval: features.retrieval,
          ctx_support: features.supportDocs ?? 0,
          risk
        },
        tags: { page: 'context-engineering' }
      })
    } catch {}
  }
  return (
    <div>
      <button onClick={runOnce} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Run demo</button>
      {result && (
        <div className="mt-3 text-sm text-gray-700">Risk: {result.risk.toFixed(3)} · margin: {result.margin.toFixed(3)} · retrieval: {result.retrieval.toFixed(3)}</div>
      )}
    </div>
  )
}


