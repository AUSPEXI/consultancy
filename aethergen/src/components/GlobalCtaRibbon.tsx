import React from 'react'
import { Link } from 'react-router-dom'

const enabled = (import.meta as any)?.env?.VITE_SHOW_PILOT_CTA === 'true'

export default function GlobalCtaRibbon() {
  if (!enabled) return null
  return (
    <div className="fixed bottom-4 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-emerald-600 text-white rounded-full shadow-lg px-4 py-2 flex items-center justify-between">
          <div className="text-sm">Request a Pilot: fixed‑scope evaluation with signed evidence. Limited September slots.</div>
          <Link to="/pilot" className="ml-3 bg-white text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-slate-100">Get Started</Link>
        </div>
      </div>
    </div>
  )
}


