'use client'

import React from 'react';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { PitchDeckViewer } from '@/components/ui/PitchDeckViewer';
import { UmapVisualization } from '@/components/ui/UmapVisualization';
import Link from 'next/link';
import { Shield, Coins, TrendingUp, Handshake, ChevronRight } from 'lucide-react';

export default function InvestorHubPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 overflow-x-hidden pt-24">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20 uppercase tracking-widest font-mono">
            Series A Funding Round
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-heading">Auspexi Investor Portal</h1>
          <p className="text-lg text-zinc-400 leading-relaxed font-sans">
            Securing deterministic positioning on the agentic web. Invest in the leading Generative Engine Optimization (GEO) infrastructure category.
          </p>
        </div>

        {/* Pitch Deck Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-heading">Series A Invest Deck</h2>
              <p className="text-zinc-500 text-sm">Interactive slide presentation of modern search shifts and commercial flywheels.</p>
            </div>
            <Link href="/roadmap" className="inline-flex items-center text-sm font-semibold text-pink-400 hover:text-pink-300">
              View Product Roadmap <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <PitchDeckViewer />
        </section>

        {/* Latent Map section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading">The 768-D Latent Space Moat</h2>
            <p className="text-zinc-500 text-sm">Real-time projection model demonstrating competitor clustering and sentiment anchor tracking.</p>
          </div>
          <UmapVisualization />
        </section>

        {/* Investor info grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-zinc-900">
          <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-900 space-y-4">
            <Coins className="w-8 h-8 text-pink-500" />
            <h3 className="text-xl font-bold font-heading">High-Entropy Technology Moat</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-sans">Proprietary pgvector data repositories storing semantic embeddings mapped explicitly to brand reputation nodes.</p>
          </div>
          <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-900 space-y-4">
            <TrendingUp className="w-8 h-8 text-purple-500" />
            <h3 className="text-xl font-bold font-heading">Non-Discretionary SaaS Model</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-sans font-sans">As conversational models take over standard keyword queries, GEO becomes standard non-discretionary enterprise cost structure.</p>
          </div>
          <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-900 space-y-4">
            <Handshake className="w-8 h-8 text-indigo-500" />
            <h3 className="text-xl font-bold font-heading">Institutional Backing</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-sans">Building the trust layer for top digital agencies and Global 2000 brands requiring continuous algorithmic integrity.</p>
          </div>
        </section>
      </main>

      <Footerdemo />
    </div>
  );
}
