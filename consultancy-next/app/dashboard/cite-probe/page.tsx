'use client';

import { useState } from 'react';
import { Zap, Loader2, CheckCircle2, XCircle, TrendingUp, Target, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { checkTierAccess } from '@/constants/tiers';

interface PlatformResult {
  cited: boolean;
  excerpt: string | null;
  error?: string;
  skipped?: boolean;
}

interface ProbeResult {
  query: string;
  cited: boolean;
  excerpt: string | null;
  platforms?: {
    gemini?: PlatformResult;
    chatgpt?: PlatformResult;
    perplexity?: PlatformResult;
    claude?: PlatformResult;
  };
}

interface ProbeRun {
  brand: string;
  domain: string;
  citationRate: number;
  citedCount: number;
  totalQueries: number;
  activePlatforms?: number;
  platformRates?: {
    gemini: number | null;
    chatgpt: number | null;
    perplexity: number | null;
    claude: number | null;
  };
  results: ProbeResult[];
  timestamp: string;
}

const PLATFORM_META = {
  gemini:     { label: 'Google Gemini', color: '#4285f4', bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400'   },
  chatgpt:    { label: 'ChatGPT',       color: '#10a37f', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  perplexity: { label: 'Perplexity',    color: '#22d3ee', bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    text: 'text-cyan-400'    },
  claude:     { label: 'Claude',        color: '#d97757', bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  text: 'text-orange-400'  },
} as const;

type PlatformKey = keyof typeof PLATFORM_META;

export default function CiteProbePage() {
  const { tier, role, userData, user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [probeData, setProbeData] = useState<ProbeRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ date: string; rate: number }[]>([]);

  const brand = userData?.brand || '';
  const domain = userData?.domain || '';

  if (role !== 'admin' && !checkTierAccess(tier, 'Pro')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">AI Citation Probe</h1>
          <p className="text-zinc-400">Test whether AI engines cite your brand in real responses right now.</p>
        </div>
        <UpgradePrompt
          title="Citation Probe Locked"
          description="Upgrade to Pro or above to run live citation tests across AI engines and track your brand's citation rate over time."
          requiredTier="Pro"
        />
      </div>
    );
  }

  if (!brand || !domain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Citation Probe</h1>
          <p className="text-sm text-zinc-400 mt-1">Test whether AI engines cite your brand in real responses.</p>
        </div>
        <div className="bg-zinc-900/50 border border-amber-500/30 rounded-xl p-8 text-center">
          <Target className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Brand not configured</h3>
          <p className="text-zinc-400 text-sm mb-4">
            Go to <a href="/dashboard/settings" className="text-pink-400 underline">Settings</a> and set your Brand name and Domain before running a probe.
          </p>
        </div>
      </div>
    );
  }

  const runProbe = async () => {
    setIsRunning(true);
    setError(null);
    setProbeData(null);
    try {
      const res = await fetch('/api/cite-probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, domain, userId: user?.uid || 'anonymous' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Probe failed');
      setProbeData(json);
      setHistory(prev => [{ date: new Date().toLocaleTimeString(), rate: json.citationRate }, ...prev].slice(0, 10));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsRunning(false);
    }
  };

  const rateColor = (rate: number) =>
    rate >= 50 ? 'text-emerald-400' : rate >= 20 ? 'text-amber-400' : 'text-rose-400';

  const rateLabel = (rate: number) =>
    rate >= 50 ? 'Strong' : rate >= 20 ? 'Growing' : 'Not cited yet';

  const activePlatforms = probeData?.activePlatforms ?? 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Pipeline workflow guide */}
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono overflow-x-auto pb-1">
        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 whitespace-nowrap">1 · Fact Vault</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 whitespace-nowrap">2 · Agent Orchestration</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 whitespace-nowrap">3 · Content Scorer</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 whitespace-nowrap">4 · Cite Probe</span>
        <span className="ml-2 text-zinc-600 hidden sm:inline">— Query AI platforms to see if they cite your brand. Use "Generate content" on any gap to send it to Agents.</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Citation Probe</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Sends 7 GEO-space questions to <span className="text-white font-medium">{activePlatforms > 1 ? `${activePlatforms} AI platforms` : 'Gemini'}</span> simultaneously and checks if <span className="text-white font-medium">{brand}</span> gets cited.
          </p>
        </div>
        <button
          onClick={runProbe}
          disabled={isRunning}
          className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0"
        >
          {isRunning ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Running Probe...</>
          ) : probeData ? (
            <><RefreshCw className="w-4 h-4" />Run Again</>
          ) : (
            <><Zap className="w-4 h-4" />Run Citation Probe</>
          )}
        </button>
      </div>

      {/* Loading */}
      {isRunning && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-pink-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin" />
            <Zap className="absolute inset-0 m-auto w-6 h-6 text-pink-400 animate-pulse" />
          </div>
          <p className="text-white font-semibold">Querying AI engines in parallel...</p>
          <p className="text-zinc-400 text-sm mt-2">
            Firing 7 questions at Gemini, ChatGPT, Perplexity, and Claude simultaneously.
            Checking each response for <span className="text-white">{brand}</span>.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            {(Object.keys(PLATFORM_META) as PlatformKey[]).map(p => (
              <div key={p} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${PLATFORM_META[p].bg} ${PLATFORM_META[p].border} border ${PLATFORM_META[p].text} animate-pulse`}>
                {PLATFORM_META[p].label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !isRunning && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Results */}
      {probeData && !isRunning && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

          {/* Overall score + next steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                Overall Citation Rate
              </p>
              <div className={`text-5xl font-black ${rateColor(probeData.citationRate)}`}>
                {probeData.citationRate}%
              </div>
              <p className={`text-sm font-semibold mt-2 ${rateColor(probeData.citationRate)}`}>
                {rateLabel(probeData.citationRate)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                avg across {probeData.activePlatforms ?? 1} platform{(probeData.activePlatforms ?? 1) > 1 ? 's' : ''} · {probeData.citedCount}/{probeData.totalQueries} queries hit
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:col-span-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">What to do next</p>
              {probeData.citationRate === 0 && (
                <div className="space-y-2 text-sm text-zinc-300">
                  <p>1. Use <a href="/dashboard/agents" className="text-pink-400 underline">Agent Orchestration</a> to generate GEO-optimised articles about {brand} and publish them on {domain}.</p>
                  <p>2. Add your core brand facts to the <a href="/dashboard/fact-vault" className="text-pink-400 underline">Fact Vault</a> — these inject into every LLM prompt via RAG.</p>
                  <p>3. Run the probe again after publishing. Citations build over 2–6 weeks as LLMs index new content.</p>
                </div>
              )}
              {probeData.citationRate > 0 && probeData.citationRate < 50 && (
                <div className="space-y-2 text-sm text-zinc-300">
                  <p>You're being cited — now amplify it. Target the platforms and queries that missed you below.</p>
                  <p>Each article should include JSON-LD schema with your brand as <code className="text-pink-400">author</code> or <code className="text-pink-400">provider</code>.</p>
                </div>
              )}
              {probeData.citationRate >= 50 && (
                <div className="space-y-2 text-sm text-zinc-300">
                  <p>Strong citation presence. Defend it with monthly freshness updates — citation weights decay as newer content emerges.</p>
                  <p>Focus on the uncited platforms and queries below to push toward 100%.</p>
                </div>
              )}
            </div>
          </div>

          {/* Per-platform rates */}
          {probeData.platformRates && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Platform Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.keys(PLATFORM_META) as PlatformKey[]).map(p => {
                  const rate = probeData.platformRates?.[p];
                  const meta = PLATFORM_META[p];
                  const isConfigured = rate !== null && rate !== undefined;
                  return (
                    <div key={p} className={`rounded-xl border p-4 ${isConfigured ? `${meta.bg} ${meta.border}` : 'bg-zinc-900/30 border-zinc-800'}`}>
                      <p className={`text-xs font-semibold mb-2 ${isConfigured ? meta.text : 'text-zinc-600'}`}>
                        {meta.label}
                      </p>
                      {isConfigured ? (
                        <>
                          <div className={`text-3xl font-black ${rateColor(rate as number)}`}>
                            {rate}%
                          </div>
                          <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${rate}%`, backgroundColor: meta.color }}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-zinc-600 mt-1">
                          Add API key to enable
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Per-query results with platform matrix */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Query Results</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Per-query, per-platform citation check for <span className="text-white">{brand}</span></p>
              </div>
              {/* Platform legend */}
              <div className="hidden sm:flex items-center gap-3">
                {(Object.keys(PLATFORM_META) as PlatformKey[]).map(p => {
                  const rate = probeData.platformRates?.[p];
                  if (rate === null || rate === undefined) return null;
                  return (
                    <span key={p} className={`text-[10px] font-bold uppercase tracking-wider ${PLATFORM_META[p].text}`}>
                      {p === 'chatgpt' ? 'GPT' : p === 'perplexity' ? 'PPLX' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {probeData.results.map((r, i) => {
                const activePlatformKeys = (Object.keys(PLATFORM_META) as PlatformKey[]).filter(
                  p => probeData.platformRates?.[p] !== null && probeData.platformRates?.[p] !== undefined
                );
                return (
                  <div key={i} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      {r.cited ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 font-medium">"{r.query}"</p>
                        {/* Per-platform pills */}
                        {r.platforms && activePlatformKeys.length > 1 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {activePlatformKeys.map(p => {
                              const pr = r.platforms?.[p];
                              if (!pr || pr.skipped) return null;
                              const meta = PLATFORM_META[p];
                              return (
                                <span
                                  key={p}
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    pr.cited
                                      ? `${meta.bg} ${meta.text} ${meta.border} border`
                                      : 'bg-zinc-800 text-zinc-600 border border-zinc-700'
                                  }`}
                                >
                                  {pr.cited ? '✓' : '✗'} {p === 'chatgpt' ? 'GPT' : p === 'perplexity' ? 'PPLX' : p.charAt(0).toUpperCase() + p.slice(1)}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {r.cited && r.excerpt && (
                          <p className="text-xs text-emerald-300 mt-2 bg-emerald-500/5 border border-emerald-500/20 rounded-md px-3 py-2 italic">
                            "{r.excerpt}"
                          </p>
                        )}
                        {!r.cited && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Not cited — <a href="/dashboard/agents" className="text-pink-400 underline">generate content targeting this query</a>
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${r.cited ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {r.cited ? 'CITED' : 'MISSED'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session history */}
          {history.length > 1 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-semibold text-white">This Session</h3>
              </div>
              <div className="flex items-end gap-3">
                {[...history].reverse().map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 bg-pink-500/60 rounded-t-sm"
                      style={{ height: `${Math.max(4, h.rate * 0.6)}px` }}
                    />
                    <span className="text-[10px] text-zinc-500">{h.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!probeData && !isRunning && !error && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
          <Zap className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-white mb-2">Ready to probe</h3>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
            Fires 7 real GEO-space questions simultaneously at every configured AI platform.
            Checks live whether <span className="text-white font-medium">{brand}</span> gets cited in each answer.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.keys(PLATFORM_META) as PlatformKey[]).map(p => (
              <div key={p} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${PLATFORM_META[p].bg} ${PLATFORM_META[p].border} border ${PLATFORM_META[p].text}`}>
                {PLATFORM_META[p].label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
