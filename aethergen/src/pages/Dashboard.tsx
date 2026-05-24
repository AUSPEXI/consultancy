import React from 'react'
import { Link } from 'react-router-dom'
import { Activity, Brain, Shield, Zap, FileText, Settings, BarChart3, Package } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center text-slate-900">
            <Settings className="w-6 h-6 mr-2 text-blue-600" />
            <h1 className="text-2xl font-bold">AethergenPlatform Dashboard</h1>
          </div>
          <p className="text-slate-700 mt-1">Quick access to experiments, starters, context, risk, on‑device SLOs, and evidence.</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/experiments/nyc-taxi-eval" className="block bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-50/30 transition">
            <div className="flex items-center mb-2 text-slate-900"><BarChart3 className="w-5 h-5 mr-2 text-indigo-600" /> NYC Taxi Evaluation</div>
            <div className="text-slate-700 text-sm">Baseline vs composed routing; tokens, latency, actions; CSV export.</div>
          </Link>

          <Link to="/build" className="block bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-50/30 transition">
            <div className="flex items-center mb-2 text-slate-900"><Brain className="w-5 h-5 mr-2 text-indigo-600" /> Model Starters</div>
            <div className="text-slate-700 text-sm">8 presets with downloads and evidence hooks.</div>
          </Link>

          <Link to="/context-engineering" className="block bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-50/30 transition">
            <div className="flex items-center mb-2 text-slate-900"><Activity className="w-5 h-5 mr-2 text-indigo-600" /> Context Engineering</div>
            <div className="text-slate-700 text-sm">Hybrid retrieval, signals, and budget packing.</div>
          </Link>

          <Link to="/blog/hallucination-risk-guard-pre-generation" className="block bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-50/30 transition">
            <div className="flex items-center mb-2 text-slate-900"><Shield className="w-5 h-5 mr-2 text-indigo-600" /> Risk Guard</div>
            <div className="text-slate-700 text-sm">Pre‑generation risk with generate/fetch/abstain.</div>
          </Link>

          <Link to="/on-device-ai" className="block bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-50/30 transition">
            <div className="flex items-center mb-2 text-slate-900"><Zap className="w-5 h-5 mr-2 text-indigo-600" /> On‑Device SLOs</div>
            <div className="text-slate-700 text-sm">Fallback rate, battery, and thermal budgets.</div>
          </Link>

          <Link to="/blog/evidence-efficient-ai-73-percent-faster" className="block bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-50/30 transition">
            <div className="flex items-center mb-2 text-slate-900"><FileText className="w-5 h-5 mr-2 text-indigo-600" /> Evidence‑Efficient AI (73%)</div>
            <div className="text-slate-700 text-sm">Plain‑English explainer and results.</div>
          </Link>
          <Link to="/stability-demo#evaluators" className="block bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-50/30 transition">
            <div className="flex items-center mb-2 text-slate-900"><Shield className="w-5 h-5 mr-2 text-indigo-600" /> Evaluations</div>
            <div className="text-slate-700 text-sm">Thresholds & fail‑closed actions; live scores.</div>
          </Link>
          <Link to="/blog/a-billion-queries-10-months-promise-kept" className="block bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-50/30 transition">
            <div className="flex items-center mb-2 text-slate-900"><FileText className="w-5 h-5 mr-2 text-indigo-600" /> A Billion Queries (Story)</div>
            <div className="text-slate-700 text-sm">Human story, 1B proof, and pilot CTA.</div>
          </Link>

          <Link to="/air-gapped-demo" className="block bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-50/30 transition">
            <div className="flex items-center mb-2 text-slate-900"><Package className="w-5 h-5 mr-2 text-indigo-600" /> Evidence Export</div>
            <div className="text-slate-700 text-sm">Export signed bundles with crypto profile.</div>
          </Link>
        </div>
      </main>
    </div>
  )
}
