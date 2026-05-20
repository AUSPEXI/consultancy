'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: '$149',
    description: 'For individuals & early-stage founders',
    features: [
      'Track 1 Brand, 5 Keywords',
      'Monthly Pulse Snapshot',
      '1GB Fact-Vault Storage',
      'Basic Latent Space Map',
      'Weekly Reports',
    ],
  },
  {
    name: 'Pro',
    price: '$499',
    description: 'For growth teams & marketing managers',
    features: [
      'Track 5 Brands, 50 Keywords',
      'Full Neural Latent Map',
      '25-Competitor Radar',
      'Z-Score Alerts',
      '10GB Fact-Vault',
      '12-Month Context Memory',
    ],
    highlighted: true,
  },
  {
    name: 'Business',
    price: '$1,899',
    description: 'For mid-market SaaS & high-growth brands',
    features: [
      'Track 25 Brands, 250 Keywords',
      'Autonomous Social Seeding',
      'Reddit & LinkedIn Bots',
      'Full API Access',
      '50GB Fact-Vault',
      'White-Glove Support',
    ],
  },
]

export function PricingSection() {
  const [currency, setCurrency] = useState<'USD' | 'GBP'>('USD')

  return (
    <section id="pricing" className="py-24 px-6 bg-zinc-900/30 border-y border-zinc-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-zinc-400 mb-8">All plans include AI inference and embedding costs.</p>

          {/* Currency Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-4 py-2 rounded-lg transition ${
                currency === 'USD'
                  ? 'bg-pink-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              USD
            </button>
            <button
              onClick={() => setCurrency('GBP')}
              className={`px-4 py-2 rounded-lg transition ${
                currency === 'GBP'
                  ? 'bg-pink-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              GBP
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-8 transition-all duration-300 ${
                plan.highlighted
                  ? 'border-pink-500 bg-pink-500/5 ring-1 ring-pink-500/20'
                  : 'border-zinc-800 bg-zinc-900/30'
              }`}
            >
              <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
              <p className="text-sm text-zinc-400 mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-zinc-400">/month</span>
              </div>

              <Button className="w-full mb-6 bg-white text-black hover:bg-zinc-200">
                Get Started
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-pink-400 mt-1 flex-shrink-0" />
                    <span className="text-sm text-zinc-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
