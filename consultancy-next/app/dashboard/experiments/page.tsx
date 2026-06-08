'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth-fetch';
import { checkTierAccess } from '@/constants/tiers';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import {
  EXPERIMENT_LEVERS, EXPERIMENT_ENGINES, ENGINE_LABELS, type PlatformKey,
} from '@/lib/geo-experiment-levers';
import { FlaskConical, Loader2, Trophy, Minus, Copy, Check, AlertTriangle, SendHorizonal } from 'lucide-react';

interface VariantTally { cited: number; trials: number; rate: number }
interface EngineResult { engine: PlatformKey; a: VariantTally; b: VariantTally; skipped: boolean }
interface Pooled {
  a: VariantTally; b: VariantTally; diffPp: number; z: number; pValue: number;
  significant: boolean; ci95: [number, number]; winner: 'A' | 'B' | 'tie'; underpowered: boolean;
}
interface ApiResult {
  result: { engines: EngineResult[]; pooled: Pooled; totalCalls: number };
  variantB: string; queries: string[]; lever: { label: string }; cost: number;
}

function Bar({ rate, color }: { rate: number; color: string }) {
  return (
    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.round(rate * 100)}%` }} />
    </div>
  );
}

export default function ExperimentsPage() {
  const { tier, role } = useAuth();
  const router = useRouter();
  const hasAccess = role === 'admin' || checkTierAccess(tier, 'Pro');

  const sendToPipeline = (winner: string) => {
    // The Content Scorer (publish gateway) hydrates from this key on mount.
    localStorage.setItem('contentScorer_content', winner);
    localStorage.removeItem('contentScorer_result');
    router.push('/dashboard/content-scorer');
  };

  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [leverId, setLeverId] = useState(EXPERIMENT_LEVERS[0].id);
  const [engines, setEngines] = useState<PlatformKey[]>(EXPERIMENT_ENGINES.filter(e => e !== 'perplexity'));
  const [trialsPerQuery, setTrialsPerQuery] = useState(2);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ApiResult | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleEngine = (e: PlatformKey) =>
    setEngines(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  const run = async () => {
    setError(''); setData(null);
    if (content.trim().length < 120) { setError('Paste a draft of at least ~120 characters.'); return; }
    if (!topic.trim()) { setError('Enter the topic your draft targets.'); return; }
    if (engines.length === 0) { setError('Select at least one engine.'); return; }
    setRunning(true);
    try {
      const res = await authFetch('/api/geo-experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, topic, leverId, engines, trialsPerQuery }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Experiment failed');
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Citability Lab</h1>
          <p className="text-zinc-400">Test which version of your content AI engines prefer to cite.</p>
        </div>
        <UpgradePrompt title="Citability Lab Locked" description="Upgrade to Pro to run head-to-head citability experiments on your own content." requiredTier="Pro" />
      </div>
    );
  }

  const pooled = data?.result.pooled;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2 flex items-center gap-3">
          <FlaskConical className="w-7 h-7 text-pink-400" />
          Citability Lab
        </h1>
        <p className="text-zinc-400 max-w-2xl">
          Test your draft two ways. We apply one change, then ask the AI engines — in a randomised head-to-head — which version they&apos;d rather cite. This measures <span className="text-zinc-300">retrieval-time citability</span>, not live citations.
        </p>
      </div>

      {/* Inputs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Your draft</label>
          <textarea
            value={content} onChange={e => setContent(e.target.value)}
            placeholder="Paste the article or section you want to test…"
            rows={8}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40 font-mono"
          />
          <p className="text-[11px] text-zinc-600 mt-1">{content.trim().length} characters</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Topic it targets</label>
            <input
              value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. best CRM for small sales teams"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40"
            />
            <p className="text-[11px] text-zinc-600 mt-1">We generate the test questions from this.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Change to test (the one variable)</label>
            <select
              value={leverId} onChange={e => setLeverId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40"
            >
              {EXPERIMENT_LEVERS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <p className="text-[11px] text-zinc-600 mt-1">{EXPERIMENT_LEVERS.find(l => l.id === leverId)?.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Engines</label>
            <div className="flex flex-wrap gap-2">
              {EXPERIMENT_ENGINES.map(e => {
                const on = engines.includes(e);
                return (
                  <button key={e} onClick={() => toggleEngine(e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${on ? 'bg-pink-600 border-pink-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                    {ENGINE_LABELS[e]}{e === 'perplexity' ? ' ($)' : ''}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-600 mt-1">Perplexity costs more per call — off by default.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Trials per question: {trialsPerQuery}</label>
            <input type="range" min={1} max={3} value={trialsPerQuery}
              onChange={e => setTrialsPerQuery(Number(e.target.value))} className="w-40 accent-pink-500" />
          </div>
          <button
            onClick={run} disabled={running}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {running ? <><Loader2 className="w-4 h-4 animate-spin" /> Running…</> : <><FlaskConical className="w-4 h-4" /> Run experiment</>}
          </button>
        </div>

        {error && <p className="text-sm text-rose-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</p>}
      </div>

      {/* Results */}
      {pooled && data && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Winner banner */}
          <div className={`rounded-xl border p-5 ${
            pooled.winner === 'tie'
              ? 'bg-zinc-900 border-zinc-800'
              : 'bg-emerald-500/5 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-3">
              {pooled.winner === 'tie' ? <Minus className="w-6 h-6 text-zinc-400" /> : <Trophy className="w-6 h-6 text-emerald-400" />}
              <div>
                <p className="text-lg font-bold text-white">
                  {pooled.winner === 'tie'
                    ? 'No significant difference'
                    : pooled.winner === 'B'
                      ? `The change wins: "${data.lever.label}"`
                      : 'Your original wins — the change did not help'}
                </p>
                <p className="text-sm text-zinc-400">
                  {pooled.winner === 'B' ? '+' : ''}{pooled.diffPp}pp difference · p={pooled.pValue} · 95% CI [{pooled.ci95[0]}, {pooled.ci95[1]}]pp
                  {pooled.significant ? ' · statistically significant' : ' · not significant'}
                </p>
              </div>
            </div>
            {pooled.underpowered && (
              <p className="text-xs text-amber-400/80 mt-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Preliminary — fewer than 30 trials per variant. Add engines or trials for a firmer result.
              </p>
            )}
          </div>

          {/* Pooled rates */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Variant A — your original</p>
              <p className="text-2xl font-bold text-white mb-2">{Math.round(pooled.a.rate * 100)}%</p>
              <Bar rate={pooled.a.rate} color="bg-zinc-500" />
              <p className="text-[11px] text-zinc-600 mt-1.5">{pooled.a.cited} / {pooled.a.trials} trials cited it</p>
            </div>
            <div className="bg-zinc-900 border border-pink-500/20 rounded-xl p-4">
              <p className="text-xs text-pink-400 uppercase tracking-wide mb-2">Variant B — {data.lever.label}</p>
              <p className="text-2xl font-bold text-white mb-2">{Math.round(pooled.b.rate * 100)}%</p>
              <Bar rate={pooled.b.rate} color="bg-pink-500" />
              <p className="text-[11px] text-zinc-600 mt-1.5">{pooled.b.cited} / {pooled.b.trials} trials cited it</p>
            </div>
          </div>

          {/* Per-engine breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-3">Per-engine breakdown</p>
            <div className="space-y-2.5">
              {data.result.engines.map(er => (
                <div key={er.engine} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-zinc-300">{ENGINE_LABELS[er.engine]}</span>
                  {er.skipped ? (
                    <span className="text-xs text-zinc-600">unavailable (no API key)</span>
                  ) : (
                    <>
                      <span className="w-14 text-right text-zinc-400">{Math.round(er.a.rate * 100)}%</span>
                      <div className="flex-1"><Bar rate={er.a.rate} color="bg-zinc-500" /></div>
                      <span className="w-14 text-right text-pink-400">{Math.round(er.b.rate * 100)}%</span>
                      <div className="flex-1"><Bar rate={er.b.rate} color="bg-pink-500" /></div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-600 mt-3">
              Grey = original · pink = changed version. {data.queries.length} question{data.queries.length !== 1 ? 's' : ''} · {data.result.totalCalls} engine calls · est. cost ${data.cost}
            </p>
          </div>

          {/* Winning variant to copy */}
          {pooled.winner === 'B' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2 gap-3">
                <p className="text-sm font-semibold text-white">Winning version</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { navigator.clipboard.writeText(data.variantB); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                  <button
                    onClick={() => sendToPipeline(data.variantB)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <SendHorizonal className="w-3.5 h-3.5" /> Send to Content Pipeline
                  </button>
                </div>
              </div>
              <pre className="text-xs text-zinc-300 whitespace-pre-wrap max-h-72 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-lg p-3">{data.variantB}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
