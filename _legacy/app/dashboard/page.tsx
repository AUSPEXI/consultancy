'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  BrainCircuit, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Settings, 
  LayoutDashboard, 
  Database, 
  Activity,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="flex h-screen bg-[#050505] text-white">
      <div role="search" className="hidden">Dashboard Search</div>
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-zinc-950/50 flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-pink-500" />
          </div>
          <span className="font-bold text-lg">AUSPEXI</span>
        </div>
        
        <nav className="flex-grow p-4 space-y-1">
          {[
            { id: 'overview', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview' },
            { id: 'map', icon: <Globe className="w-4 h-4" />, label: 'Latent Map' },
            { id: 'vault', icon: <Database className="w-4 h-4" />, label: 'Fact Vault' },
            { id: 'monitor', icon: <Activity className="w-4 h-4" />, label: 'Brand Monitor' },
            { id: 'technical', icon: <Settings className="w-4 h-4" />, label: 'Advanced' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' 
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link href="/" className="w-full h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors">
            Exit Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-zinc-950/20 sticky top-0 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
              Project: <span className="text-white">Auspexi Mainnet</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="h-9 px-4 rounded-full bg-pink-500 text-white text-xs font-bold hover:bg-pink-600 transition-colors flex items-center gap-2">
              <Plus className="w-3 h-3" /> New GEO Audit
            </button>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Latency Proximity', value: '0.042', delta: '-12%', icon: <Zap /> },
              { label: 'Semantic Authority', value: '88.4', delta: '+4.2%', icon: <ShieldCheck /> },
              { label: 'Fact Density', value: '768', delta: 'Stable', icon: <Database /> },
              { label: 'Brand Clarity', value: 'High', delta: '+8%', icon: <CheckCircle2 /> }
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-zinc-950 border border-white/5 text-zinc-400">
                    {stat.icon}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    stat.delta.startsWith('+') ? 'bg-green-500/10 text-green-400' : 
                    stat.delta === 'Stable' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {stat.delta}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 rounded-3xl bg-zinc-900/20 border border-white/5 p-8 aspect-[21/9] flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-violet-500/5 transition-opacity opacity-0 group-hover:opacity-100" />
              <div className="text-center">
                <Globe className="w-16 h-16 text-zinc-800 mb-6 mx-auto" />
                <h3 className="text-xl font-bold mb-2">Neural Projection Matrix</h3>
                <p className="text-zinc-500 max-w-xs mx-auto text-sm">Initializing 3D UMAP manifold for current brand state audit...</p>
              </div>
            </div>

            <div className="rounded-3xl bg-zinc-900/20 border border-white/5 p-8">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-pink-500" /> Recent Drifts
              </h3>
              <div className="space-y-6">
                {[
                  { label: "Competitor Overlap", time: "2h ago", status: "Critical" },
                  { label: "Semantic Divergence", time: "5h ago", status: "Warning" },
                  { label: "Model Re-indexing", time: "12h ago", status: "Info" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-[10px] text-zinc-500 font-mono uppercase">{item.time}</div>
                    </div>
                    <div className={`text-[10px] uppercase tracking-widest font-bold ${
                      item.status === 'Critical' ? 'text-pink-500' :
                      item.status === 'Warning' ? 'text-yellow-500' : 'text-blue-500'
                    }`}>
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
