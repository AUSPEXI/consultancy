import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, CheckCircle } from 'lucide-react'

export default function Investors() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-slate-900">For Investors</h1>
          <p className="text-slate-700 mt-2">Calm, factual, evidence‑first. We operate faster and cheaper with risk controls, and we can prove it.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Proof at scale</h2>
          <ul className="list-disc ml-5 text-slate-800">
            <li>1,000,000 queries: 72% tokens, 73% latency, 100% large‑model calls avoided</li>
            <li>Method generalizes to closed data with anchors + SLM‑first + risk‑aware answers</li>
            <li>Evidence bundles with provenance and crypto profile</li>
          </ul>
          <div className="mt-3 text-sm">
            Read the <Link to="/blog/evidence-efficient-ai-73-percent-faster" className="text-blue-600 underline">plain‑English explainer</Link>.
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Current focus</h2>
          <div className="flex items-center text-slate-800"><CheckCircle className="w-4 h-4 text-green-600 mr-2" /> 3–5 closed‑data pilots with evidence reviews</div>
          <div className="flex items-center text-slate-800 mt-2"><CheckCircle className="w-4 h-4 text-green-600 mr-2" /> Productization: dashboard controls, evidence UX, offline kits</div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">One‑pager</h2>
          <p className="text-slate-800 mb-3">Prefer a single page? Download the concise investor brief.</p>
          <a href="/marketing/investor-brief.html" className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" /> View Investor One‑Pager
          </a>
        </section>

        <div className="text-sm text-slate-600">Questions or intros? <Link to="/contact" className="text-blue-600 underline">Contact us</Link>.</div>
      </main>
    </div>
  )
}


