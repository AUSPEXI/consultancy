import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Globe, ShieldCheck, Zap, ArrowRight, FileText, Lock, CheckCircle2, Layout, Database, Eye } from 'lucide-react';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PitchDeckViewer } from '@/components/ui/PitchDeckViewer';
import { UmapVisualization } from '@/components/ui/UmapVisualization';

const INVESTMENT_HIGHLIGHTS = [
  {
    title: "First-Mover Advantage in GEO",
    icon: TrendingUp,
    description: "As search volume fundamentally shifts from traditional aggregate engines (Google) to deterministic answer engines (ChatGPT, Gemini), Auspexi is capturing the emerging multi-billion dollar Generative Engine Optimization space before incumbents can pivot."
  },
  {
    title: "Proprietary Infrastructure",
    icon: Globe,
    description: "We are advancing beyond foundational AI integrations to build the analytical infrastructure of GEO. Our fully deployed 768-dimensional Latent Space Engine and robust pgvector backend create an insurmountable proprietary data moat."
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
    title: "Semantic Tracking & First-Party Data Moat",
    status: "Operational",
    description: "We have fully deployed our 768-dimensional Latent Space Engine backed by pgvector, creating an insurmountable, real-time proprietary data moat for anomaly detection and sentiment drift modeling."
  },
  {
    phase: "Phase III: Automation",
    title: "Authoritative RAG Optimization",
    status: "Q1 2027",
    description: "Deployment of structured pipelines that optimize brand knowledge for Retrieval-Augmented Generation engines, establishing authoritative control over how AI models cite our enterprise clients."
  }
];

const DATA_ROOM_METRICS = [
  { label: "TAM (Global)", value: "$124B", sub: "By 2028" },
  { label: "Target NRR", value: "135%+", sub: "Premium Tier" },
  { label: "LTV / CAC", value: "4.2x", sub: "Projected" },
  { label: "Gross Margin", value: "84%", sub: "SaaS Layer" }
];

export function InvestorHubPage() {
  const { signInWithGoogle, user } = useAuth();
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showDataRoom, setShowDataRoom] = useState(false);

  const isSuperUser = user?.email === 'hopiumcalculator@gmail.com';

  // Automatically show data room for super user
  if (isSuperUser && !showDataRoom) {
    setShowDataRoom(true);
  }

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
            <button 
              onClick={() => setShowDataRoom(true)}
              className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Eye className="w-4 h-4" /> Access Data Room Preview
            </button>
            <a 
              href="mailto:sales@auspexi.com"
              className="px-8 py-4 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-800 border border-zinc-800 transition-colors hidden sm:flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Contact Foundry Team
            </a>
          </motion.div>
        </div>
      </section>

      {/* Data Room Preview Section */}
      {showDataRoom && (
        <section className="py-24 px-6 relative overflow-hidden" id="data-room">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 text-[10px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full tracking-widest uppercase mb-4">
                  Confidential
                </div>
                <h2 className="text-3xl md:text-4xl font-bold font-heading text-white">The Data Room</h2>
                <p className="text-zinc-400 mt-4">
                  A comprehensive overview of our market positioning, technical architecture, and proprietary datasets. Accessing the full Data Room requires an active NDA.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Encryption Status</p>
                  <p className="text-xs font-mono text-emerald-500">AES-256_ACTIVE</p>
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pitch Deck Preview */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-pink-500" />
                  <h3 className="text-lg font-semibold text-white">Investment Pitch Deck</h3>
                </div>
                <PitchDeckViewer />
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Last Update</p>
                    <p className="text-sm font-medium text-white">May 2026</p>
                  </div>
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Version</p>
                    <p className="text-sm font-medium text-white">v4.1.2_BETA</p>
                  </div>
                </div>
              </div>

              {/* UMAP Visualization */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Layout className="w-5 h-5 text-pink-500" />
                  <h3 className="text-lg font-semibold text-white">Latent Space Visualization (UMAP)</h3>
                </div>
                <UmapVisualization />
                <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-zinc-500" />
                    <h4 className="font-bold text-white uppercase text-xs tracking-widest">Projection Logic</h4>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed italic">
                    "This UMAP reduction represents our proprietary Latent Space Map. We use hierarchical density-based clustering (HDBSCAN) to identify how brand entities are clustered within model weights, ensuring deterministic SOV modeling."
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {DATA_ROOM_METRICS.map((metric, i) => (
                <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-center group hover:border-pink-500/30 transition-colors">
                  <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">{metric.label}</p>
                  <p className="text-2xl font-bold text-white group-hover:text-pink-400 transition-colors">{metric.value}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">{metric.sub}</p>
                </div>
              ))}
            </div>
            
            {isSuperUser ? (
              <div className="mt-12 flex flex-col items-center justify-center p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Partner Access Granted</h3>
                <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                  Welcome, Gwylym. You have full administrative visibility of the Data Room. You can now download the complete investor archive directly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="/deck.pdf" 
                    download="auspexi_full_prospectus_v4.pdf"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Download Full Prospectus
                  </a>
                  <button 
                    onClick={() => alert("UMAP high-res export triggered for super-user.")}
                    className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2"
                  >
                    <Layout className="w-4 h-4" /> Export Latent Clusters
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-12 flex flex-col items-center justify-center p-8 bg-pink-500/5 border border-pink-500/10 rounded-2xl text-center">
                <Lock className="w-8 h-8 text-pink-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Want the full Data Room access?</h3>
                <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                  Request access to our P&L statements, CAP table, and complete technical specifications via our investor relations team.
                </p>
                <a 
                  href="mailto:sales@auspexi.com?subject=Full Data Room Request"
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Request Full Prospectus
                </a>
              </div>
            )}
          </div>
        </section>
      )}

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
