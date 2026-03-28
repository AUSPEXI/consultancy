import React from 'react';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, FileText, Video, Download, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const resources = [
  {
    title: "The Ultimate Guide to GEO",
    description: "Learn how Generative Engine Optimization is replacing traditional SEO and how to adapt your strategy.",
    type: "E-Book",
    icon: BookOpen,
    link: "#"
  },
  {
    title: "AI Search Ranking Factors 2026",
    description: "A comprehensive analysis of what drives visibility in ChatGPT, Gemini, and Claude.",
    type: "Report",
    icon: FileText,
    link: "#"
  },
  {
    title: "Mastering Cite-Magnets",
    description: "Video tutorial on creating high-entropy facts that AI models love to cite.",
    type: "Video",
    icon: Video,
    link: "#"
  },
  {
    title: "GEO Audit Checklist",
    description: "A step-by-step checklist to evaluate your website's readiness for AI search engines.",
    type: "Template",
    icon: Download,
    link: "#"
  },
  {
    title: "The Trojan Horse Strategy",
    description: "Case study on how to replace competitors as the preferred source in AI memory.",
    type: "Case Study",
    icon: FileText,
    link: "#"
  },
  {
    title: "Omnichannel Seeding Playbook",
    description: "How to distribute your facts across high-authority platforms for maximum AI consensus.",
    type: "Guide",
    icon: BookOpen,
    link: "#"
  }
];

export function ResourcesPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 flex flex-col overflow-x-hidden">
      <PublicHeader onLoginClick={signInWithGoogle} />
      
      <main className="pt-32 pb-24 flex-1">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">Resources</h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Guides, reports, and tools to help you master Generative Engine Optimization and dominate AI search.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <div 
                key={index} 
                className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-900/50 transition-colors group flex flex-col h-full"
              >
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-400">
                  <resource.icon className="w-6 h-6" />
                </div>
                <div className="mb-4">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
                    {resource.type}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-zinc-100">{resource.title}</h3>
                <p className="text-zinc-400 mb-6 flex-1">
                  {resource.description}
                </p>
                <a 
                  href={resource.link}
                  className="inline-flex items-center text-indigo-400 font-medium hover:text-indigo-300 transition-colors mt-auto"
                >
                  Access Resource <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            ))}
          </div>

          <div className="mt-20 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold font-heading mb-4 text-white">Need a custom GEO strategy?</h2>
              <p className="text-zinc-300 mb-8 max-w-2xl mx-auto text-lg">
                Our experts can analyze your brand's current AI Share of Voice and build a roadmap to dominate your industry's prompts.
              </p>
              <button 
                onClick={signInWithGoogle}
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
