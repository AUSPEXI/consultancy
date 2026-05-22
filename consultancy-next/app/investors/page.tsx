'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, BarChart3, Globe, ShieldCheck, Zap, ArrowRight,
  FileText, Lock, CheckCircle2, Layout, Database, Eye, PieChart,
  Users, Wallet, Rocket, Cpu, Flame, Sprout, Building2, Code2,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Cell
} from 'recharts';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { PitchDeckViewer } from '@/components/ui/PitchDeckViewer';
import { UmapVisualization } from '@/components/ui/UmapVisualization';
import { cn } from '@/lib/utils';

const NEON = 'shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]';

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
    description: "Utilizing Gemini's text-embedding-004 for the perfect balance of semantic fidelity and 40% lower computational overhead.",
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

function MarginExpansionChart() {
  return (
    <div className={`p-8 bg-zinc-900 rounded-3xl ${NEON}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Margin Expansion Trajectory</h3>
          <p className="text-xs text-emerald-500 uppercase tracking-widest">Recapturing the "Inference Tax"</p>
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
          <AreaChart data={MARGIN_EXPANSION_DATA}>
            <defs>
              <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="quarter" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
            <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a' }} labelStyle={{ fontWeight: 'bold', color: 'white', marginBottom: '4px' }} />
            <Area type="monotone" dataKey="margin" stroke="#ec4899" strokeWidth={3} fill="url(#marginGrad)" name="Gross Margin" />
            <Area type="monotone" dataKey="cost" stroke="#52525b" strokeWidth={2} fill="transparent" name="Inference Cost" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 bg-zinc-950/50 rounded-xl ${NEON}`}>
          <p className="text-[10px] font-bold text-zinc-500 mb-1">Q2 2026 Strategy</p>
          <p className="text-sm font-bold text-white">Third-Party APIs</p>
          <p className="text-[10px] text-zinc-500">High operational overhead</p>
        </div>
        <div className={`p-4 bg-zinc-950/50 rounded-xl ${NEON}`}>
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
    <div className={`p-8 bg-zinc-950 rounded-3xl ${NEON}`}>
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
          <div key={i} className={`p-6 bg-zinc-900 rounded-2xl ${NEON}`}>
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
  const [growthRate, setGrowthRate] = useState(15);

  const calculateReturn = () => {
    const months = 36;
    const avgArpu = 350;
    const fundingMillions = funding / 1_000_000;

    // Larger rounds unlock faster GTM execution and hiring — modelled as a
    // growth rate boost of +2.5% per $1M above the $1M baseline.
    const capitalGrowthBoost = (fundingMillions - 1) * 2.5;
    const effectiveGrowth = growthRate + capitalGrowthBoost;

    let users = 100;
    for (let i = 0; i < months; i++) {
      users = users * (1 + effectiveGrowth / 100);
    }
    const year3ARR = users * avgArpu * 12;
    const exitValuation = year3ARR * 12.5;
    const investorReturn = exitValuation * 0.20;
    const multiple = investorReturn / funding;
    return { arr: year3ARR, valuation: exitValuation, roi: multiple.toFixed(1) };
  };

  const results = calculateReturn();

  return (
    <div className={`p-8 bg-zinc-900 rounded-3xl ${NEON}`}>
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
              type="range" min="1000000" max="5000000" step="250000"
              value={funding} onChange={(e) => setFunding(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-zinc-300">Monthly Growth Rate</label>
              <span className="text-sm font-bold text-white">{growthRate}%</span>
            </div>
            <input
              type="range" min="5" max="25" step="1"
              value={growthRate} onChange={(e) => setGrowthRate(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={`p-6 bg-zinc-950 rounded-2xl flex flex-col justify-center text-center ${NEON}`}>
            <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Year 3 ARR</p>
            <p className="text-2xl font-bold text-white">${(results.arr / 1000000).toFixed(1)}M</p>
          </div>
          <div className={`p-6 bg-zinc-950 rounded-2xl flex flex-col justify-center text-center ${NEON}`}>
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

const PRESEED_FUNDS = [
  { name: 'Founder Runway', value: 40, color: '#ec4899', description: 'Minimal founder salaries to go full-time, no distractions' },
  { name: 'Product & Infra', value: 30, color: '#f472b6', description: 'Cloud hosting, AI API costs, dev tooling, pgvector cluster' },
  { name: 'First Customers', value: 20, color: '#a78bfa', description: 'High-touch outreach, demos, content to land first 20-50 subscribers' },
  { name: 'Legal & Ops', value: 10, color: '#3f3f46', description: 'Company structure, founder agreements, accounting' },
];

const SEED_FUNDS = [
  { name: 'Team Building', value: 45, color: '#ec4899', description: '2-3 strategic hires: data scientist, growth marketer, content lead' },
  { name: 'Data & Infra', value: 25, color: '#f472b6', description: 'Scale pgvector to 50M+ embeddings, real-time monitoring, SLM R&D begins' },
  { name: 'Market Authority', value: 20, color: '#a78bfa', description: 'GEO research publications, conference presence, thought leadership' },
  { name: 'Enterprise Outreach', value: 10, color: '#3f3f46', description: 'Enterprise CRM, sales tools, pilot programs with agency partners' },
];

const WHAT_EXISTS_NOW = [
  "Full GEO audit & citation scoring engine deployed",
  "768-D latent space mapping with pgvector backend live",
  "Multi-agent content optimizer & Fact-Vault architecture built",
  "Competitor decay detection & SOV simulator operational",
  "4-phase GEO workflow defined and battle-tested",
  "Brand sentiment Z-score drift detection running",
  "Dashboard, blog, investor hub and public site complete",
  "GEO strategy proven — need capital to prove the market",
];

function PreSeedCalculator() {
  const [raise, setRaise] = useState(200000);

  const MONTHLY_BURN = 9500;
  const CAC = 650;
  const AVG_MRR = 149;

  const marketingBudget = raise * 0.20;
  const customers = Math.floor(marketingBudget / CAC);
  const runwayMonths = Math.floor(raise / MONTHLY_BURN);
  const projectedARR = customers * AVG_MRR * 12;

  return (
    <div className={`p-8 bg-zinc-900 rounded-3xl ${NEON}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Pre-seed Model</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">What your capital unlocks</p>
        </div>
        <Flame className="w-6 h-6 text-pink-500" />
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-zinc-300">Round Size</label>
          <span className="text-sm font-bold text-white">${(raise / 1000).toFixed(0)}k</span>
        </div>
        <input
          type="range" min="50000" max="500000" step="25000"
          value={raise} onChange={(e) => setRaise(Number(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
          <span>$50k</span><span>$500k</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className={`p-5 bg-zinc-950 rounded-2xl ${NEON}`}>
          <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Runway</p>
          <p className="text-2xl font-bold text-white">{runwayMonths} mo</p>
          <p className="text-[10px] text-zinc-600">At $9.5k/mo burn</p>
        </div>
        <div className={`p-5 bg-zinc-950 rounded-2xl ${NEON}`}>
          <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">First Subscribers</p>
          <p className="text-2xl font-bold text-white">{customers}</p>
          <p className="text-[10px] text-zinc-600">At $650 high-touch CAC</p>
        </div>
        <div className="p-5 col-span-2 bg-pink-500/10 border border-pink-500/30 rounded-2xl">
          <p className="text-[10px] font-bold text-pink-400 tracking-widest uppercase mb-1">Projected ARR at Runway End</p>
          <p className="text-3xl font-bold text-pink-500">${(projectedARR / 1000).toFixed(0)}k</p>
          <p className="text-[10px] text-pink-500/70 mt-1">{customers} subscribers × $149/mo avg × 12</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Use of Funds</h4>
        {PRESEED_FUNDS.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
            <div className="flex-grow">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-bold text-white">{f.name}</span>
                <span className="text-xs text-zinc-500">{f.value}% · ${Math.round(raise * f.value / 100 / 1000)}k</span>
              </div>
              <p className="text-[10px] text-zinc-600 leading-relaxed">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeedCalculator() {
  const [raise, setRaise] = useState(1000000);

  const BASE_BURN = 9500;
  const HIRE_COST = 4500;
  const HIRES = raise < 750000 ? 1 : raise < 1250000 ? 2 : 3;
  const MONTHLY_BURN = BASE_BURN + HIRES * HIRE_COST + 3000;
  const CAC = 380;
  const AVG_MRR = 199;

  const marketingBudget = raise * 0.20;
  const organicMultiplier = 1.8;
  const customers = Math.floor((marketingBudget / CAC) * organicMultiplier);
  const runwayMonths = Math.floor(raise / MONTHLY_BURN);
  const projectedARR = customers * AVG_MRR * 12;

  return (
    <div className={`p-8 bg-zinc-900 rounded-3xl ${NEON}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Seed Model</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Dominance through data and authority</p>
        </div>
        <Sprout className="w-6 h-6 text-emerald-500" />
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-zinc-300">Round Size</label>
          <span className="text-sm font-bold text-white">${(raise / 1000000).toFixed(2)}M</span>
        </div>
        <input
          type="range" min="500000" max="2000000" step="100000"
          value={raise} onChange={(e) => setRaise(Number(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
          <span>$500k</span><span>$2M</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className={`p-5 bg-zinc-950 rounded-2xl ${NEON}`}>
          <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Team Hires</p>
          <p className="text-2xl font-bold text-white">{HIRES}</p>
          <p className="text-[10px] text-zinc-600">Strategic roles</p>
        </div>
        <div className={`p-5 bg-zinc-950 rounded-2xl ${NEON}`}>
          <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Runway</p>
          <p className="text-2xl font-bold text-white">{runwayMonths} mo</p>
          <p className="text-[10px] text-zinc-600">${(MONTHLY_BURN / 1000).toFixed(1)}k/mo burn</p>
        </div>
        <div className={`p-5 bg-zinc-950 rounded-2xl ${NEON}`}>
          <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Subscribers</p>
          <p className="text-2xl font-bold text-white">{customers}</p>
          <p className="text-[10px] text-zinc-600">Paid + organic</p>
        </div>
      </div>

      <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-8">
        <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mb-1">Projected ARR entering Series A</p>
        <p className="text-3xl font-bold text-emerald-400">${(projectedARR / 1000).toFixed(0)}k</p>
        <p className="text-[10px] text-emerald-500/70 mt-1">{customers} subscribers × $199/mo avg × 12 — Series A ready</p>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Use of Funds</h4>
        {SEED_FUNDS.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
            <div className="flex-grow">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-bold text-white">{f.name}</span>
                <span className="text-xs text-zinc-500">{f.value}% · ${Math.round(raise * f.value / 100 / 1000)}k</span>
              </div>
              <p className="text-[10px] text-zinc-600 leading-relaxed">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InvestorHubPage() {
  const { user } = useAuth();
  const [showDataRoom, setShowDataRoom] = useState(false);

  const isSuperUser = user?.email === 'hopiumcalculator@gmail.com';

  useEffect(() => {
    if (isSuperUser && !showDataRoom) {
      setShowDataRoom(true);
    }
  }, [isSuperUser, showDataRoom]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pt-24 pb-16 [overflow-x:clip]">
      <PublicHeader />

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-900/20 via-zinc-950 to-zinc-950 -z-10" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 text-pink-400 text-sm font-medium border border-pink-500/20 mb-4"
          >
            <Flame className="w-4 h-4" />
            Pre-seed Round Now Open
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-bold tracking-tight mb-8 font-heading px-4"
          >
            The Technology is Built.<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-pink-300">Now We Need the Fuel.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-6 leading-relaxed"
          >
            Auspexi has built the deterministic infrastructure for Generative Engine Optimization from scratch — no external capital, no compromises. We are at pre-seed: the platform is live, the workflow is proven, and the first paying subscribers are one funding round away.
          </motion.p>

          {/* Stage progress strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="flex items-center justify-center gap-2 mb-10 text-xs font-bold uppercase tracking-widest"
          >
            <span className="px-3 py-1.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/40">Pre-seed ← Now</span>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-500">Seed</span>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-500">Series A</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="mailto:sales@auspexi.com?subject=Pre-seed Investment Enquiry"
              className={`px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center ${NEON}`}
            >
              <Flame className="w-4 h-4" /> Enquire About Pre-seed
            </a>
            <button
              onClick={() => setShowDataRoom(true)}
              className={`px-8 py-4 bg-zinc-900 text-white font-semibold rounded-full hover:bg-zinc-800 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center ${NEON}`}
            >
              <Eye className="w-4 h-4" /> View Data Room
            </button>
          </motion.div>
        </div>
      </section>

      {/* What Exists Now */}
      <section className="py-16 px-6 border-y border-zinc-900 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-3">Built Without External Capital</p>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-white">What Already Exists</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {WHAT_EXISTS_NOW.map((item, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 ${NEON}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three-stage funding journey */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">The Funding Journey</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Three rounds, three clear missions. Each stage is the proof the next stage demands.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pre-seed card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`p-8 rounded-2xl bg-zinc-900 relative overflow-hidden ${NEON}`}>
              <div className="absolute top-4 right-4 px-2 py-0.5 bg-pink-500/20 text-pink-400 text-[10px] font-bold rounded-full border border-pink-500/30 uppercase tracking-widest">Now Open</div>
              <Flame className="w-10 h-10 text-pink-500 mb-6" />
              <h3 className="text-xl font-bold text-white mb-1">Pre-seed</h3>
              <p className="text-pink-400 text-sm font-mono mb-4">$50k – $500k</p>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">Light the engine. Fund founder runway and the first high-touch customer acquisitions. Prove the market will pay for GEO infrastructure.</p>
              <div className="space-y-2 text-xs text-zinc-500">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-pink-500" />First 20–50 paying subscribers</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-pink-500" />Unit economics proven (CAC / LTV)</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-pink-500" />First testimonials and case studies</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-pink-500" />Pricing and tier validation</div>
              </div>
            </motion.div>

            {/* Seed card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className={`p-8 rounded-2xl bg-zinc-900 relative overflow-hidden ${NEON}`}>
              <div className="absolute top-4 right-4 px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] font-bold rounded-full border border-zinc-700 uppercase tracking-widest">~12 Months</div>
              <Sprout className="w-10 h-10 text-emerald-500 mb-6" />
              <h3 className="text-xl font-bold text-white mb-1">Seed</h3>
              <p className="text-emerald-400 text-sm font-mono mb-4">$500k – $2M</p>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">Dominate the space. Build the data team, publish GEO research, become the undisputed expert authority before the incumbents notice the category exists.</p>
              <div className="space-y-2 text-xs text-zinc-500">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" />200–500 paying subscribers</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" />Data scientist + growth marketer hired</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" />GEO research published — own the narrative</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" />Enterprise pilots, agency partnerships</div>
              </div>
            </motion.div>

            {/* Series A card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className={`p-8 rounded-2xl bg-zinc-900 relative overflow-hidden ${NEON}`}>
              <div className="absolute top-4 right-4 px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] font-bold rounded-full border border-zinc-700 uppercase tracking-widest">~24–30 Months</div>
              <Building2 className="w-10 h-10 text-blue-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-1">Series A</h3>
              <p className="text-blue-400 text-sm font-mono mb-4">$3M+</p>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">After customers. Scale GTM, launch the proprietary SLM, expand internationally, and transition from early adopters to enterprise non-discretionary spend.</p>
              <div className="space-y-2 text-xs text-zinc-500">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-400" />500+ subscribers, proven NRR &gt;120%</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-400" />Proprietary SLM replaces third-party APIs</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-400" />Enterprise contracts, agency white-label</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-400" />International expansion</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pre-seed + Seed models */}
      <section className="py-16 px-6 bg-zinc-900/30 border-y border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Capital Models</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Adjust the sliders to see what each round size buys in concrete outcomes — no fabricated hockey sticks, just honest unit economics.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PreSeedCalculator />
            <SeedCalculator />
          </div>
        </div>
      </section>

      {/* Data Room */}
      {showDataRoom && (
        <section className="py-24 px-6 relative overflow-hidden" id="data-room">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full tracking-widest uppercase mb-4">
                  Series A · Confidential
                </div>
                <h2 className="text-3xl md:text-4xl font-bold font-heading text-white">The Series A Data Room</h2>
                <p className="text-zinc-400 mt-4">
                  Where the journey leads. Market positioning, technical architecture, financial models and proprietary datasets for the Series A round — accessed after pre-seed and seed milestones are proven.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Encryption Status</p>
                  <p className="text-xs font-mono text-emerald-500">AES-256_ACTIVE</p>
                </div>
                <div className={`p-3 bg-zinc-900 rounded-xl ${NEON}`}>
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pitch Deck */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-pink-500" />
                  <h3 className="text-lg font-semibold text-white">Investment Pitch Deck</h3>
                </div>
                <PitchDeckViewer />
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 bg-zinc-900/50 rounded-xl ${NEON}`}>
                    <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Last Update</p>
                    <p className="text-sm font-medium text-white">May 2026</p>
                  </div>
                  <div className={`p-4 bg-zinc-900/50 rounded-xl ${NEON}`}>
                    <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Version</p>
                    <p className="text-sm font-medium text-white">v4.1.2_BETA</p>
                  </div>
                </div>
              </div>

              {/* UMAP */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Layout className="w-5 h-5 text-pink-500" />
                  <h3 className="text-lg font-semibold text-white">Latent Space Visualization (UMAP)</h3>
                </div>
                <div className={`aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 relative ${NEON}`}>
                  <UmapVisualization />
                </div>
                <div className={`p-6 bg-zinc-900/30 rounded-2xl ${NEON}`}>
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

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {DATA_ROOM_METRICS.map((metric, i) => (
                <div key={i} className={`p-6 bg-zinc-900 rounded-2xl text-center group hover:bg-zinc-800/80 transition-colors ${NEON}`}>
                  <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">{metric.label}</p>
                  <p className="text-2xl font-bold text-white group-hover:text-pink-400 transition-colors">{metric.value}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">{metric.sub}</p>
                </div>
              ))}
            </div>

            {/* Super user full data room */}
            {isSuperUser ? (
              <div className="mt-12 space-y-12">
                {/* Partner Header */}
                <div className={`p-8 bg-pink-500/5 border border-pink-500/10 rounded-2xl text-center ${NEON}`}>
                  <ShieldCheck className="w-8 h-8 text-pink-400 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-white mb-2">Partner Access Granted</h3>
                  <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                    Welcome, Gwylym. You have full administrative visibility of the Data Room. All financial modeling and proprietary stack details are unlocked.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="/deck.pdf"
                      download="auspexi_seriesA_prospectus_v4.2.pdf"
                      className={`px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2 ${NEON}`}
                    >
                      <FileText className="w-4 h-4" /> Download Full Prospectus
                    </a>
                    <button
                      onClick={() => alert("HNSW Index Performance logs exported.")}
                      className={`px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2 ${NEON}`}
                    >
                      <Layout className="w-4 h-4" /> Export Latent Clusters
                    </button>
                  </div>
                </div>

                {/* Growth Trajectory + sidebar cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className={`lg:col-span-2 p-8 bg-zinc-900 rounded-3xl ${NEON}`}>
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
                              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="year" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} itemStyle={{ color: '#ec4899' }} />
                          <Area type="monotone" dataKey="arr" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorArr)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`p-6 bg-zinc-900 rounded-2xl ${NEON}`}>
                      <Users className="w-5 h-5 text-pink-500 mb-4" />
                      <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Customer Expansion</p>
                      <h4 className="text-2xl font-bold text-white">520+ Nodes</h4>
                      <p className="text-xs text-zinc-500 mt-1">Projected by Year 3 End</p>
                    </div>
                    <div className={`p-6 bg-zinc-900 rounded-2xl ${NEON}`}>
                      <Wallet className="w-5 h-5 text-emerald-500 mb-4" />
                      <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Target Raise</p>
                      <h4 className="text-2xl font-bold text-white">$3,000,000</h4>
                      <p className="text-xs text-zinc-500 mt-1">Series A Equity Round</p>
                    </div>
                    <div className={`p-6 bg-zinc-900 rounded-2xl ${NEON}`}>
                      <Rocket className="w-5 h-5 text-pink-500 mb-4" />
                      <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Exit Multiple</p>
                      <h4 className="text-2xl font-bold text-white">10x - 15x</h4>
                      <p className="text-xs text-zinc-500 mt-1">SaaS Infrastructure Premium</p>
                    </div>
                  </div>
                </div>

                {/* Unit Economics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {UNIT_ECONOMICS.map((item, i) => (
                    <div key={i} className={`p-6 bg-zinc-900/50 rounded-2xl ${NEON}`}>
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

                {/* Trojan Horse Growth Loop */}
                <div className={`p-8 bg-zinc-900 rounded-3xl relative overflow-hidden ${NEON}`}>
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
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
                        <div className={`p-5 bg-zinc-950 rounded-xl ${NEON}`}>
                          <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] flex items-center justify-center">1</span>
                            Value-In-Advance Audit
                          </h4>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            Prospects enter URL + Email on Landing Page. Exa AI generates a real-time GEO report, showing their semantic distance from target clusters.
                          </p>
                        </div>
                        <div className={`p-5 bg-zinc-950 rounded-xl ${NEON}`}>
                          <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] flex items-center justify-center">2</span>
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
                              <div className="h-px bg-zinc-800 flex-grow group-hover:bg-pink-500/30 transition-colors" />
                              <div className={`p-3 bg-zinc-950 rounded-lg text-[11px] min-w-[180px] ${NEON}`}>
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

                {/* Returns Calculator */}
                <InvestorCalculator />

                {/* Margin Expansion */}
                <MarginExpansionChart />

                {/* Phase III SLM */}
                <div className={`p-8 bg-zinc-900 rounded-3xl relative overflow-hidden ${NEON}`}>
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
                        <p className="text-sm text-zinc-400 leading-relaxed">Nvidia Blackwell B200 rollout has dropped fine-tuning costs by 90%. We can now re-train our GEO-Specialist model weekly for under $15 per run.</p>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-bold text-white">Proprietary Scaling</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">Replacing third-party APIs with our self-hosted 8B model reduces inference overhead by 85%, reclaiming 15% of ARR directly into EBIDTA.</p>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-bold text-white">Data &gt; Model</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">In 2026, compute is a commodity. Our moat is the "Golden Dataset" of 50M interactions we've curated, which foundational models cannot access.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Neural Moat */}
                <div className={`p-8 bg-zinc-950 rounded-3xl relative overflow-hidden ${NEON}`}>
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Database className="w-64 h-64 text-pink-500 rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-8">The Proprietary "Neural Moat"</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      {PROPRIETARY_STACK.map((stack, i) => (
                        <div key={i} className={`p-6 bg-zinc-900/50 rounded-2xl ${NEON}`}>
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

                {/* Revenue & Citation Logic */}
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Revenue & Citation Logic</h3>
                      <p className="text-zinc-400 max-w-2xl">Translating latent space vectors into enterprise value. The map is the diagnostic; the Fact-Vault is the cure.</p>
                    </div>
                    <div className="px-3 py-1 bg-pink-500/10 text-pink-400 text-xs font-bold rounded-full border border-pink-500/20 uppercase tracking-widest">
                      4.4x Conv. Advantage
                    </div>
                  </div>

                  {/* 10x Path Table */}
                  <div className={`bg-zinc-950 rounded-3xl overflow-hidden ${NEON}`}>
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
                            <td className="p-6"><p className="text-sm font-bold text-white">Seed Bridge</p><p className="text-[10px] text-zinc-500">Current - Q3 2026</p></td>
                            <td className="p-6 text-sm text-zinc-400">PLG Loop Optimization</td>
                            <td className="p-6 text-sm text-emerald-400 font-medium">1:3.2 (Burn-to-ARR)</td>
                            <td className="p-6 text-sm text-white">$15M - $25M</td>
                          </tr>
                          <tr className="hover:bg-zinc-900/30 transition-colors">
                            <td className="p-6"><p className="text-sm font-bold text-white">Series A Deployment</p><p className="text-[10px] text-zinc-500">Q4 2026 - Q2 2027</p></td>
                            <td className="p-6 text-sm text-zinc-400">Enterprise High-Touch</td>
                            <td className="p-6 text-sm text-emerald-400 font-medium">1:4.4 (Burn-to-ARR)</td>
                            <td className="p-6 text-sm text-white">$45M - $60M</td>
                          </tr>
                          <tr className="hover:bg-zinc-900/30 transition-colors">
                            <td className="p-6"><p className="text-sm font-bold text-white">Scale-Up / 10x Goal</p><p className="text-[10px] text-zinc-500">Q3 2027+</p></td>
                            <td className="p-6 text-sm text-zinc-400">Proprietary SLM Infrastructure</td>
                            <td className="p-6 text-sm text-emerald-400 font-medium">1:6.1 (Margin Efficiency)</td>
                            <td className="p-6 text-sm text-pink-500 font-bold">$125M+</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Strategic Pillars */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {STRATEGIC_PILLARS.map((pillar, i) => (
                      <div key={i} className={`p-8 bg-zinc-900 rounded-2xl relative group overflow-hidden ${NEON}`}>
                        <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
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

                  {/* Revenue Logic Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {REVENUE_LOGIC_METRICS.map((metric, i) => (
                      <div key={i} className={`p-6 bg-zinc-950 rounded-2xl text-center border-b-4 border-b-pink-500/50 ${NEON}`}>
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
                  <div className={`p-8 bg-zinc-900 rounded-3xl ${NEON}`}>
                    <h3 className="text-xl font-bold text-white mb-6">Use of Funds</h3>
                    <div className="h-[200px] mb-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={USE_OF_FUNDS} margin={{ left: 80 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} />
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

                  <div className={`p-8 bg-zinc-900 rounded-3xl ${NEON}`}>
                    <h3 className="text-xl font-bold text-white mb-6">TAM / SAM / SOM</h3>
                    <div className="space-y-6">
                      <div className={`p-5 bg-zinc-950 rounded-2xl border-l-4 border-l-pink-500 ${NEON}`}>
                        <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Total Addressable Market</p>
                        <h4 className="text-3xl font-bold text-white">$124B</h4>
                        <p className="text-xs text-zinc-500 mt-1">Global AI Search Economy by 2028</p>
                      </div>
                      <div className={`p-5 bg-zinc-950 rounded-2xl border-l-4 border-l-pink-400 ${NEON}`}>
                        <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Serviceable Addressable Market</p>
                        <h4 className="text-2xl font-bold text-white">$17.2B</h4>
                        <p className="text-xs text-zinc-500 mt-1">Enterprise GEO & Brand Visibility Shift</p>
                      </div>
                      <div className={`p-5 bg-zinc-950 rounded-2xl border-l-4 border-l-pink-300 ${NEON}`}>
                        <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">Serviceable Obtainable Market</p>
                        <h4 className="text-xl font-bold text-white">$450M</h4>
                        <p className="text-xs text-zinc-500 mt-1">Focusing on Tier-1 Enterprise Verticals</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Non-super-user lock CTA */
              <div className={`mt-12 flex flex-col items-center justify-center p-8 bg-pink-500/5 border border-pink-500/10 rounded-2xl text-center ${NEON}`}>
                <Lock className="w-8 h-8 text-pink-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Want the full Data Room access?</h3>
                <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                  Request access to our P&L statements, CAP table, and complete technical specifications via our investor relations team.
                </p>
                <a
                  href="mailto:sales@auspexi.com?subject=Full Data Room Request"
                  className={`px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2 ${NEON}`}
                >
                  <FileText className="w-4 h-4" /> Request Full Prospectus
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Investment Highlights */}
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
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: index * 0.1 }}
                className={`p-8 rounded-2xl bg-zinc-950 hover:bg-zinc-900/80 transition-all group ${NEON}`}
              >
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Execution Plan */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Strategic Execution Plan</h2>
            <p className="text-zinc-400 text-lg">How we are accelerating from early market capture to total infrastructural dominance.</p>
          </div>
          <div className="space-y-6">
            {STRATEGIC_INITIATIVES.map((initiative, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: index * 0.1 }}
                className="relative pl-8 md:pl-0"
              >
                <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-zinc-800 translate-x-[39px]" />
                <div className="md:flex gap-8 group">
                  <div className="md:w-32 shrink-0 md:text-right pt-6 relative z-10 mb-4 md:mb-0">
                    <div className="hidden md:block absolute right-0 top-8 w-3 h-3 rounded-full bg-zinc-800 group-hover:bg-pink-500 transition-colors translate-x-[6px]" />
                    <div className="text-sm font-bold text-pink-400 mb-1">{initiative.phase}</div>
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{initiative.status}</div>
                  </div>
                  <div className={`flex-grow p-8 rounded-2xl bg-zinc-900 group-hover:bg-zinc-800/80 transition-colors relative z-10 ${NEON}`}>
                    <h3 className="text-2xl font-bold text-white mb-3">{initiative.title}</h3>
                    <p className="text-zinc-400 leading-relaxed text-lg">{initiative.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 text-center md:text-left md:ml-40">
            <Link href="/roadmap" className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 font-medium transition-colors">
              View the detailed technology roadmap <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footerdemo />
    </div>
  );
}
