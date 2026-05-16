import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Globe, ShieldCheck, Zap, ArrowRight, FileText, Lock, CheckCircle2, Layout, Database, Eye, PieChart, Users, Wallet, Rocket, Cpu } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
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
    phase: "Phase III: Proprietary SLM",
    title: "The SLM Moat & Margin Expansion",
    status: "Q4 2026",
    description: "Transitioning from third-party APIs to our own self-hosted 8B parameter 'GEO-Specialist' model. Utilizing Nvidia B200 efficiency to reduce inference costs by 85% and reclaim structural gross margins."
  }
];

const DATA_ROOM_METRICS = [
  { label: "TAM (Global)", value: "$124B", sub: "By 2028" },
  { label: "Target NRR", value: "135%+", sub: "Premium Tier" },
  { label: "LTV / CAC", value: "16x", sub: "3-Year Lifecycle" },
  { label: "Gross Margin", value: "84%", sub: "Efficiency Moat" }
];

const UNIT_ECONOMICS = [
  { metric: "CAC (Acquisition)", current: "$800", target: "$450", trend: "decreasing" },
  { metric: "LTV (3-Year)", current: "$12,800", target: "$16,000", trend: "increasing" },
  { metric: "Payback Period", current: "4 Months", target: "2.5 Months", trend: "decreasing" },
  { metric: "Gross Margin", current: "84%", target: "88%", trend: "increasing" },
];

const REVENUE_DATA = [
  { year: 'Year 1 (Actual)', arr: 1.2, customers: 45 },
  { year: 'Year 2 (Proj)', arr: 4.8, customers: 180 },
  { year: 'Year 3 (Proj)', arr: 14.5, customers: 520 },
];

const USE_OF_FUNDS = [
  { name: 'Engineering', value: 45, color: '#ec4899', description: 'Phase III SLM Development & RAG Optimization' },
  { name: 'Sales & Growth', value: 35, color: '#f472b6', description: '2 AE Hires + $30k/mo Media Spend' },
  { name: 'Ops & Infra', value: 20, color: '#3f3f46', description: '50M Vector Cluster & 12mo Runway' },
];

const MARGIN_EXPANSION_DATA = [
  { quarter: 'Q2 2026', strategy: '100% Third-Party', cost: 18, margin: 72 },
  { quarter: 'Q3 2026', strategy: 'Hybrid Approach', cost: 15, margin: 76 },
  { quarter: 'Q4 2026', strategy: 'Local pgvector', cost: 12, margin: 80 },
  { quarter: 'Q1 2027', strategy: 'SLM Beta', cost: 7, margin: 86 },
  { quarter: 'Q2 2027', strategy: 'Proprietary SLM', cost: 3, margin: 92 },
];

const SLM_BUDGET = [
  { item: 'Data Engineering', amount: '$150,000', detail: 'Auto-labeling systems for pgvector logs' },
  { item: 'Human Labeling', amount: '$50,000', detail: 'Specialized SEO/Legal analyst verification' },
  { item: 'Compute (B200 Cloud)', amount: '$5,000', detail: 'Hires thousands of QLoRA training runs' },
];

const B200_BENCHMARKS = [
  { metric: "Inference Throughput", value: "4x", baseline: "vs H100 Instance" },
  { metric: "Cost per 1M Tokens", value: "$0.02", baseline: "vs $0.14 Third-Party" },
  { metric: "Fine-tuning Cost", value: "<$15", baseline: "Per 8B Parameter Run" },
  { metric: "Compute Rent", value: "$2.65/hr", baseline: "Spot Price (Series A Projection)" }
];

const STRATEGIC_PILLARS = [
  {
    title: "The 'Citation Neighborhood'",
    description: "LLMs use Cosine Similarity to retrieve info. If your embedding is outside the 'High-Confidence Cluster', you don't exist. We move you into the neighborhood.",
    icon: Globe
  },
  {
    title: "Fact-Vault Engine ROI",
    description: "Adding specific 'High-Entropy' statistics increases AI citation probability by 37%. Quotations increase visibility by 30%.",
    icon: Database
  },
  {
    title: "Defensible Attribution",
    description: "Z-Score Anomaly Detection acts as 'Pre-emptive SEO,' detecting lead-indicator Semantic Drift weeks before traffic drops.",
    icon: ShieldCheck
  }
];

