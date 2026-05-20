'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Search, Sparkles, ShieldCheck, ArrowRight, Video, Flame, Star, Quote } from 'lucide-react';
import Link from 'next/link';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';

export function LandingPageClient() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 overflow-x-hidden">
      <PublicHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-36 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 text-pink-400 text-xs font-semibold tracking-wider uppercase border border-pink-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            The Future of Brand Authority
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-bold font-heading tracking-tight max-w-5xl mx-auto leading-none"
          >
            Ensure your brand is cited by <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">ChatGPT, Gemini, and Claude</span>
          </motion.h1>
          <p className="text-lg md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            GEO (Generative Engine Optimization) is replacing traditional SEO. Track your brand's AI Share of Voice and seed consensus across foundation models.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="inline-flex items-center justify-center bg-white hover:bg-zinc-200 text-black px-8 py-4 rounded-full font-bold transition-all hover:scale-105">
              Launch GEO Audit <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Value Pillars Section */}
      <section className="py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-900 space-y-4">
          <div className="p-3 bg-pink-500/15 text-pink-400 w-fit rounded-xl">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-heading">AI Share of Voice</h3>
          <p className="text-zinc-400">Measure exactly how often your brand is recommended or cited across conversational prompts compared to competitors.</p>
        </div>
        <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-900 space-y-4">
          <div className="p-3 bg-purple-500/15 text-purple-400 w-fit rounded-xl">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-heading">Fact-Vault Engineering</h3>
          <p className="text-zinc-400">Inject high-entropy schema details so model pre-training and RAG systems grab your data as the authoritative consensus.</p>
        </div>
        <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-900 space-y-4">
          <div className="p-3 bg-indigo-500/15 text-indigo-400 w-fit rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-heading">Sentiment Drift Guardian</h3>
          <p className="text-zinc-400">Identify negative model biases, break unwanted semantic correlations and fix hallucinations across indices.</p>
        </div>
      </section>

      {/* Video Demonstration Section */}
      <section className="py-16 bg-zinc-900/40 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">See GEO in Action</h2>
          <p className="text-zinc-400 mb-12 max-w-xl mx-auto">Watch how our multi-agent platform automates high-entropy fact seeding to secure AI citations.</p>
          <div className="aspect-video max-w-3xl mx-auto rounded-2xl overflow-hidden border border-zinc-805 bg-[#0B0E14] relative shadow-2xl flex items-center justify-center">
            <Video className="w-16 h-16 text-zinc-700 animate-pulse" />
          </div>
        </div>
      </section>

      <Footerdemo />
    </div>
  );
}
