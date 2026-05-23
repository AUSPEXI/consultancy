import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, CreditCard, Calendar } from 'lucide-react'

const STRIPE_DEPOSIT = (import.meta as any)?.env?.VITE_STRIPE_PILOT_LINK_DEPOSIT as string | undefined
const STRIPE_FULL = (import.meta as any)?.env?.VITE_STRIPE_PILOT_LINK_FULL as string | undefined
const CALENDLY = (import.meta as any)?.env?.VITE_CALENDLY_URL as string | undefined

export default function Pilot() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-slate-900">Request a Pilot</h1>
          <p className="text-slate-700 mt-2">Evidence‑Efficient Evaluation Sprint: fast, fixed‑scope, with a signed evidence bundle at the end.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">What you get (2–4 weeks)</h2>
          <ul className="list-disc ml-5 text-slate-800 space-y-2">
            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-1" /> Anchor seeding (5–15% corpus), hybrid retrieval, and SLM‑first routing</li>
            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-1" /> Risk‑aware answers (generate / fetch more / abstain) with calibrated coverage</li>
            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-1" /> Measured savings: tokens, latency p95, large‑model call avoidance</li>
            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-1" /> Signed evidence bundle: metrics summary, provenance, crypto profile</li>
          </ul>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Book & Pay</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <a href={STRIPE_DEPOSIT || '#'} target="_blank" rel="noreferrer" className={`inline-flex items-center px-4 py-2 rounded text-white ${STRIPE_DEPOSIT ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 cursor-not-allowed'}`}>
              <CreditCard className="w-4 h-4 mr-2" /> Pay Deposit
            </a>
            <a href={STRIPE_FULL || '#'} target="_blank" rel="noreferrer" className={`inline-flex items-center px-4 py-2 rounded text-white ${STRIPE_FULL ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-400 cursor-not-allowed'}`}>
              <CreditCard className="w-4 h-4 mr-2" /> Pay in Full
            </a>
            <a href={CALENDLY || '#'} target="_blank" rel="noreferrer" className={`inline-flex items-center px-4 py-2 rounded text-white ${CALENDLY ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'}`}>
              <Calendar className="w-4 h-4 mr-2" /> Schedule 30‑min call
            </a>
          </div>
          {!STRIPE_DEPOSIT || !STRIPE_FULL || !CALENDLY ? (
            <p className="text-xs text-slate-600 mt-2">Stripe/Calendly links not set. Add VITE_STRIPE_PILOT_LINK_DEPOSIT, VITE_STRIPE_PILOT_LINK_FULL, VITE_CALENDLY_URL in environment.</p>
          ) : null}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Governance</h2>
          <p className="text-slate-800">We run inside your boundary (on‑device or VPC), keep anchors and compressed vectors only, and export an evidence bundle—no raw documents leave your environment.</p>
        </section>

        <div className="text-sm text-slate-600">Prefer email? <Link to="/contact" className="text-blue-600 underline">Contact us</Link>.</div>
      </main>
    </div>
  )
}


