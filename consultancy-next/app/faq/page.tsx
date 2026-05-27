'use client'

import { useState, useRef } from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { FAQ_CATEGORIES } from '@/data/faqData';
import {
  Plus, Minus, ArrowRight,
  Zap, Brain, LineChart, Sparkles, Code2, Target, LayoutDashboard, CreditCard, Shield, Rocket,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Brain, LineChart, Sparkles, Code2, Target, LayoutDashboard, CreditCard, Shield, Rocket,
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_CATEGORIES.flatMap(cat =>
    cat.items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    }))
  ),
};

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const toggle = (key: string) =>
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 148;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const totalQuestions = FAQ_CATEGORIES.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 flex flex-col overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <PublicHeader />

      <main className="pt-32 pb-24 flex-1">

        {/* ── Hero ── */}
        <div className="max-w-7xl mx-auto px-6 text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-bold border border-pink-500/20 mb-6 uppercase tracking-widest">
            Master the AI Web
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-heading mb-5">GEO Knowledge Base</h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            {totalQuestions} questions across {FAQ_CATEGORIES.length} topics. Every answer is a standalone fact, structured for AI citation.
          </p>
        </div>

        {/* ── Sticky category nav ── */}
        <div className="sticky top-[73px] z-40 bg-zinc-950/90 backdrop-blur-md border-y border-zinc-800/60 py-3 mb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              {FAQ_CATEGORIES.map(cat => {
                const Icon = ICONS[cat.icon];
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollTo(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shrink-0 whitespace-nowrap"
                  >
                    {Icon && <Icon className="w-3 h-3 text-pink-400 shrink-0" />}
                    {cat.title}
                    <span className="text-zinc-600 text-[10px]">({cat.items.length})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Category sections ── */}
        <div className="max-w-7xl mx-auto px-6 space-y-20">
          {FAQ_CATEGORIES.map(cat => {
            const Icon = ICONS[cat.icon];
            return (
              <section
                key={cat.id}
                ref={el => { sectionRefs.current[cat.id] = el; }}
              >
                {/* Section header */}
                <div className="mb-8 p-6 rounded-2xl bg-zinc-900/40 shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-pink-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                      {Icon && <Icon className="w-5 h-5 text-pink-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-white font-heading">{cat.title}</h2>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
                          {cat.items.length} questions
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm">{cat.description}</p>
                    </div>
                  </div>
                </div>

                {/* Q&A grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {cat.items.map((item, idx) => {
                    const key = `${cat.id}-${idx}`;
                    const isOpen = !!openItems[key];
                    return (
                      <div
                        key={key}
                        className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                          isOpen
                            ? 'border-pink-500/30 bg-zinc-900/60'
                            : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/30'
                        }`}
                      >
                        <button
                          onClick={() => toggle(key)}
                          className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left focus:outline-none"
                        >
                          <span className={`text-sm font-semibold leading-snug transition-colors ${isOpen ? 'text-white' : 'text-zinc-300'}`}>
                            {item.question}
                          </span>
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all mt-0.5 ${
                            isOpen ? 'bg-pink-500 border-pink-500 text-white' : 'border-zinc-700 text-zinc-500'
                          }`}>
                            {isOpen ? <Minus className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                          </div>
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="px-5 pb-5 pt-1 border-t border-zinc-800/60">
                            <p className="text-zinc-400 text-sm leading-relaxed">{item.answer}</p>
                            {item.link && (
                              <Link
                                href={item.link.href}
                                className="inline-flex items-center gap-1.5 mt-3 text-pink-400 hover:text-pink-300 text-xs font-medium transition-colors group"
                              >
                                {item.link.text}
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* ── Bottom CTA ── */}
        <div className="max-w-3xl mx-auto px-6 mt-24">
          <div className="bg-zinc-900/50 rounded-3xl p-8 md:p-12 text-center shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
            <h2 className="text-3xl font-bold font-heading mb-4 text-white">Still have questions?</h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto text-lg leading-relaxed">
              Talk to Citacious in your dashboard — she knows every answer on this page and can show you exactly where to act on it in your GEO workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center bg-white hover:bg-zinc-200 text-black px-8 py-4 rounded-full font-bold transition-all hover:scale-105"
              >
                Open Dashboard
              </Link>
              <a
                href="mailto:sales@auspexi.com"
                className="inline-flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-full font-bold border border-zinc-700 transition-all"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footerdemo />
    </div>
  );
}
