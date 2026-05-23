import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { generateStarterZip } from '../services/starterService'

export default function StarterDetail() {
  const { type } = useParams()
  const [busy, setBusy] = useState(false)
  async function download() {
    if (!type) return
    setBusy(true)
    try {
      const blob = await generateStarterZip(type as any)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `starter_${type}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Starter: {type?.toUpperCase()}</h1>
        <p className="text-gray-700 mb-6">Download a scaffold ZIP with default SLOs, Risk Guard/Context Engine hooks, and evidence placeholders.</p>
        <button onClick={download} disabled={busy} className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 disabled:opacity-50">
          {busy ? 'Preparing…' : 'Download Starter'}
        </button>
      </div>
    </div>
  )
}



