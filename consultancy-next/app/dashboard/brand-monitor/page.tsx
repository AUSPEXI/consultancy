'use client';
import { useState } from 'react';
import { Radar, Loader2, AlertOctagon, MessageSquare, TrendingDown, PenTool } from 'lucide-react';
import { SyntheticDataPanel } from '@/components/dashboard/SyntheticDataPanel';
import { GoogleGenAI, Type } from '@google/genai';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { logAuditAction } from '@/lib/audit';
import { checkTierAccess } from '@/constants/tiers';

export default function BrandMonitorPage() {
  const { tier, role, user } = useAuth();
  const [brand, setBrand] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  if (role !== 'admin' && !checkTierAccess(tier, 'Medium')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Consensus Platform Monitor</h1>
          <p className="text-zinc-400">Defensive GEO: Monitor Reddit, Quora, and forums to prevent AI context poisoning.</p>
        </div>
        <UpgradePrompt
          title="Brand Monitor Locked"
          description="Upgrade to the Medium tier to access the Consensus Platform Monitor and detect negative sentiment before it trains the next LLM."
          requiredTier="Medium"
        />
      </div>
    );
  }

  const handleMonitor = async () => {
    if (!brand.trim()) return;
    setIsMonitoring(true);
    setResults(null);

    try {
      const res = await fetch('/api/brand-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch consensus sentiment.');

      setResults(data.result);
      if (user) {
        await logAuditAction(user.uid, 'Ran Brand Monitor', { brand, riskScore: data.result.riskScore });
      }
    } catch (error) {
      console.error("Error monitoring brand:", error);
      showToast('Failed to run monitor. Please try again.', 'error');
    } finally {
      setIsMonitoring(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'Positive') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (sentiment === 'Negative') return 'text-red-400 bg-red-400/10 border-red-400/20';
    return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : 'bg-zinc-900/90 border-zinc-700 text-zinc-300'}`}>
          <span className="text-sm font-bold tracking-tight">{toast.text}</span>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2 flex items-center gap-3">
          <Radar className="w-8 h-8 text-pink-500" />
          Consensus Platform Monitor
        </h1>
        <p className="text-zinc-400">Scan Reddit and Quora to detect "Context Poisoning" before the next LLM training run.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Enter brand name to monitor..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
            />
          </div>
          <button
            onClick={handleMonitor}
            disabled={isMonitoring || !brand.trim()}
            className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isMonitoring ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Scanning...</>
            ) : (
              <><Radar className="w-5 h-5" /> Scan Platforms</>
            )}
          </button>
        </div>
      </div>

      {/* Synthetic Dataset */}
      <SyntheticDataPanel />

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Overall Sentiment</h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSentimentColor(results.overallSentiment)}`}>
                {results.overallSentiment}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Context Poisoning Risk</h3>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-white">{results.riskScore}</span>
                <span className="text-zinc-500 mb-1">/ 100</span>
              </div>
              {results.riskScore > 50 && (
                <div className="mt-4 flex items-start gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                  <AlertOctagon className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>High risk of negative narratives being absorbed by LLMs.</p>
                </div>
              )}
            </div>
            <div className="bg-pink-950/30 border border-pink-500/30 rounded-xl p-6">
              <h3 className="text-sm font-medium text-pink-300 mb-3">Defensive Action Plan</h3>
              <p className="text-sm text-pink-100/80 leading-relaxed">
                {results.actionPlan}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Consensus Threads</h3>
            {results.threads.map((thread: any, i: number) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <a href={thread.url} target="_blank" rel="noreferrer" className="text-pink-400 hover:text-pink-300 font-medium line-clamp-1">
                    {thread.title}
                  </a>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSentimentColor(thread.sentiment)}`}>
                    {thread.sentiment}
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm text-zinc-400">
                  <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="leading-relaxed">{thread.summary}</p>
                </div>
                {(thread.sentiment === 'Negative' || thread.sentiment === 'Neutral' || thread.sentiment === 'Mixed') && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                         window.dispatchEvent(new CustomEvent('set-agent-topic', { detail: { topic: `Write a counter-narrative or response addressing this consensus topic: ${thread.title}` }}));
                         window.dispatchEvent(new CustomEvent('change-dashboard-tab', { detail: { tab: 'agents' } }));
                      }}
                      className="px-4 py-2 border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <PenTool className="w-3.5 h-3.5" /> Draft Counter-Narrative (Agents)
                    </button>
                  </div>
                )}
              </div>
            ))}
            {results.threads.length === 0 && (
              <div className="text-zinc-500 text-center py-8">No recent threads found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
