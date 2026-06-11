'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Target, BrainCircuit, LineChart, ShieldCheck, ArrowRight, CheckCircle2, Database, Network, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';

const THESIS = [
  {
    stat: '70%',
    label: 'of search journeys now start with an AI engine',
    detail: 'Google, ChatGPT, Perplexity, Claude — the discovery layer has fundamentally shifted. Traditional SEO optimises for a ranking algorithm. GEO engineers the underlying knowledge that makes AI cite you as the answer.',
  },
  {
    stat: '< 3%',
    label: 'of brands have any structured GEO presence',
    detail: 'The majority of businesses are invisible to AI by default. Their content exists, but it lacks the entity density, schema architecture, and semantic anchoring that forces AI models to surface them.',
  },
  {
    stat: '18 months',
    label: 'ahead of agencies still selling keyword strategies',
    detail: 'The window to establish category authority in AI-generated responses is open now. Early movers who engineer their AI presence today will be the default citations for years. Late movers will pay to catch up.',
  },
];

const PILLARS = [
  {
    icon: <Target className="w-6 h-6 text-zinc-100" />,
    title: 'Citation Engineering',
    desc: 'We architect the exact data structures — JSON-LD schema, entity graphs, semantic anchors — that force AI models to cite your brand as the authoritative source for high-intent queries.',
  },
  {
    icon: <Database className="w-6 h-6 text-zinc-100" />,
    title: 'Share of Voice Measurement',
    desc: 'Real measurement of how often leading AI engines recommend your brand. Not estimated. Not inferred. Tested live, tracked over time, with per-query visibility into where you are and where you are not.',
  },
  {
    icon: <BrainCircuit className="w-6 h-6 text-zinc-100" />,
    title: 'Semantic Moat Construction',
    desc: 'Your brand\'s knowledge vault — mapped in 768-dimensional space. Facts that are structured, dense, and positioned so that AI models retrieve them with high confidence across every relevant query cluster.',
  },
  {
    icon: <Network className="w-6 h-6 text-zinc-100" />,
    title: 'Multi-Agent Content Pipeline',
    desc: 'Automated orchestration from topic to published, citable content. Neural crawl, fact extraction, schema generation, and synthesis — without hallucination. Content that LLMs can read, trust, and repeat.',
  },
];

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://l8entspace.com/#org',
  name: 'L8EntSpace',
  url: 'https://l8entspace.com',
  logo: 'https://l8entspace.com/l8entspace-icon.png',
  description: 'GEO platform engineering structured knowledge for AI-era brand authority across ChatGPT, Gemini, Claude, and Perplexity.',
  foundingDate: '2025',
  sameAs: ['https://linkedin.com/company/l8entspace', 'https://x.com/l8entspace'],
};

const PLATFORM_STATS = [
  { value: '10,000+', label: 'Market signals in the GEO data lake' },
  { value: '768-D', label: 'Semantic embedding dimensions' },
  { value: '4', label: 'Major AI engines tracked and measured' },
  { value: '7', label: 'Live citation probe queries per run' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pt-24 pb-32 overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-6">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-8">
            <Zap className="w-3 h-3 text-pink-400" />
            Generative Engine Optimization
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            The Infrastructure Layer for <span className="text-zinc-400">AI-Era Brand Authority</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            Search has changed permanently. We build the deterministic infrastructure that ensures your business is cited, recommended, and trusted by the world&apos;s leading AI models — not left to chance.
          </p>
        </motion.div>

        {/* Founding Thesis — 3 stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-32">
          {THESIS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
            >
              <div className="text-5xl font-black text-white mb-3 tracking-tight">{t.stat}</div>
              <div className="text-sm font-semibold text-pink-400 mb-4 uppercase tracking-widest">{t.label}</div>
              <p className="text-zinc-400 text-sm leading-relaxed">{t.detail}</p>
            </motion.div>
          ))}
        </div>

        {/* Platform stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800 rounded-2xl overflow-hidden mb-32 shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(255,20,147,1)]"
        >
          {PLATFORM_STATS.map((s, i) => (
            <div key={i} className="bg-zinc-950 px-8 py-10 text-center">
              <div className="text-3xl font-black text-white mb-1">{s.value}</div>
              <div className="text-xs text-zinc-500 font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Why GEO section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-900/50 rounded-3xl p-8 md:p-16 mb-32 relative overflow-hidden shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(255,20,147,1)]"
        >
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-zinc-800/30 rounded-full blur-3xl" />
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Why Generative Engine Optimization?</h2>
            <p className="text-xl text-zinc-400">We are moving from an era of probabilistic guesswork to deterministic truth.</p>
            <p className="text-lg text-zinc-300 leading-relaxed">
              When a customer asks an AI for a recommendation, the model doesn&apos;t crawl the web in real time — it retrieves from structured knowledge. Brands that have engineered their presence into that knowledge layer get cited. Brands that haven&apos;t, don&apos;t. L8EntSpace exists to close that gap systematically, measurably, and permanently.
            </p>
            <blockquote className="border-l-4 border-zinc-500 pl-8 py-4 my-12 text-2xl font-medium italic text-zinc-200 text-left bg-zinc-900/50 rounded-r-xl">
              &ldquo;The future of digital visibility is engineering the fundamental knowledge structure so your brand becomes the irrefutable answer in the AI era.&rdquo;
            </blockquote>
          </div>
        </motion.div>

        {/* Four pillars */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The Platform Architecture</h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">Four integrated capabilities. One outcome: your brand as the AI-era authority in your category.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {PILLARS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900 rounded-2xl p-8 hover:bg-zinc-800/80 transition-colors shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(255,20,147,1)]"
              >
                <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center mb-6">{p.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{p.title}</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* From the Founder — small, credible, not dominating */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <div className="max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-700 shadow-[0_0_0_2px_rgba(255,20,147,0.4)]">
                  <img
                    src="/bio-pic.png"
                    alt="Gwylym Pryce-Owen"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-zinc-300 text-lg leading-relaxed italic mb-6">
                  &ldquo;Two decades in digital strategy taught me one thing — every major platform shift creates a brief window where early movers lock in structural advantages that compound for years. We are at that window with AI now. L8EntSpace is built to make sure the brands that move first get the citations that matter, before the space saturates.&rdquo;
                </p>
                <div>
                  <div className="font-bold text-white">Gwylym Pryce-Owen</div>
                  <div className="text-sm text-zinc-500">Founder, L8EntSpace</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Partner with authority + CTA */}
        <div className="grid md:grid-cols-2 gap-12 items-start mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Built on Evidence, Not Estimates</h2>
              <p className="text-xl text-zinc-400 mb-8">Every L8EntSpace recommendation is grounded in live measurement — not industry averages or projected models.</p>
              <ul className="space-y-5">
                {[
                  'Live citation testing across AI engines — not simulated, not sampled',
                  'Semantic embedding of your brand facts into a real 768-dimensional space',
                  'Automated content pipeline from topic to published, schema-structured article',
                  'Trend tracking from baseline — so you know whether your position is improving',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(255,20,147,1)]">
            <ShieldCheck className="w-12 h-12 text-zinc-100 mb-8" />
            <h3 className="text-3xl font-bold text-white mb-4">The Window Is Open Now</h3>
            <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
              The transition to AI-first search is happening faster than most organisations have planned for. The brands that establish GEO authority in the next 12 months will be the ones competitors are paying to catch up to in 36.
            </p>
            <Link href="/#pricing">
              <Button className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl py-6 text-lg font-medium shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(255,20,147,1)]">
                Start Your GEO Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>

      </div>
      <Footerdemo />
    </div>
  );
}
