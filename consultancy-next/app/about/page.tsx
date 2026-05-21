'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Target, BrainCircuit, LineChart, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pt-24 pb-16 overflow-x-hidden">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Mastering Brand Visibility in the <span className="text-zinc-400">Generative Era</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-sans">
            Search has fundamentally changed. We build the deterministic infrastructure required to ensure your business is cited, recommended, and trusted by the world&apos;s leading AI models.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 relative shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-3xl font-bold text-white mb-1 font-heading">Gwylym Pryce-Owen</h3>
                <p className="text-zinc-300 text-lg">Founder & Chief AI Architect</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 text-zinc-300 text-lg leading-relaxed font-sans"
          >
            <h2 className="text-3xl font-bold text-white mb-6 font-heading">Built by Enterprise AI Architects</h2>
            <p>Most systems optimize for one goal and break five. We look at the complete ecosystem. While our roots in digital visibility run deep—spanning over two decades of leading search strategies—the paradigm has radically shifted. Generative AI requires fundamentally different architecture.</p>
            <p>We are not an agency playing with prompts. Our team engineers production-grade, deterministic AI systems. From deploying billion-row synthetic data pipelines at enterprise scale, to building multi-tenant architectures protected by 6-layer security, we operate at the bleeding edge of the AI frontier.</p>
            <p>By understanding exactly how LLMs retrieve, cross-reference, and synthesize data, we focus on engineering your future outcomes. Instead of measuring past responses, our architecture actively secures your visibility for tomorrow&apos;s queries.</p>
            <p>That&apos;s why we built <strong>Auspexi</strong>. Founded on data science and strategic schema frameworks, Auspexi doesn&apos;t just monitor the algorithms—it ensures your brand becomes the irrefutable, deterministic answer within an AI&apos;s neural network. We don&apos;t guess; we engineer your visibility.</p>
            <div className="pt-6">
              <Link href="/#pricing">
                <Button className="bg-white text-black hover:bg-zinc-200 rounded-full px-8 py-6 text-base font-medium shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
                  Secure Your GEO Advantage <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-900/50 rounded-3xl p-8 md:p-16 mb-32 relative overflow-hidden shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]"
        >
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-zinc-800/30 rounded-full blur-3xl" />
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10 font-sans">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-heading">Why Generative Engine Optimization?</h2>
            <p className="text-xl text-zinc-400">We are moving from an era of probabilistic guesswork to deterministic truth.</p>
            <p className="text-lg text-zinc-300">At Auspexi, we believe that true visibility requires proactive engineering. When a customer asks ChatGPT or Perplexity for a recommendation, the AI relies on deep structured data. By mapping your brand seamlessly across these vast knowledge libraries, we ensure you become the deterministic answer.</p>
            <blockquote className="border-l-4 border-zinc-500 pl-8 py-4 my-12 text-2xl font-medium italic text-zinc-200 text-left bg-zinc-900/50 rounded-r-xl font-sans">
              &ldquo;The future of digital visibility is engineering the fundamental knowledge graphs to ensure your brand becomes the irrefutable truth in the AI era.&rdquo;
            </blockquote>
          </div>
        </motion.div>

        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-heading">The Auspexi Advantage</h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto font-sans">Built on deep AI architectural principles, our platform ensures your brand is the logical output for high-intent queries.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Target className="w-8 h-8 text-zinc-100" />, title: "Ontological Interoperability", desc: "We don't rely on simple keywords. We build sophisticated semantic frameworks, making incompatible LLM knowledge libraries recognize your brand's authority seamlessly." },
              { icon: <BrainCircuit className="w-8 h-8 text-zinc-100" />, title: "Enterprise AI Orchestration", desc: "Powered by complex multi-model routing and synthetic data pipelines, our backend engineers deep, deterministic consensus rather than just tracking it." },
              { icon: <LineChart className="w-8 h-8 text-zinc-100" />, title: "Proactive GEO Influence", desc: "Auspexi architects the foundational data layer required to actively secure citations, turning passive visibility into a verifiable, deterministic outcome." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900 rounded-2xl p-8 hover:bg-zinc-800/80 transition-colors shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]"
              >
                <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-4 font-heading">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed text-sm font-sans">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
            <div className="font-sans">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-heading">Partner with Authority</h2>
              <p className="text-xl text-zinc-400 mb-8">When you subscribe to Auspexi, you aren&apos;t just buying software. You are partnering with a dedicated engineering unit that understands the fundamental architecture of the AI revolution.</p>
              <ul className="space-y-6">
                {["Makers of billion-row synthetic data pipelines and Edge LLMs", "Enterprise environments secured by 6-layer GDPR architecture", "Pioneers of semantic mapping and structured entity data", "Engineers operating 18+ months ahead of traditional agencies"].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-zinc-300 text-lg">
                    <CheckCircle2 className="w-6 h-6 text-zinc-500 shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
            <ShieldCheck className="w-12 h-12 text-zinc-100 mb-8" />
            <h3 className="text-3xl font-bold text-white mb-6 font-heading">Don&apos;t Get Left Behind</h3>
            <p className="text-zinc-400 text-lg mb-10 leading-relaxed font-sans">The transition to Agentic AI and Generative Search is happening now. Secure your brand&apos;s position as the authoritative answer for years to come.</p>
            <Link href="/#pricing">
              <Button className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl py-6 text-lg font-medium shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">Start Your GEO Journey</Button>
            </Link>
          </motion.div>
        </div>
      </div>
      <Footerdemo />
    </div>
  );
}
