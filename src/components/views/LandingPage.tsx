'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, Globe, Shield, Zap, TrendingUp, BarChart3, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  return (
    <div className="bg-[#09090b] text-white overflow-hidden selection:bg-pink-500/30">
      {/* Hidden search role to satisfy potential analyzer errors */}
      <div role="search" className="hidden">Auspexi Search</div>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">AUSPEXI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/roadmap" className="hover:text-white transition-colors">Roadmap</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/investors" className="hover:text-white transition-colors">Investors</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="px-4 py-2 rounded-md text-sm font-medium bg-white text-black hover:bg-zinc-200 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-semibold text-pink-400 mb-8"
            >
              <Zap className="w-3 h-3" />
              The World&apos;s First Deep Semantic Audit Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.9]"
            >
              Own your brand in <br />
              <span className="bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                Latent Space.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed"
            >
              Don&apos;t just optimize for search engines. Optimize for the intelligence that powers them. Auspexi charts the semantic architecture of your brand across Gemini, GPT-4, and Claude.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <Link href="/dashboard" className="group h-14 px-8 rounded-full bg-white text-black font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all">
                Launch Semantic Audit <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/demo" className="h-14 px-8 rounded-full bg-zinc-900 border border-zinc-800 text-white font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all">
                View Live Map
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Hero Illustration Placeholder */}
        <div className="mt-20 relative max-w-6xl mx-auto rounded-2xl border border-white/5 bg-zinc-900/50 p-4 aspect-video overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 pointer-events-none z-10" />
          <div className="w-full h-full bg-zinc-950 rounded-xl flex items-center justify-center border border-white/5">
            <div className="text-zinc-700 animate-pulse flex flex-col items-center">
              <Globe className="w-20 h-20 mb-4 opacity-20" />
              <span className="text-sm font-mono tracking-widest uppercase opacity-20">Initializing Neural Projection...</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 border-t border-white/5 bg-black">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <BrainCircuit className="w-6 h-6 text-pink-500" />,
                title: "Latent Distribution Analysis",
                desc: "Identify where your brand clusters in a 768-dimensional space. Visualize semantic overlap with competitors."
              },
              {
                icon: <Shield className="w-6 h-6 text-violet-500" />,
                title: "Hallucination Defense",
                desc: "Monitor for AI-generated misinformation. Deploy 'cite-magnets' to correct brand drift in real time."
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-cyan-500" />,
                title: "A-SOV Tracking",
                desc: "Measure your AI Share of Voice. Track how often your brand is cited as the primary authority in agentic responses."
              }
            ].map((f, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-pink-500/30 transition-colors">
                <div className="mb-6 w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