const REVENUE_LOGIC_METRICS = [
  { label: "AI-Search Conversion", value: "4.4x", sub: "Higher than Traditional" },
  { label: "Avg Engagement", value: "8-10m", sub: "vs 2-3m Google refers" },
  { label: "Computational Gain", value: "40%", sub: "Reduction vs 1536-D" },
  { label: "CAGR Target", value: "50.5%", sub: "GEO Market Growth" }
];

const EMAIL_SEQUENCE = [
  { day: 1, title: "The Audit", focus: "768-D Visibility Map / Gap Analysis" },
  { day: 3, title: "Competitor Jab", focus: "Semantic Gap Exploitation" },
  { day: 5, title: "The Cure", focus: "High-Entropy Fact Injection" },
  { day: 7, title: "The Conversion", focus: "Z-Score Drift FOMO / Pro Trial" },
];

const PROPRIETARY_STACK = [
  {
    title: "768-D Latent Space Engine",
    description: "Utilizing Gemini’s text-embedding-004 for the perfect balance of semantic fidelity and 40% lower computational overhead.",
    metric: "768 Dimensions"
  },
  {
    title: "pgvector Infrastructure",
    description: "Robust, high-scale vector database capable of indexing 50M+ brand interactions using HNSW indexing.",
    metric: "50M+ Embeddings"
  },
  {
    title: "Z-Score Anomaly Detection",
    description: "Our 'Sentiment Pulse' watchdog that separates Generative Noise from true Brand Drift—a leading indicator.",
    metric: "0.01ms Latency"
  }
];

import { cn } from '@/lib/utils';
import { AreaChart as RechartsAreaChart, Area as RechartsArea, LineChart as RechartsLineChart, Line as RechartsLine, XAxis as RechartsXAxis, YAxis as RechartsYAxis, Tooltip as RechartsTooltip, CartesianGrid as RechartsCartesianGrid } from 'recharts';

function MarginExpansionChart() {
  return (
    <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Margin Expansion Trajectory</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest text-emerald-500">Recapturing the "Inference Tax"</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-500" />
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Gross Margin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Inference Cost</span>
          </div>
        </div>
      </div>
      
      <div className="h-[250px] w-full mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={MARGIN_EXPANSION_DATA}>
            <defs>
              <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <RechartsCartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <RechartsXAxis 
              dataKey="quarter" 
              fontSize={10} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a' }}
            />
            <RechartsYAxis 
              fontSize={10} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a' }}
              tickFormatter={(v) => `${v}%`}
            />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a' }}
              labelStyle={{ fontWeight: 'bold', color: 'white', marginBottom: '4px' }}
            />
            <RechartsArea 
              type="monotone" 
              dataKey="margin" 
              stroke="#ec4899" 
              strokeWidth={3} 
              fill="url(#marginGrad)" 
              name="Gross Margin"
            />
            <RechartsArea 
              type="monotone" 
              dataKey="cost" 
              stroke="#52525b" 
              strokeWidth={2} 
              fill="transparent" 
              name="Inference Cost"
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl">
            <p className="text-[10px] font-bold text-zinc-500 mb-1">Q2 2026 Strategy</p>
            <p className="text-sm font-bold text-white">Third-Party APIs</p>
            <p className="text-[10px] text-zinc-500">High operational overhead</p>
         </div>
         <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl">
            <p className="text-[10px] font-bold text-zinc-500 mb-1">Q2 2027 Strategy</p>
            <p className="text-sm font-bold text-emerald-400">Proprietary SLM</p>
            <p className="text-[10px] text-emerald-500/70">Structural Gross Margin Reset</p>
         </div>
         <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-pink-400 uppercase">Margin Gain</p>
              <p className="text-xl font-bold text-white">+20%</p>
            </div>
            <TrendingUp className="w-5 h-5 text-pink-500" />
         </div>
      </div>
    </div>
  );
}

