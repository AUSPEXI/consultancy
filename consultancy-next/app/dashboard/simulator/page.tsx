'use client'

import { useState } from 'react';
import { MonitorPlay, Loader2, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { checkTierAccess } from '@/constants/tiers';
import { logAuditAction } from '@/lib/audit';
import { logSimulatorResult } from '@/lib/metrics';
import { authFetch } from '@/lib/auth-fetch';

export default function SimulatorPage() {
  const { tier, role, user } = useAuth();
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const isReadOnly = role !== 'admin' && !checkTierAccess(tier, 'Pro');

  const handleSimulate = async () => {
    if (isReadOnly) return;
    if (!query.trim() || !brand.trim()) return;
    setIsSimulating(true);
    setResults(null);
    try {
      const res = await authFetch('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({ query, brand })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const parsedResult = data.result;
      setResults(parsedResult);
      if (user) {
        await logAuditAction(user.uid, 'Ran SOV Simulation', { query, brand, sovScore: parsedResult.sovScore });
        await logSimulatorResult(user.uid, parsedResult.sovScore);
      }
    } catch (error) {
      console.error('Error simulating:', error);
      showToast('Failed to run simulation. Please try again.', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const EngineCard = ({ name, data }: { name: string; data: any }) => {
    if (!data || data.skipped) {
      return (
        <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-zinc-700/30 text-zinc-500 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-bl-lg">Not Configured</div>
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-zinc-600" />
            <h3 className="font-semibold text-zinc-500">{name}</h3>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed italic">No API key set for this engine. Excluded from the SOV score.</p>
        </div>
      );
    }
    if (data.error) {
      return (
        <div className="bg-zinc-900 border border-amber-800/40 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-bl-lg">Error</div>
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-white">{name}</h3>
          </div>
          <p className="text-sm text-amber-400/70 leading-relaxed">This engine failed to respond. It is excluded from the SOV score.</p>
        </div>
      );
    }
    return (
      <div className={`bg-zinc-900 border ${data.mentionedBrand ? 'border-emerald-500/50' : 'border-zinc-800'} rounded-xl p-5 relative overflow-hidden`}>
        {data.mentionedBrand && (
          <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-bl-lg">Brand Cited</div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <Bot className={`w-5 h-5 ${data.mentionedBrand ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <h3 className="font-semibold text-white">{name}</h3>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{data.response}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {isReadOnly && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-200">
            You&apos;re viewing <strong>read-only mode</strong>. Upgrade to <strong>Pro</strong> to use this feature.
          </p>
          <a href="/#pricing" className="text-[11px] font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors shrink-0">
            Upgrade
          </a>
        </div>
      )}
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : 'bg-zinc-900/90 border-zinc-700 text-zinc-300'}`}>
          <span className="text-sm font-bold tracking-tight">{toast.text}</span>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2 flex items-center gap-3">
          <MonitorPlay className="w-8 h-8 text-pink-500" />
          Multi-Engine SOV Simulator
        </h1>
        <p className="text-zinc-400">Fire a high-intent query at every live AI engine and see which ones actually cite your brand.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Target Brand</label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g., L8EntSpace" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">User Query</label>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g., Best GEO marketing platform" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-pink-500" />
          </div>
        </div>
        <button onClick={handleSimulate} disabled={isReadOnly || isSimulating || !query.trim() || !brand.trim()} title={isReadOnly ? 'Upgrade to Pro to use this feature' : undefined} className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {isSimulating ? <><Loader2 className="w-5 h-5 animate-spin" /> Querying Live Engines...</> : <><Sparkles className="w-5 h-5" /> Query Live Engines</>}
        </button>
      </div>

      {results && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Live AI Share of Voice (SOV)</h3>
              <p className="text-sm text-zinc-400">
                {results.mentionCount} of {results.activeEngines} live engine{results.activeEngines === 1 ? '' : 's'} cited your brand for this query.
              </p>
            </div>
            <div className="text-4xl font-bold text-pink-400">{results.sovScore}%</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EngineCard name="ChatGPT" data={results.chatgpt} />
            <EngineCard name="Claude (Anthropic)" data={results.claude} />
            <EngineCard name="Google AI" data={results.gemini} />
            <EngineCard name="Perplexity" data={results.perplexity} />
          </div>
        </div>
      )}
    </div>
  );
}
