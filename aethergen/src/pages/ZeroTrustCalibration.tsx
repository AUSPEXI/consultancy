import React from 'react'
import { Shield, ExternalLink, CheckCircle } from 'lucide-react'

export const ZeroTrustCalibration: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center mb-2 text-gray-900">
            <Shield className="w-7 h-7 mr-3 text-indigo-600" />
            <h1 className="text-3xl font-bold">Zero‑Trust Calibration (One‑Week Sprint)</h1>
          </div>
          <p className="text-gray-700 max-w-3xl">
            We calibrate in <strong>your</strong> Databricks. No raw data leaves your account. We compute anchors via a notebook, run acceptance,
            and deliver a signed evidence bundle. Fixed fee. No surprises.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-3">How it works</h2>
            <ul className="text-gray-700 space-y-2 list-disc pl-5">
              <li>Provision PAT and running cluster (Shared/Unrestricted policy)</li>
              <li>Run our <em>Anchor Extractor</em> notebook to produce <code>anchors.json</code></li>
              <li>Execute acceptance notebook (privacy/utility/stability checks)</li>
              <li>We package signed evidence and UC delivery scripts</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Deliverables</h2>
            <ul className="text-gray-700 space-y-2 list-disc pl-5">
              <li>Anchors (<code>anchors.json</code>) and hash recorded in provenance</li>
              <li>Signed evidence zip (privacy probes, stability, utility, OP notes)</li>
              <li>UC SQL and CLI steps for Catalog/Schema/Volume</li>
              <li>One-page calibration report summary</li>
            </ul>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-12">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Quickstart Notebooks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/notebooks/anchor_extractor.py" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
              <div className="font-semibold text-gray-900 mb-1">Anchor Extractor (Databricks)</div>
              <div className="text-sm text-gray-600">Compute segment quantiles, mixes, and correlations → anchors.json</div>
              <span className="inline-flex items-center text-indigo-700 mt-1">Download <ExternalLink className="w-4 h-4 ml-1" /></span>
            </a>
            <a href="/notebooks/acceptance_checks.py" className="block bg-white rounded-lg p-4 border hover:shadow-md transition">
              <div className="font-semibold text-gray-900 mb-1">Acceptance & Evidence (Databricks)</div>
              <div className="text-sm text-gray-600">Privacy probes, stability by segment, utility KPIs → evidence.zip</div>
              <span className="inline-flex items-center text-indigo-700 mt-1">Download <ExternalLink className="w-4 h-4 ml-1" /></span>
            </a>
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-6 mb-12">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Quantum‑Safe Readiness</h3>
          <p className="text-gray-700 mb-3">We can produce PQC‑ready evidence: crypto inventory in manifests and optional hybrid signatures as policy. Learn more:</p>
          <a href="/blog/quantum-safe-readiness-aethergenplatform" className="text-emerald-700 font-semibold inline-flex items-center">Read the roadmap <ExternalLink className="w-4 h-4 ml-1" /></a>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">What you get in one week</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border"><CheckCircle className="w-5 h-5 text-emerald-600" /><div className="mt-2 font-semibold">Risk‑bounded operating point</div><div className="text-sm text-gray-600">Thresholds that respect your SLOs</div></div>
            <div className="bg-white rounded-lg p-4 border"><CheckCircle className="w-5 h-5 text-emerald-600" /><div className="mt-2 font-semibold">Signed evidence</div><div className="text-sm text-gray-600">Auditable bundle for procurement</div></div>
            <div className="bg-white rounded-lg p-4 border"><CheckCircle className="w-5 h-5 text-emerald-600" /><div className="mt-2 font-semibold">UC delivery scripts</div><div className="text-sm text-gray-600">Catalog/Schema/Volume ready</div></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ZeroTrustCalibration