function TechnicalAppendix() {
  return (
    <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
          <Cpu className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">B200 Efficiency Appendix</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Blackwell Generation Benchmarks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {B200_BENCHMARKS.map((b, i) => (
          <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{b.metric}</p>
            <p className="text-2xl font-bold text-white mb-1">{b.value}</p>
            <p className="text-[10px] text-zinc-600 italic">{b.baseline}</p>
          </div>
        ))}
      </div>

      <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-widest">Phase III SLM Cost allocation</h4>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {SLM_BUDGET.map((s, i) => (
            <div key={i}>
              <p className="text-xs font-bold text-white mb-1">{s.item}</p>
              <p className="text-lg font-bold text-blue-400 mb-1">{s.amount}</p>
              <p className="text-[10px] text-zinc-500 leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InvestorCalculator() {
  const [funding, setFunding] = useState(3000000);
  const [growthRate, setGrowthRate] = useState(15); // Monthly %

  const calculateReturn = () => {
    // Basic projection logic: 3 years, compound growth
    const months = 36;
    const initialUsers = 100;
    const avgArpu = 350; // Weighted average of tiers
    const margin = 0.84;
    
    let users = initialUsers;
    for (let i = 0; i < months; i++) {
       users = users * (1 + (growthRate / 100));
    }
    
    const year3ARR = users * avgArpu * 12;
    const valuation = year3ARR * 12.5; // SaaS multiple
    const returnOnInvestment = (valuation / (funding / 0.2)) * 10; // Simple ROI multiplier
    
    return {
      arr: year3ARR,
      valuation: valuation,
      roi: returnOnInvestment.toFixed(1)
    };
  };

  const results = calculateReturn();

  return (
    <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Series A Returns Calculator</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Model your 10x scenario</p>
        </div>
        <PieChart className="w-6 h-6 text-pink-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-zinc-300">Investment Amount</label>
              <span className="text-sm font-bold text-white">${(funding / 1000000).toFixed(1)}M</span>
            </div>
            <input 
              type="range" 
              min="1000000" 
              max="10000000" 
              step="500000"
              value={funding}
              onChange={(e) => setFunding(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-zinc-300">Monthly Growth Rate</label>
              <span className="text-sm font-bold text-white">{growthRate}%</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="25" 
              step="1"
              value={growthRate}
              onChange={(e) => setGrowthRate(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col justify-center text-center">
            <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Year 3 ARR</p>
            <p className="text-2xl font-bold text-white">${(results.arr / 1000000).toFixed(1)}M</p>
          </div>
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col justify-center text-center">
            <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Exit Valuation</p>
            <p className="text-2xl font-bold text-white">${(results.valuation / 1000000).toFixed(1)}M</p>
          </div>
          <div className="p-6 col-span-2 bg-pink-500/10 border border-pink-500/30 rounded-2xl flex flex-col justify-center text-center">
            <p className="text-[10px] font-bold text-pink-400 tracking-widest uppercase mb-1">Projected Multiple</p>
            <p className="text-4xl font-bold text-pink-500">{results.roi}x</p>
            <p className="text-[10px] text-pink-500/70 mt-1">Based on Series A 20% Post-Money Stake</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-pink-300">AI Search Economy</span>
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
              <div className="mt-12 space-y-12">
                {/* Partner Header */}
                <div className="p-8 bg-pink-500/5 border border-pink-500/10 rounded-2xl text-center">
                  <ShieldCheck className="w-8 h-8 text-pink-400 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-white mb-2">Partner Access Granted</h3>
                  <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                    Welcome, Gwylym. You have full administrative visibility of the Data Room. All financial modeling and proprietary stack details are unlocked.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a 
                      href="/deck.pdf" 
                      download="auspexi_seriesA_prospectus_v4.2.pdf"
                      className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> Download Full Prospectus
                    </a>
                    <button 
                      onClick={() => alert("HNSW Index Performance logs exported.")}
                      className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2"
                    >
                      <Layout className="w-4 h-4" /> Export Latent Clusters
                    </button>
                  </div>
                </div>

                {/* Financial Modeling Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">Growth Trajectory</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Projected ARR (Millions USD)</p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-pink-500" />
                    </div>
                    
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={REVENUE_DATA}>
                          <defs>
                            <linearGradient id="colorArr" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis 
                            dataKey="year" 
                            stroke="#52525b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            stroke="#52525b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(value) => `$${value}M`}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                            itemStyle={{ color: '#ec4899' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="arr" 
                            stroke="#ec4899" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorArr)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                      <Users className="w-5 h-5 text-pink-500 mb-4" />
                      <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Customer Expansion</p>
                      <h4 className="text-2xl font-bold text-white">520+ Nodes</h4>
                      <p className="text-xs text-zinc-500 mt-1">Projected by Year 3 End</p>
                    </div>
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                      <Wallet className="w-5 h-5 text-emerald-500 mb-4" />
                      <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Target Raise</p>
                      <h4 className="text-2xl font-bold text-white">$3,000,000</h4>
                      <p className="text-xs text-zinc-500 mt-1">Series A Equity Round</p>
                    </div>
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                      <Rocket className="w-5 h-5 text-pink-500 mb-4" />
                      <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Exit Multiple</p>
                      <h4 className="text-2xl font-bold text-white">10x - 15x</h4>
                      <p className="text-xs text-zinc-500 mt-1">SaaS Infrastructure Premium</p>
                    </div>
                  </div>
                </div>

                {/* Live Unit Economics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {UNIT_ECONOMICS.map((item, i) => (
                    <div key={i} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2">{item.metric}</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-white">{item.current}</p>
                          <p className="text-[10px] text-zinc-500">Target: {item.target}</p>
                        </div>
                        <div className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                          item.trend === 'increasing' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                        )}>
                          {item.trend}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Automated Growth Loop Section */}
                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Rocket className="w-48 h-48 text-pink-500 -rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">The "Trojan Horse" Growth Loop</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Automated PLG Customer Acquisition</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                      <div className="space-y-6">
                        <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl">
                          <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                             <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] flex items-center justify-center">1</span>
                             Value-In-Advance Audit
                          </h4>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            Prospects enter URL + Email on Landing Page. Exa AI generates a real-time GEO report, showing their semantic distance from target clusters.
                          </p>
                        </div>
                        <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl">
                          <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                             <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] flex items-center justify-center {">2</span>
                             7-Day Automated Nurture
                          </h4>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            A sequenced educational drip-campaign converts high-intent data into paying Pro/Business subscribers by amplifying the "Semantic Gap" pain.
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Sequence Visualization</h4>
                        <div className="space-y-3">
                          {EMAIL_SEQUENCE.map((email, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                              <div className="text-xs font-mono text-pink-500 w-12 shrink-0">DAY {email.day}</div>
                              <div className="h-px bg-zinc-800 flex-grow group-hover:bg-pink-500/30 transition-colors"></div>
                              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] min-w-[180px]">
                                <span className="font-bold text-white block mb-0.5">{email.title}</span>
                                <span className="text-zinc-500 italic">{email.focus}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investor Calculator Component */}
                <InvestorCalculator />

                {/* Margin Expansion Chart */}
                <MarginExpansionChart />

                {/* SLM / Phase III Section */}
                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                     <Cpu className="w-64 h-64 text-emerald-500 -rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Phase III: Proprietary SLM Moat</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Reclaiming the Inference Tax</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-4">
                         <h4 className="font-bold text-white">The Compute Crash</h4>
                         <p className="text-sm text-zinc-400 leading-relaxed">
                           Nvidia Blackwell B200 rollout has dropped fine-tuning costs by 90%. We can now re-train our GEO-Specialist model weekly for under $15 per run.
                         </p>
                      </div>
                      <div className="space-y-4">
                         <h4 className="font-bold text-white">Proprietary Scaling</h4>
                         <p className="text-sm text-zinc-400 leading-relaxed">
                           Replacing third-party APIs with our self-hosted 8B model reduces inference overhead by 85%, reclaiming 15% of ARR directly into EBIDTA.
                         </p>
                      </div>
                      <div className="space-y-4">
                         <h4 className="font-bold text-white">Data &gt; Model</h4>
                         <p className="text-sm text-zinc-400 leading-relaxed">
                           In 2026, compute is a commodity. Our moat is the "Golden Dataset" of 50M interactions we've curated, which foundational models cannot access.
                         </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Neural Moat Section */}
                <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Database className="w-64 h-64 text-pink-500 rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-8">The Proprietary "Neural Moat"</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      {PROPRIETARY_STACK.map((stack, i) => (
                        <div key={i} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-pink-500/30 transition-colors">
                          <h4 className="font-bold text-white mb-2">{stack.title}</h4>
                          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{stack.description}</p>
                          <div className="text-xs font-mono text-pink-400 bg-pink-500/10 px-2 py-1 rounded inline-block">
                            {stack.metric}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ROI & Attribution Section */}
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Revenue & Citation Logic</h3>
                      <p className="text-zinc-400 max-w-2xl">
                        Translating latent space vectors into enterprise value. The map is the diagnostic; the Fact-Vault is the cure.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="px-3 py-1 bg-pink-500/10 text-pink-400 text-xs font-bold rounded-full border border-pink-500/20 uppercase tracking-widest">
                        4.4x Conv. Advantage
                      </div>
                    </div>
                  </div>

                  {/* 10x Path Table */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
                    <div className="p-8 border-b border-zinc-800 bg-zinc-900/30">
                      <h4 className="text-lg font-bold text-white mb-1">The 10x Capital Efficiency Roadmap</h4>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest">Bridging Series A to Series B ($100M+ Valuation)</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Growth Phase</th>
                            <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Key Lever</th>
                            <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Capital Efficiency</th>
                            <th className="p-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Valuation Impact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          <tr className="hover:bg-zinc-900/30 transition-colors">
                            <td className="p-6">
                               <p className="text-sm font-bold text-white">Seed Bridge</p>
                               <p className="text-[10px] text-zinc-500">Current - Q3 2026</p>
                            </td>
                            <td className="p-6 text-sm text-zinc-400">PLG Loop Optimization</td>
                            <td className="p-6 text-sm text-emerald-400 font-medium">1:3.2 (Burn-to-ARR)</td>
                            <td className="p-6 text-sm text-white">$15M - $25M</td>
                          </tr>
                          <tr className="hover:bg-zinc-900/30 transition-colors">
                            <td className="p-6">
                               <p className="text-sm font-bold text-white">Series A Deployment</p>
                               <p className="text-[10px] text-zinc-500">Q4 2026 - Q2 2027</p>
                            </td>
                            <td className="p-6 text-sm text-zinc-400">Enterprise High-Touch</td>
                            <td className="p-6 text-sm text-emerald-400 font-medium">1:4.4 (Burn-to-ARR)</td>
                            <td className="p-6 text-sm text-white">$45M - $60M</td>
                          </tr>
                          <tr className="hover:bg-zinc-900/30 transition-colors">
                            <td className="p-6">
                               <p className="text-sm font-bold text-white">Scale-Up / 10x Goal</p>
                               <p className="text-[10px] text-zinc-500">Q3 2027+</p>
                            </td>
                            <td className="p-6 text-sm text-zinc-400">Proprietary SLM Infrastructure</td>
                            <td className="p-6 text-sm text-emerald-400 font-medium">1:6.1 (Margin Efficiency)</td>
                            <td className="p-6 text-sm text-pink-500 font-bold">$125M+</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {STRATEGIC_PILLARS.map((pillar, i) => (
                      <div key={i} className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl relative group overflow-hidden">
                        <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                          <pillar.icon className="w-32 h-32" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                          <pillar.icon className="w-5 h-5 text-pink-500" />
                          {pillar.title}
                        </h4>
                        <p className="text-sm text-zinc-400 leading-relaxed relative z-10">{pillar.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {REVENUE_LOGIC_METRICS.map((metric, i) => (
                      <div key={i} className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl text-center border-b-4 border-b-pink-500/50">
                        <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">{metric.label}</p>
                        <p className="text-3xl font-bold text-white">{metric.value}</p>
                        <p className="text-[10px] text-zinc-500 mt-1">{metric.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Appendix */}
                <TechnicalAppendix />

                {/* Capital Allocation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
                    <h3 className="text-xl font-bold text-white mb-6">Use of Funds</h3>
                    <div className="h-[200px] mb-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={USE_OF_FUNDS} margin={{ left: 80 }}>
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="#a1a1aa" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {USE_OF_FUNDS.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      {USE_OF_FUNDS.map((fund, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-1 px-1 rounded-full" style={{ backgroundColor: fund.color }} />
                          <div>
                            <p className="text-sm font-bold text-white">{fund.name} ({fund.value}%)</p>
                            <p className="text-xs text-zinc-500">{fund.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
                    <h3 className="text-xl font-bold text-white mb-6">TAM / SAM / SOM</h3>
                    <div className="space-y-6">
                      <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl border-l-4 border-l-pink-500">
                        <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Total Addressable Market</p>
                        <h4 className="text-3xl font-bold text-white">$124B</h4>
                        <p className="text-xs text-zinc-500 mt-1">Global AI Search Economy by 2028</p>
                      </div>
                      <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl border-l-4 border-l-pink-400">
                        <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Serviceable Addressable Market</p>
                        <h4 className="text-2xl font-bold text-white">$17.2B</h4>
                        <p className="text-xs text-zinc-500 mt-1">Enterprise GEO & Brand Visibility Shift</p>
                      </div>
                      <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl border-l-4 border-l-pink-300">
                        <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Serviceable Obtainable Market</p>
                        <h4 className="text-xl font-bold text-white">$450M</h4>
                        <p className="text-xs text-zinc-500 mt-1">Focusing on Tier-1 Enterprise Verticals</p>
                      </div>
                    </div>
                  </div>
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
