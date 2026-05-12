import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Globe, ShieldCheck, Zap, ArrowRight, FileText, Lock, CheckCircle2 } from 'lucide-react';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const INVESTMENT_HIGHLIGHTS = [
  {
    title: "First-Mover Advantage in GEO",
    icon: TrendingUp,
    description: "As search volume fundamentally shifts from traditional aggregate engines (Google) to deterministic answer engines (ChatGPT, Gemini), Auspexi is capturing the emerging multi-billion dollar Generative Engine Optimization space before incumbents can pivot."
  },
  {
    title: "Proprietary Infrastructure",
    icon: Globe,
    description: "We are advancing beyond foundational AI integrations to build the analytical infrastructure of GEO. Our upcoming semantic affinity tracking and robust probe models will create an insurmountable data moat."
  },
  {
    title: "High-Margin Recurring Revenue",
    icon: BarChart3,
    description: "Enterprise SaaS model optimized for high Net Revenue Retention (NRR). As brands realize AI Share of Voice (SoV) is mission-critical, our platform becomes a non-discretionary operational expenditure."
  },
  {
    title: "Defensible IP & Architecture",
    icon: ShieldCheck,
    description: "Our roadmap introduces Sentiment Drift Detection and Unified GEO Benchmarking, establishing Auspexi not just as a tool, but as the industry-standard arbiter of AI visibility."
  }
];

const STRATEGIC_INITIATIVES = [
  {
    phase: "Phase I: The Foundation",
    title: "Intelligent Market Positioning",
    status: "Operational",
    description: "Our current platform establishes initial recurring revenue and essential utility. We provide brands with actionable intelligence, continuous brand monitoring, and competitive gap analysis across major foundational models."
  },
  {
    phase: "Phase II: Infrastructure",
    title: "Semantic Tracking & Probing",
    status: "In Development",
    description: "We are investing capital into deploying resilient probing infrastructure and real-time semantic tracking. This transition elevates our platform from diagnostic software to an indispensable, real-time intelligence network."
  },
  {
    phase: "Phase III: Automation",
    title: "Authoritative RAG Optimization",
    status: "Q1 2027",
    description: "Deployment of structured pipelines that optimize brand knowledge for Retrieval-Augmented Generation engines, establishing authoritative control over how AI models cite our enterprise clients."
  }
];

export function InvestorHubPage() {
  const { signInWithGoogle } = useAuth();
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const handleDownload = () => {
    setHasDownloaded(true);
    setTimeout(() => setHasDownloaded(false), 4000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pt-24 pb-16 overflow-x-hidden">
      <PublicHeader onLoginClick={signInWithGoogle} />
      
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-900/20 via-zinc-950 to-zinc-950 -z-10" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 text-pink-400 text-sm font-medium border border-pink-500/20 mb-8"
          >
            <Lock className="w-4 h-4" />
            Investor Hub & Relations
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 font-heading"
          >
            Building the Infrastructure for the <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">AI Search Economy</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Auspexi is capitalizing on the fundamental shift from traditional search engines to Answer Engines. We are building the deterministic operating system for Generative Engine Optimization (GEO).
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="/deck.pdf" 
              download="deck.pdf"
              onClick={handleDownload}
              className={`px-8 py-4 font-semibold rounded-full transition-colors flex items-center gap-2 w-full sm:w-auto justify-center ${
                hasDownloaded 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {hasDownloaded ? (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Download Started
                </>
              ) : (
                <>
                  Request Investor Deck <ArrowRight className="w-4 h-4" />
                </>
              )}
            </a>
            <a 
              href="mailto:sales@auspexi.com"
              className="px-8 py-4 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-800 border border-zinc-800 transition-colors hidden sm:flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Contact Foundry Team
            </a>
          </motion.div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-24 bg-zinc-900/50 border-y border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Investment Highlights</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              We present a rare synthesis of immediate product-market fit and long-term deep technology moats.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {INVESTMENT_HIGHLIGHTS.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-pink-500/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Roadmap Overview */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Strategic Execution Plan</h2>
            <p className="text-zinc-400 text-lg">
              How we are accelerating from early market capture to total infrastructural dominance.
            </p>
          </div>

          <div className="space-y-6">
            {STRATEGIC_INITIATIVES.map((initiative, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-8 md:pl-0"
              >
                <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-zinc-800 translate-x-[39px]"></div>
                
                <div className="md:flex gap-8 group">
                  <div className="md:w-32 shrink-0 md:text-right pt-6 relative z-10 mb-4 md:mb-0">
                    <div className="hidden md:block absolute right-0 top-8 w-3 h-3 rounded-full bg-zinc-800 group-hover:bg-pink-500 transition-colors translate-x-[6px]"></div>
                    <div className="text-sm font-bold text-pink-400 mb-1">{initiative.phase}</div>
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{initiative.status}</div>
                  </div>
                  
                  <div className="flex-grow p-8 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-3">{initiative.title}</h3>
                    <p className="text-zinc-400 leading-relaxed text-lg">
                      {initiative.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center md:text-left md:ml-40">
            <Link to="/roadmap" className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 font-medium transition-colors">
              View the detailed technology roadmap <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics / Final CTA */}
      <section className="py-24 bg-gradient-to-b from-zinc-950 to-pink-950/10 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Zap className="w-12 h-12 text-pink-500 mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">Access the Data Room</h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-2xl mx-auto">
            Accredited investors and venture funds are invited to review our prospectus, detailed financial modeling, and proprietary technology demonstrations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="mailto:sales@auspexi.com?subject=Data Room Access Request"
              className="px-8 py-4 bg-pink-600 text-white font-semibold rounded-full hover:bg-pink-500 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <FileText className="w-4 h-4" /> Request Access
            </a>
          </div>
          <p className="text-zinc-600 text-sm mt-6">
            Confidentiality Agreement Required.
          </p>
        </div>
      </section>

      <Footerdemo />
    </div>
  );
}
