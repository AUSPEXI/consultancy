import React from 'react'
import { Link } from 'react-router-dom'

const items = [
  { title: 'Operational Stability (Drift & SLOs)', route: '/stability-demo', steps: ['Open Stability Demo', 'Select model', 'Start monitoring', 'Review breaches & drift metrics'] },
  { title: 'Efficiency & Optimization', route: '/efficiency-demo', steps: ['Open Efficiency Demo', 'Choose device profile', 'Run optimization', 'Review energy/latency KPIs'] },
  { title: 'Air‑Gapped Packaging & Verification', route: '/air-gapped-demo', steps: ['Open Air‑Gapped Demo', 'Generate package', 'Scan QR and verify manifest'] },
  { title: 'Automotive Quality (Golden Run)', route: '/automotive-demo', steps: ['Open Automotive Demo', 'Enter maintenance', 'Recalibrate', 'Run golden set'] },
  { title: 'Marketplace & Trials', route: '/marketplace-demo', steps: ['Open Marketplace Demo', 'Provision trial', 'Track usage & conversions'] },
  { title: 'Dataset & Model Cards', route: '/cards-demo', steps: ['Open Cards Demo', 'Generate cards', 'Export HTML/JSON', 'Export Evidence (Signed)'] },
  { title: 'Financial Crime Lab (Synthetic Graphs)', route: '/financial-crime-demo', steps: ['Open Financial Crime Demo', 'Set seed & OP budget', 'Run generation & eval', 'Download nodes/edges CSV'] },
]

export const DocsDemos: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Demos Quickstarts</h1>
        <p className="text-gray-700 mb-8">Short guides to try each interactive demo in minutes.</p>
        <div className="space-y-6">
          {items.map((it) => (
            <div key={it.title} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{it.title}</h2>
                <Link to={it.route} className="text-blue-600">Open</Link>
              </div>
              <ol className="list-decimal list-inside text-gray-700">
                {it.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


