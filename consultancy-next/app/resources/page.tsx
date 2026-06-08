'use client'

import React from 'react';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { BookOpen, FileText, Video, Download, ArrowRight, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const resources = [
  {
    title: "The CEO's Guide to GEO",
    description: "Why Generative Engine Optimization is your next growth lever, and how to build the business case for AI visibility investment.",
    type: "Guide",
    icon: BookOpen,
    link: "/blog/ceo-guide-to-geo-growth-lever",
    available: true,
  },
  {
    title: "Closing the Probe-Correct-Publish Loop",
    description: "How GEO Autopilot probes AI engines, generates counter-content grounded in your Fact-Vault, and re-probes to measure the impact.",
    type: "Product",
    icon: FileText,
    link: "/blog/geo-autopilot-probe-correct-publish-loop",
    available: true,
  },
  {
    title: "Why Your Brand Needs to Exist Before It Can Be Cited",
    description: "AI models can only cite what they recognise as a discrete entity. How to establish your brand at the entity layer with Wikidata, knowledge graphs, and schema.org.",
    type: "Strategy",
    icon: FileText,
    link: "/blog/entity-intelligence-brand-knowledge-graphs",
    available: true,
  },
  {
    title: "GEO Audit Checklist",
    description: "A step-by-step checklist to evaluate your website's readiness for AI search engines and identify quick wins.",
    type: "Template",
    icon: Download,
    link: null,
    available: false,
  },
  {
    title: "Mastering Cite-Magnets",
    description: "How to create high-entropy facts and structured data that AI models love to cite as the irrefutable source of truth.",
    type: "Video",
    icon: Video,
    link: null,
    available: false,
  },
  {
    title: "Citation Probe Playbook",
    description: "How to read your Citation Probe results, turn missed queries into a content plan, and track your citation rate over time.",
    type: "Guide",
    icon: BookOpen,
    link: null,
    available: false,
  }
];

export default function ResourcesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 flex flex-col overflow-x-hidden">
      <PublicHeader />

      <main className="pt-32 pb-24 flex-1">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">Resources</h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Guides, reports, and tools to master Generative Engine Optimization and dominate AI search.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <div
                key={index}
                className={`bg-zinc-900/30 border rounded-2xl p-6 flex flex-col h-full transition-colors group ${resource.available ? 'border-zinc-800 hover:bg-zinc-900/50' : 'border-zinc-900 opacity-70'}`}
              >
                <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-6 text-pink-400">
                  <resource.icon className="w-6 h-6" />
                </div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-mono">{resource.type}</span>
                  {!resource.available && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-800/60 text-zinc-500 font-mono flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Coming Soon
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-3 text-zinc-100 font-heading">{resource.title}</h3>
                <p className="text-zinc-400 mb-6 flex-1 text-sm leading-relaxed">{resource.description}</p>
                {resource.available && resource.link ? (
                  <a href={resource.link} className="inline-flex items-center text-pink-400 font-medium hover:text-pink-300 transition-colors mt-auto text-sm">
                    Read Now <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <span className="inline-flex items-center text-zinc-600 text-sm mt-auto cursor-default">
                    <Lock className="w-3.5 h-3.5 mr-2" /> Available Soon
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-20 bg-gradient-to-br from-pink-900/10 to-purple-900/10 border border-pink-500/20 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold font-heading mb-4 text-white">Need a custom GEO strategy?</h2>
              <p className="text-zinc-300 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                Our experts can analyze your brand&apos;s current AI Share of Voice and build a roadmap to dominate your industry&apos;s prompts.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center justify-center bg-white hover:bg-zinc-200 text-black px-8 py-4 rounded-full font-bold transition-all hover:scale-105"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footerdemo />
    </div>
  );
}
