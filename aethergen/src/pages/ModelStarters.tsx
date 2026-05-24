import React from 'react'
import { Brain, Cpu, Layers, Grid, Image as Img, GitBranch, Binary, LayoutTemplate } from 'lucide-react'
import { Link } from 'react-router-dom'

type Starter = { key: string; title: string; desc: string; icon: React.FC<any>; path: string }

const starters: Starter[] = [
  { key: 'llm', title: 'LLM', desc: 'Text generation with Context Engine + Risk Guard', icon: Brain, path: '/starter/llm' },
  { key: 'slm', title: 'SLM (On‑Device)', desc: 'Small model with on‑device routing and SLOs', icon: Cpu, path: '/starter/slm' },
  { key: 'lam', title: 'LAM (Agents)', desc: 'Plan/act scaffold with typed tool adapters', icon: Layers, path: '/starter/lam' },
  { key: 'moe', title: 'MoE', desc: 'Simple expert router with per‑expert thresholds', icon: GitBranch, path: '/starter/moe' },
  { key: 'vlm', title: 'VLM', desc: 'Image+text prompts and span‑packing citations', icon: Img, path: '/starter/vlm' },
  { key: 'mlm', title: 'MLM (Embeddings)', desc: 'Retrieval pipeline with P@k/nDCG harness', icon: Grid, path: '/starter/mlm' },
  { key: 'lcm', title: 'LCM (Images)', desc: 'Fast image generation placeholder with guards', icon: LayoutTemplate, path: '/starter/lcm' },
  { key: 'sam', title: 'SAM (Segmentation)', desc: 'Mask viewer, export, and IoU evidence', icon: Binary, path: '/starter/sam' },
]

export default function ModelStarters() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h1 className="text-3xl font-bold text-gray-900">Build a Model</h1>
          <p className="text-gray-700">Choose a starter. Each includes prefilled configs, SLOs, Risk Guard/Context Engine hooks, and evidence export.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
          <div className="text-sm text-gray-800">Not sure which to pick? Try the <Link to="/choose-model" className="text-indigo-700 font-semibold">Choose the Right Model</Link> helper.</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {starters.map(s => (
            <Link key={s.key} to={s.path} className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition border">
              <div className="flex items-center mb-3">
                <s.icon className="w-6 h-6 text-indigo-600 mr-2" />
                <div className="text-lg font-bold text-gray-900">{s.title}</div>
              </div>
              <div className="text-sm text-gray-700">{s.desc}</div>
              <div className="text-xs text-indigo-700 mt-3">Create Starter →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}


