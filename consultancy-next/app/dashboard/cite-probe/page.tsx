'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2, CheckCircle2, XCircle, TrendingUp, Target, RefreshCw, AlertTriangle, ShieldCheck, Plus, X, BookOpen, Layers } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { checkTierAccess } from '@/constants/tiers';
import { WorkflowProgress, markStepComplete } from '@/components/dashboard/WorkflowProgress';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';

interface PlatformResult {
  cited: boolean;
  accurate: boolean;
  misinformation: string | null;
  excerpt: string | null;
  error?: string;
  skipped?: boolean;
}

interface ProbeResult {
  query: string;
  cited: boolean;
  accurate: boolean;
  misinformation: string | null;
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
  misinformationCount: number;
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
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [probeData, setProbeData] = useState<ProbeRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ date: string; rate: number }[]>([]);

  // Known-false statements management
  const [negativeStatements, setNegativeStatements] = useState<string[]>([]);
  // Dismissed false positives — hidden locally, never written to negativeStatements
  const [dismissedMisinfo, setDismissedMisinfo] = useState<Set<string>>(new Set());
  const dismissMisinformation = (snippet: string) => {
    setDismissedMisinfo(prev => new Set(prev).add(snippet));
  };
  const [newFalseStatement, setNewFalseStatement] = useState('');
  const [isSavingFalses, setIsSavingFalses] = useState(false);
  const [showTruthPanel, setShowTruthPanel] = useState(false);

  const brand = userData?.brand || '';
  const domain = userData?.domain || '';

  // Load negativeStatements from userData on mount
  useEffect(() => {
    if (userData?.negativeStatements) {
      setNegativeStatements(userData.negativeStatements);
      if (userData.negativeStatements.length > 0) setShowTruthPanel(true);
    }
  }, [userData]);

  const saveNegativeStatements = async (statements: string[]) => {
    if (!user) return;
    setIsSavingFalses(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { negativeStatements: statements }, { merge: true });
    } catch (e) {
      console.error('Failed to save negativeStatements', e);
    } finally {
      setIsSavingFalses(false);
    }
  };

  const addFalseStatement = async () => {
    const stmt = newFalseStatement.trim();
    if (!stmt || negativeStatements.includes(stmt)) return;
    const updated = [...negativeStatements, stmt];
    setNegativeStatements(updated);
    setNewFalseStatement('');
    await saveNegativeStatements(updated);
  };

  const removeFalseStatement = async (stmt: string) => {
    const updated = negativeStatements.filter(s => s !== stmt);
    setNegativeStatements(updated);
    await saveNegativeStatements(updated);
  };

  // Quick-add from a misinformation excerpt detected in results
  const flagMisinformation = async (snippet: string) => {
    if (!snippet || negativeStatements.includes(snippet)) return;
    const updated = [...negativeStatements, snippet];
    setNegativeStatements(updated);
    setShowTruthPanel(true);
    await saveNegativeStatements(updated);
  };

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
        <WorkflowProgress currentStep={1} />
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
        body: JSON.stringify({
          brand, domain,
          userId: user?.uid || 'anonymous',
          keywords: userData?.keywords || [],
          negativeStatements,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Probe failed');
      setProbeData(json);
      setHistory(prev => [{ date: new Date().toLocaleTimeString(), rate: json.citationRate }, ...prev].slice(0, 10));
      markStepComplete(1);
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

  const activePlatformsCount = probeData?.activePlatforms ?? 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <WorkflowProgress currentStep={1} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Citation Probe</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Sends 7 GEO-space questions to <span className="text-white font-medium">{activePlatformsCount > 1 ? `${activePlatformsCount} AI platforms` : 'Gemini'}</span> simultaneously and checks if <span className="text-white font-medium">{brand}</span> gets cited accurately.
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

      {/* Brand Truth Control */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowTruthPanel(p => !p)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Brand Truth Control</span>
            {negativeStatements.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                {negativeStatements.length} correction{negativeStatements.length !== 1 ? 's' : ''} active
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500">{showTruthPanel ? 'collapse ▲' : 'expand ▼'}</span>
        </button>
        {showTruthPanel && (
          <div className="px-5 pb-5 space-y-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 pt-4">
              Enter known-false statements that LLMs say about {brand}. The probe will detect and flag these as <span className="text-amber-400 font-medium">misinformation citations</span> rather than valid citations — and feed corrections into every article the agent pipeline generates.
            </p>

            {/* Existing statements */}
            {negativeStatements.length > 0 && (
              <div className="space-y-2">
                {negativeStatements.map((stmt, i) => (
                  <div key={i} className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-zinc-300 flex-1">{stmt}</span>
                    <button
                      onClick={() => removeFalseStatement(stmt)}
                      className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newFalseStatement}
                onChange={e => setNewFalseStatement(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFalseStatement()}
                placeholder={`e.g. "${brand} is an Australian data analytics firm" or "${brand} was founded in 2010"`}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500"
              />
              <button
                onClick={addFalseStatement}
                disabled={!newFalseStatement.trim() || isSavingFalses}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
              >
                {isSavingFalses ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add
              </button>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">How to counter misinformation in LLMs</p>
              <p className="text-xs text-zinc-500">
                1. <strong className="text-zinc-400">Add corrections above</strong> — these flag bad citations in the probe and inject counter-narrative into articles.<br />
                2. <strong className="text-zinc-400">Run Agent Orchestration</strong> with queries that directly answer the false claim.<br />
                3. <strong className="text-zinc-400">Publish with JSON-LD schema</strong> including <code className="text-pink-400">correctionsOf</code> or <code className="text-pink-400">description</code> that explicitly states what {brand} is not.<br />
                4. <strong className="text-zinc-400">Build authoritative backlinks</strong> to the corrective content so LLMs weight it above the false sources.
              </p>
            </div>
          </div>
        )}
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
            Checking each response for <span className="text-white">{brand}</span>{negativeStatements.length > 0 ? ` and ${negativeStatements.length} known-false statement${negativeStatements.length > 1 ? 's' : ''}` : ''}.
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

          {/* Overall score + misinformation alert + next steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Citation rate */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Overall Citation Rate</p>
              <div className={`text-5xl font-black ${rateColor(probeData.citationRate)}`}>
                {probeData.citationRate}%
              </div>
              <p className={`text-sm font-semibold mt-2 ${rateColor(probeData.citationRate)}`}>
                {rateLabel(probeData.citationRate)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                avg across {probeData.activePlatforms ?? 1} platform{(probeData.activePlatforms ?? 1) > 1 ? 's' : ''} · {probeData.citedCount}/{probeData.totalQueries} queries hit
              </p>
              {(probeData.misinformationCount ?? 0) > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-2.5 py-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {probeData.misinformationCount} misinformation citation{probeData.misinformationCount > 1 ? 's' : ''} detected
                </div>
              )}
            </div>

            {/* What to do next */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:col-span-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">What to do next</p>
              {(probeData.misinformationCount ?? 0) > 0 && (
                <div className="mb-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-300 font-semibold mb-1">⚠ Misinformation detected</p>
                  <p className="text-xs text-zinc-400">LLMs are citing {brand} with incorrect information. Use the <strong className="text-white">Flag as Misinformation</strong> button on the result below to save it, then run Agent Orchestration to publish authoritative content that counters it.</p>
                </div>
              )}
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
              {probeData.citationRate >= 50 && (probeData.misinformationCount ?? 0) === 0 && (
                <div className="space-y-2 text-sm text-zinc-300">
                  <p>Strong citation presence. Defend it with monthly freshness updates — citation weights decay as newer content emerges.</p>
                  <p>Focus on the uncited platforms and queries below to push toward 100%.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bulk process missed queries */}
          {probeData.results.some(r => !r.cited) && (
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Layers className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {probeData.results.filter(r => !r.cited).length} missed {probeData.results.filter(r => !r.cited).length === 1 ? 'query' : 'queries'} — process them all at once
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Sends every uncited query through the full agent pipeline (crawl → extract → schema → article) and auto-saves each result.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const missed = probeData.results.filter(r => !r.cited).map(r => r.query);
                  localStorage.setItem('agents_bulk_queue', JSON.stringify(missed));
                  router.push('/dashboard/agents');
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <Layers className="w-4 h-4" />
                Process All {probeData.results.filter(r => !r.cited).length} Missed
              </button>
            </div>
          )}

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
                        <div className="text-xs text-zinc-600 mt-1">Add API key to enable</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Per-query results */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Query Results</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Per-query, per-platform citation quality for <span className="text-white">{brand}</span>
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-[10px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Cited correctly</span>
                <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-3 h-3" /> Misinformation</span>
                <span className="flex items-center gap-1 text-zinc-600"><XCircle className="w-3 h-3" /> Missed</span>
              </div>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {probeData.results.map((r, i) => {
                const isMisinfo = r.cited && !r.accurate;
                const activePlatformKeys = (Object.keys(PLATFORM_META) as PlatformKey[]).filter(
                  p => probeData.platformRates?.[p] !== null && probeData.platformRates?.[p] !== undefined
                );
                return (
                  <div key={i} className={`px-6 py-4 ${isMisinfo ? 'bg-amber-500/5' : ''}`}>
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      {!r.cited && <XCircle className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />}
                      {r.cited && r.accurate && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
                      {isMisinfo && <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 font-medium">"{r.query}"</p>

                        {/* Per-platform pills */}
                        {r.platforms && activePlatformKeys.length > 1 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {activePlatformKeys.map(p => {
                              const pr = r.platforms?.[p];
                              if (!pr || pr.skipped) return null;
                              const meta = PLATFORM_META[p];
                              const isMisinfoPlatform = pr.cited && !pr.accurate;
                              return (
                                <span
                                  key={p}
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isMisinfoPlatform
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                      : pr.cited
                                        ? `${meta.bg} ${meta.text} ${meta.border} border`
                                        : 'bg-zinc-800 text-zinc-600 border border-zinc-700'
                                  }`}
                                >
                                  {isMisinfoPlatform ? '⚠' : pr.cited ? '✓' : '✗'}{' '}
                                  {p === 'chatgpt' ? 'GPT' : p === 'perplexity' ? 'PPLX' : p.charAt(0).toUpperCase() + p.slice(1)}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Correct citation excerpt */}
                        {r.cited && r.accurate && r.excerpt && (
                          <p className="text-xs text-emerald-300 mt-2 bg-emerald-500/5 border border-emerald-500/20 rounded-md px-3 py-2 italic">
                            "{r.excerpt}"
                          </p>
                        )}

                        {/* Misinformation block */}
                        {isMisinfo && !dismissedMisinfo.has(r.misinformation ?? '') && (
                          <div className="mt-2 space-y-2">
                            {r.misinformation && (
                              <div className="bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2">
                                <p className="text-[10px] font-semibold text-amber-400 mb-1 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> MISINFORMATION DETECTED
                                </p>
                                <p className="text-xs text-amber-200 italic">"{r.misinformation}"</p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => r.misinformation && flagMisinformation(r.misinformation)}
                                className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-md transition-colors"
                              >
                                <Plus className="w-3 h-3" /> Add to Corrections
                              </button>
                              <button
                                onClick={() => r.misinformation && dismissMisinformation(r.misinformation)}
                                className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 bg-zinc-700/50 hover:bg-zinc-700 text-zinc-400 border border-zinc-600/50 rounded-md transition-colors"
                                title="This information is actually correct — dismiss the alert"
                              >
                                ✓ Actually Correct
                              </button>
                              <a
                                href="/dashboard/agents"
                                className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 border border-pink-500/30 rounded-md transition-colors"
                              >
                                <BookOpen className="w-3 h-3" /> Generate corrective article
                              </a>
                            </div>
                          </div>
                        )}

                        {!r.cited && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Not cited —{' '}
                            <button
                              onClick={() => {
                                localStorage.setItem('agents_topic', r.query);
                                router.push('/dashboard/agents');
                              }}
                              className="text-pink-400 underline hover:text-pink-300 transition-colors"
                            >
                              generate content targeting this query
                            </button>
                          </p>
                        )}
                      </div>

                      {/* Status label */}
                      <span className={`text-xs font-bold shrink-0 ${
                        isMisinfo ? 'text-amber-400' : r.cited ? 'text-emerald-400' : 'text-zinc-600'
                      }`}>
                        {isMisinfo ? 'MISINFO' : r.cited ? 'CITED' : 'MISSED'}
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
            Checks live whether <span className="text-white font-medium">{brand}</span> gets cited accurately — and flags any misinformation.
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
