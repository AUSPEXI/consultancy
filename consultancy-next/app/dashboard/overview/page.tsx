'use client'

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardOverviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-heading text-3xl font-bold tracking-widest mb-2">Dashboard</h1>
        <p className="text-zinc-400 mb-8">Welcome, {user.displayName || user.email}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'GEO Pulse', desc: 'Track your AI search visibility', href: '/dashboard/geo-pulse' },
            { label: 'Brand Monitor', desc: 'Monitor brand mentions in AI responses', href: '/dashboard/brand-monitor' },
            { label: 'Fact Vault', desc: 'Manage your high-entropy fact library', href: '/dashboard/fact-vault' },
            { label: 'Content Scorer', desc: 'Score content for AI citation potential', href: '/dashboard/content-scorer' },
            { label: 'Competitors', desc: 'Benchmark against competitor SOV', href: '/dashboard/competitors' },
            { label: 'Simulator', desc: 'Simulate AI model responses', href: '/dashboard/simulator' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-pink-500/30 hover:bg-zinc-900 transition-all group"
            >
              <h2 className="text-lg font-bold mb-2 group-hover:text-pink-400 transition-colors">{item.label}</h2>
              <p className="text-sm text-zinc-400">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
