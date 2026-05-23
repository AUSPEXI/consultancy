import React, { useState } from 'react'
import { Brain, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type Answers = {
  task?: 'text'|'retrieve'|'plan'|'segment'|'multimodal'|'imagegen'
  modality?: 'text'|'text+image'|'image'
  device?: 'ondevice'|'cloud'|'hybrid'
  latency?: 'tight'|'normal'
}

function recommend(a: Answers): { starter: string; reason: string } {
  if (a.task === 'segment' || a.modality === 'image' && a.task === 'segment') return { starter: 'sam', reason: 'Image segmentation required' }
  if (a.task === 'imagegen') return { starter: 'lcm', reason: 'Fast image generation' }
  if (a.task === 'retrieve') return { starter: 'mlm', reason: 'Embeddings + retrieval best fit' }
  if (a.task === 'multimodal' || a.modality === 'text+image') return { starter: 'vlm', reason: 'Multimodal understanding' }
  if (a.task === 'plan') return { starter: 'lam', reason: 'Plan/act with tools' }
  if (a.device === 'ondevice' || a.latency === 'tight') return { starter: 'slm', reason: 'On‑device latency/privacy' }
  return { starter: 'llm', reason: 'General text generation' }
}

export default function ChooseModel() {
  const [ans, setAns] = useState<Answers>({})
  const rec = recommend(ans)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center mb-2 text-gray-900">
            <Brain className="w-7 h-7 mr-3 text-indigo-600" />
            <h1 className="text-3xl font-bold">Choose the Right Model</h1>
          </div>
          <p className="text-gray-700">Answer a few questions. We’ll pick a starter and routing profile.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl p-6 shadow space-y-6">
          <div>
            <div className="font-semibold text-gray-900 mb-2">Primary task</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {['text','retrieve','plan','segment','multimodal','imagegen'].map(t=> (
                <button key={t} onClick={()=>setAns(a=>({...a, task: t as any}))} className={`px-3 py-2 rounded border ${ans.task===t?'bg-indigo-600 text-white':'bg-white text-gray-800'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-2">Modalities</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {['text','text+image','image'].map(m=> (
                <button key={m} onClick={()=>setAns(a=>({...a, modality: m as any}))} className={`px-3 py-2 rounded border ${ans.modality===m?'bg-indigo-600 text-white':'bg-white text-gray-800'}`}>{m}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-2">Runtime preference</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {['ondevice','cloud','hybrid'].map(d=> (
                <button key={d} onClick={()=>setAns(a=>({...a, device: d as any}))} className={`px-3 py-2 rounded border ${ans.device===d?'bg-indigo-600 text-white':'bg-white text-gray-800'}`}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-2">Latency</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {['tight','normal'].map(l=> (
                <button key={l} onClick={()=>setAns(a=>({...a, latency: l as any}))} className={`px-3 py-2 rounded border ${ans.latency===l?'bg-indigo-600 text-white':'bg-white text-gray-800'}`}>{l}</button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-gray-900 font-semibold mb-1">Recommendation</div>
            <div className="text-gray-700 mb-3">{rec.starter.toUpperCase()} — {rec.reason}</div>
            <Link to={`/starter/${rec.starter}`} className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              Create Starter <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}



