import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, Shield, Layers, Rocket, Workflow, Boxes, ArrowRight, BookOpen } from 'lucide-react'

export const Docs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Technical docs for CI evidence bundles and interactive demo quickstarts</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link to="/docs/ci-evidence" className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition border">
            <div className="flex items-center mb-3">
              <Shield className="w-6 h-6 text-indigo-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">CI & Evidence Bundles</h2>
            </div>
            <p className="text-gray-600 mb-3">Workflow, Node script, and ZIP layout (hashes, SBOM, index, PDFs, privacy).</p>
            <span className="inline-flex items-center text-indigo-600">Open <ArrowRight className="w-4 h-4 ml-1"/></span>
          </Link>

          <Link to="/docs/demos" className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition border">
            <div className="flex items-center mb-3">
              <BookOpen className="w-6 h-6 text-blue-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Demos Quickstarts</h2>
            </div>
            <p className="text-gray-600 mb-3">Short how‑to guides for Stability, Efficiency, Air‑Gapped, Automotive, Marketplace, Cards, and Financial Crime Lab.</p>
            <span className="inline-flex items-center text-blue-600">Open <ArrowRight className="w-4 h-4 ml-1"/></span>
          </Link>
        </div>
      </div>
    </div>
  )
}


