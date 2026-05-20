'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Home() {
  const [email, setEmail] = useState('')
  const [domain, setDomain] = useState('')

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Navigation */}
      <header className="border-b border-zinc-900 sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold">Auspexi</div>
          <nav className="flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white">Features</a>
            <a href="#pricing" className="text-sm text-zinc-400 hover:text-white">Pricing</a>
            <button className="text-sm px-4 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-900">
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-32 px-6 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">
          Don't let AI leave your brand behind.
        </h1>
        <p className="text-xl text-zinc-400 mb-8">
          Generative Engine Optimization (GEO) ensures your brand is cited by ChatGPT, Gemini, and Claude.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 max-w-md">
          <Input 
            type="email" 
            placeholder="Enter your work email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input 
            type="text" 
            placeholder="Company domain" 
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <Button className="bg-white text-black hover:bg-zinc-200">
            Get Free Report
          </Button>
        </div>
      </section>

      {/* Features placeholder */}
      <section id="features" className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Features</h2>
          <p className="text-zinc-400">Coming soon: Full feature grid from your current Vite app</p>
        </div>
      </section>

      {/* Pricing placeholder */}
      <section id="pricing" className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Pricing</h2>
          <p className="text-zinc-400">Coming soon: Full pricing from your current Vite app</p>
        </div>
      </section>
    </div>
  )
}
