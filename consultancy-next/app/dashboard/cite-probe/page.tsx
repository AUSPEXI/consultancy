'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2, CheckCircle2, XCircle, TrendingUp, Target, RefreshCw, AlertTriangle, ShieldCheck, Plus, X, BookOpen, Layers, GitBranch, Database, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { checkTierAccess } from '@/constants/tiers';
import { WorkflowProgress, markStepComplete } from '@/components/dashboard/WorkflowProgress';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { authFetch } from '@/lib/auth-fetch';

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
  // Keyed by engine id (gemini, chatgpt, perplexity, claude, grok, deepseek,
  // google_aio, ...) — open-ended so new engines flow through without edits.
  platforms?: Record<string, PlatformResult | undefined>;
}

interface ProbeRun {
  brand: string;
  domain: string;
  citationRate: number;
  ci95?: [number, number];
  citedCount: number;
  misinformationCount: number;
  totalQueries: number;
  activePlatforms?: number;
  sentimentBreakdown?: { positive: number; neutral: number; negative: number };
  avgPositionPct?: number | null;
  platformRates?: Record<string, number | null>;
  results: ProbeResult[];
  timestamp: string;
  attribution?: Attribution | null;
  mode?: 'standard' | 'competitor';
  competitorDomain?: string | null;
  competitor?: CompetitorComparison | null;
  competitors?: CompetitorComparison[];
}

interface CompetitorComparison {
  brand: string;
  domain: string;
  citationRate: number;
  wins: number;
  losses: number;
  ties: number;
  comparison: { query: string; youCited: boolean; themCited: boolean; winner: 'you' | 'them' | 'tie' }[];
}

interface ContributingItem {
  id: string;
  label: string;
  matchedQueries: string[];
  overlap: number;
}

interface Attribution {
  hasPrevious: boolean;
  prevTimestamp: string | null;
  prevRate: number | null;
  newRate: number;
  deltaPp: number | null;
  newlyWonQueries: string[];
  lostQueries: string[];
  factsAddedInWindow: number;
  articlesAddedInWindow: number;
  contributingFacts: ContributingItem[];
  contributingArticles: ContributingItem[];
  note: string;
}

const PLATFORM_META = {
  gemini:     { label: 'Google Gemini', color: '#4285f4', bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400'   },
  chatgpt:    { label: 'ChatGPT',       color: '#10a37f', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  perplexity: { label: 'Perplexity',    color: '#22d3ee', bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    text: 'text-cyan-400'    },
  claude:     { label: 'Claude',        color: '#d97757', bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  text: 'text-orange-400'  },
  grok:       { label: 'Grok (xAI)',    color: '#e5e7eb', bg: 'bg-zinc-500/10',    border: 'border-zinc-500/20',    text: 'text-zinc-300'    },
  deepseek:   { label: 'DeepSeek',      color: '#8b5cf6', bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  text: 'text-violet-400'  },
  google_aio: { label: 'Google AI Overviews', color: '#fbbc05', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
} as const;

type PlatformKey = keyof typeof PLATFORM_META;

export default function CiteProbePage() {
  const { tier, role, userData, user } = useAuth();
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [probeData, setProbeData] = useState<ProbeRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ date: string; rate: number }[]>([]);
  // Persistent history from Firestore (citation_tests) — survives reloads, spans days/weeks
  const [persistentHistory, setPersistentHistory] = useState<{ timestamp: string; citationRate: number; citedCount: number; totalQueries: number; misinformationCount: number; platformRates?: Record<string, number | null> | null }[]>([]);

  const loadHistory = async () => {
    if (!user?.uid) return;
    try {
      const res = await authFetch(`/api/cite-probe?limit=30`);
      const json = await res.json();
      if (json.success && Array.isArray(json.history)) setPersistentHistory(json.history);
    } catch (_) {}
  };

  useEffect(() => { loadHistory(); }, [user?.uid]);

  // Content gaps — uncited queries with no vault fact semantically nearby.
  // Computed server-side from the last probe's geometry.
  const [gaps, setGaps] = useState<{ query: string; minFactDistance: number | null; factDensityNearQuery: number; nearestFact: string | null; recommendation: string }[]>([]);
  const [closedGaps, setClosedGaps] = useState<{ query: string; wasContentGap: boolean }[]>([]);
  const loadGaps = async () => {
    if (!user?.uid) return;
    try {
      const res = await authFetch('/api/analytics/gaps');
      const json = await res.json();
      if (json.success && Array.isArray(json.gaps)) setGaps(json.gaps);
      if (json.success && Array.isArray(json.closedGaps)) setClosedGaps(json.closedGaps);
    } catch (_) {}
  };
  useEffect(() => { loadGaps(); }, [user?.uid]);

  // Known-false statements management
  const [negativeStatements, setNegativeStatements] = useState<string[]>([]);
  // Dismissed false positives — tracked by result index so one dismiss never hides another
  const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set());
  const dismissMisinformation = (index: number) => {
    setDismissedIndices(prev => new Set(prev).add(index));
  };
  const [newFalseStatement, setNewFalseStatement] = useState('');
  const [isSavingFalses, setIsSavingFalses] = useState(false);
  const [showTruthPanel, setShowTruthPanel] = useState(false);
  // S7.1: competitor comparison inputs
  const [showCompetitorPanel, setShowCompetitorPanel] = useState(false);
  const [competitorBrand, setCompetitorBrand] = useState('');
  const [competitorDomain, setCompetitorDomain] = useState('');
  // S7.2: industry benchmark
  const [benchmark, setBenchmark] = useState<{ industry: string; averageRate: number; medianRate: number; sampleSize: number } | null>(null);

  useEffect(() => {
    const ind = (userData?.industry || '').trim();
    if (!ind || !userData?.benchmarkOptIn) { setBenchmark(null); return; }
    authFetch(`/api/benchmarks?industry=${encodeURIComponent(ind)}`)
      .then(r => r.json())
      .then(d => { if (d.success && d.benchmark) setBenchmark(d.benchmark); })
      .catch(() => {});
  }, [userData?.industry, userData?.benchmarkOptIn]);

  const brand = userData?.brand || '';
  const domain = userData?.domain || '';
  // Merge primary + watchlist competitors — all feed into head-to-head, up to the
  // server-side tier cap (20 standard / 50 Business). Primary ones listed first.
  const savedCompetitors: string[] = [
    ...(userData?.competitors || []),
    ...(userData?.watchlistCompetitors || []),
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

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

  const isReadOnly = role !== 'admin' && !checkTierAccess(tier, 'Starter');

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
      const res = await authFetch('/api/cite-probe', {
        method: 'POST',
        body: JSON.stringify({
          brand, domain,
          keywords: userData?.keywords || [],
          negativeStatements,
          // Head-to-head against ALL saved competitors by default — zero extra
          // clicks. The legacy single-competitor fields remain as a manual override.
          competitors: showCompetitorPanel ? savedCompetitors : [],
          competitorBrand: showCompetitorPanel ? competitorBrand.trim() : '',
          competitorDomain: showCompetitorPanel ? competitorDomain.trim() : '',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Probe failed');
      setProbeData(json);
      setHistory(prev => [{ date: new Date().toLocaleTimeString(), rate: json.citationRate }, ...prev].slice(0, 10));
      loadHistory(); // refresh persistent trend with the run just saved to Firestore
      loadGaps();    // recompute content gaps from the run just saved
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

      {isReadOnly && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-200">
            You&apos;re viewing <strong>read-only mode</strong>. Upgrade to <strong>Starter</strong> to use this feature.
          </p>
          <a href="/#pricing" className="text-[11px] font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors shrink-0">
            Upgrade
          </a>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Citation Probe</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Sends 7 GEO-space questions to <span className="text-white font-medium">{activePlatformsCount > 1 ? `${activePlatformsCount} AI platforms` : 'Gemini'}</span> simultaneously and checks if <span className="text-white font-medium">{brand}</span> gets cited accurately.
          </p>
        </div>
        <button
          onClick={runProbe}
          disabled={isRunning || isReadOnly}
          title={isReadOnly ? 'Upgrade to Starter to use this feature' : undefined}
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

      {/* Brand Truth Control — pre-enter known falsehoods so every probe can
          detect them. New falsehoods can also be added directly from a result
          card via the inline "Flag" button. */}
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
          <div className="px-5 pb-5 space-y-3 border-t border-zinc-800 pt-4">
            {negativeStatements.length > 0 && (
              <div className="space-y-1.5">
                {negativeStatements.map((stmt, i) => (
                  <div key={i} className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-zinc-300 flex-1">{stmt}</span>
                    <button onClick={() => removeFalseStatement(stmt)} className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newFalseStatement}
                onChange={e => setNewFalseStatement(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFalseStatement()}
                placeholder={`False claim an LLM makes about ${brand}…`}
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
          </div>
        )}
      </div>

      {/* S7.1: Competitor comparison control */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowCompetitorPanel(p => !p)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <GitBranch className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-semibold text-white">Competitor Comparison</span>
            {showCompetitorPanel && savedCompetitors.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold">
                vs {savedCompetitors.length} competitor{savedCompetitors.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500">{showCompetitorPanel ? 'Hide' : 'Head-to-head'}</span>
        </button>

        {showCompetitorPanel && (
          <div className="px-5 pb-5 border-t border-zinc-800 pt-4 space-y-3">
            <p className="text-xs text-zinc-500">
              Runs the same {activePlatformsCount > 1 ? 'queries' : 'questions'} for each of your saved competitors and shows who wins each one. Rates are measured live — no fabricated data. This also populates the Head-to-Head card on your Overview.
            </p>
            {savedCompetitors.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {savedCompetitors.slice(0, 4).map(c => (
                    <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300">
                      {c}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-600">
                  Each competitor adds one extra probe pass across all engines. Edit your list in{' '}
                  <a href="/dashboard/settings" className="text-pink-400 hover:underline">Settings</a>.
                </p>
              </>
            ) : (
              <p className="text-[11px] text-amber-400/80">
                No saved competitors yet. Add them in{' '}
                <a href="/dashboard/settings" className="text-pink-400 hover:underline">Settings → Competitors</a>{' '}
                (or use AI Discover) and they&apos;ll be compared automatically here.
              </p>
            )}
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

          {/* S7.1: Competitor head-to-head — one card per saved competitor */}
          {(probeData.competitors && probeData.competitors.length > 0
            ? probeData.competitors
            : probeData.competitor ? [probeData.competitor] : []
          ).map((cmp, ci) => (
            <div key={cmp.domain || ci} className="bg-gradient-to-br from-pink-950/20 to-zinc-900/40 border border-pink-900/40 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <GitBranch className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-semibold text-white">You vs {cmp.brand}</h3>
                <span className="text-[10px] text-zinc-500 ml-1">{cmp.domain}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-5 text-center">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{brand}</p>
                  <p className={`text-4xl font-black ${rateColor(probeData.citationRate)}`}>{probeData.citationRate}%</p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-xs text-zinc-500 mb-1">Head-to-head</p>
                  <p className="text-lg font-bold text-white">
                    <span className="text-emerald-400">{cmp.wins}W</span>
                    {' · '}
                    <span className="text-rose-400">{cmp.losses}L</span>
                    {' · '}
                    <span className="text-zinc-400">{cmp.ties}T</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{cmp.brand}</p>
                  <p className={`text-4xl font-black ${rateColor(cmp.citationRate)}`}>{cmp.citationRate}%</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {cmp.comparison.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      c.winner === 'you' ? 'bg-emerald-500/10 text-emerald-400' :
                      c.winner === 'them' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-zinc-700/40 text-zinc-400'
                    }`}>
                      {c.winner === 'you' ? 'WIN' : c.winner === 'them' ? 'LOSS' : 'TIE'}
                    </span>
                    <span className="text-xs text-zinc-300 flex-1 truncate">{c.query}</span>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {c.youCited ? '✓' : '✗'} you · {c.themCited ? '✓' : '✗'} them
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Overall score + misinformation alert + next steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Citation rate */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Overall Citation Rate</p>
              <div className={`text-5xl font-black ${rateColor(probeData.citationRate)}`}>
                {probeData.citationRate}%
              </div>
              {probeData.ci95 && (
                <p className="text-xs text-zinc-600 mt-1 font-mono">
                  95% CI: {probeData.ci95[0]}%–{probeData.ci95[1]}%
                  {(probeData.ci95[1] - probeData.ci95[0]) > 40 && (
                    <span className="ml-1 text-amber-500" title="Wide CI — run more queries for a reliable rate">⚠</span>
                  )}
                </p>
              )}
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
              {/* S7.2: industry benchmark comparison */}
              {benchmark && (
                <div className="mt-3 text-xs bg-zinc-950/60 border border-zinc-800 rounded-md px-2.5 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">{benchmark.industry} avg</span>
                    <span className="text-zinc-300 font-semibold">{benchmark.averageRate}%</span>
                  </div>
                  <p className={`mt-1 font-medium ${probeData.citationRate >= benchmark.averageRate ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {probeData.citationRate >= benchmark.averageRate
                      ? `+${probeData.citationRate - benchmark.averageRate}pp above your industry`
                      : `${benchmark.averageRate - probeData.citationRate}pp below your industry`}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Based on {benchmark.sampleSize} opted-in brands</p>
                </div>
              )}
            </div>

            {/* What to do next */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:col-span-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">What to do next</p>
              {(probeData.misinformationCount ?? 0) > 0 && (
                <div className="mb-3 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {probeData.misinformationCount} false claim{probeData.misinformationCount > 1 ? 's' : ''} detected below — use the inline actions on each flagged result.
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

          {/* Sentiment + prominence — only meaningful when the brand was cited */}
          {probeData.citedCount > 0 && probeData.sentimentBreakdown && (() => {
            const sb = probeData.sentimentBreakdown;
            const total = sb.positive + sb.neutral + sb.negative;
            const pct = (n: number) => total ? Math.round((n / total) * 100) : 0;
            const pos = probeData.avgPositionPct;
            const posLabel = pos === null || pos === undefined ? '—'
              : pos <= 33 ? 'Early' : pos <= 66 ? 'Mid' : 'Late';
            const posColor = pos === null || pos === undefined ? 'text-zinc-400'
              : pos <= 33 ? 'text-emerald-400' : pos <= 66 ? 'text-amber-400' : 'text-rose-400';
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:col-span-2">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">How AI talks about {brand}</p>
                  <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800 mb-3">
                    {sb.positive > 0 && <div className="bg-emerald-500" style={{ width: `${pct(sb.positive)}%` }} />}
                    {sb.neutral > 0 && <div className="bg-zinc-500" style={{ width: `${pct(sb.neutral)}%` }} />}
                    {sb.negative > 0 && <div className="bg-rose-500" style={{ width: `${pct(sb.negative)}%` }} />}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Positive {pct(sb.positive)}%</span>
                    <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2 h-2 rounded-full bg-zinc-500" /> Neutral {pct(sb.neutral)}%</span>
                    <span className="flex items-center gap-1.5 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-500" /> Negative {pct(sb.negative)}%</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-3">Heuristic sentiment across {total} cited mention{total !== 1 ? 's' : ''}. Indicative, not a guarantee.</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Prominence</p>
                  <div className={`text-4xl font-black ${posColor}`}>{posLabel}</div>
                  <p className="text-xs text-zinc-500 mt-2">
                    {pos === null || pos === undefined ? 'No position data' : `Brand appears ~${pos}% into the answer on average`}
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-2">Earlier mentions carry more weight in AI answers.</p>
                </div>
              </div>
            );
          })()}

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

          {/* Closed-loop attribution — what changed since the last probe */}
          {probeData.attribution?.hasPrevious && (
            <div className="bg-zinc-900/50 border border-indigo-500/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Since Your Last Probe</h3>
                {typeof probeData.attribution.deltaPp === 'number' && (
                  <span className={`ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    probeData.attribution.deltaPp > 0
                      ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                      : probeData.attribution.deltaPp < 0
                      ? 'text-red-400 bg-red-400/10 border-red-400/20'
                      : 'text-zinc-400 bg-zinc-400/10 border-zinc-700'
                  }`}>
                    {probeData.attribution.deltaPp > 0 ? '+' : ''}{probeData.attribution.deltaPp}pp
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">{probeData.attribution.note}</p>

              {probeData.attribution.newlyWonQueries.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                    Newly cited queries
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {probeData.attribution.newlyWonQueries.map((q, i) => (
                      <span key={i} className="text-xs text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-2.5 py-1">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(probeData.attribution.contributingFacts.length > 0 || probeData.attribution.contributingArticles.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {probeData.attribution.contributingFacts.length > 0 && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-3.5 h-3.5 text-blue-400" />
                        <p className="text-xs font-semibold text-white">Likely-contributing facts</p>
                      </div>
                      <ul className="space-y-2">
                        {probeData.attribution.contributingFacts.map((f) => (
                          <li key={f.id} className="text-xs text-zinc-400 leading-relaxed">
                            <span className="text-zinc-300">{f.label}</span>
                            <span className="block text-[10px] text-zinc-600 mt-0.5">
                              matches: {f.matchedQueries.join('; ')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {probeData.attribution.contributingArticles.length > 0 && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-3.5 h-3.5 text-pink-400" />
                        <p className="text-xs font-semibold text-white">Likely-contributing articles</p>
                      </div>
                      <ul className="space-y-2">
                        {probeData.attribution.contributingArticles.map((a) => (
                          <li key={a.id} className="text-xs text-zinc-400 leading-relaxed">
                            <span className="text-zinc-300">{a.label}</span>
                            <span className="block text-[10px] text-zinc-600 mt-0.5">
                              matches: {a.matchedQueries.join('; ')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-zinc-600 mt-4">
                Correlation, not proof — these items were published in the window where these queries changed and overlap their wording. GEO effects typically take 2–6 weeks to surface.
              </p>
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

                        {/* Misinformation block — inline actions, no copy-paste required */}
                        {isMisinfo && !dismissedIndices.has(i) && (
                          <div className="mt-2 bg-amber-500/8 border border-amber-500/25 rounded-lg overflow-hidden">
                            <div className="px-3 py-2.5">
                              <p className="text-xs text-amber-200 leading-relaxed">
                                <span className="font-semibold text-amber-400">⚠ AI said: </span>
                                {r.misinformation ?? 'Cited with inaccurate information'}
                              </p>
                            </div>
                            <div className="flex items-center border-t border-amber-500/15">
                              <button
                                onClick={() => r.misinformation && flagMisinformation(r.misinformation)}
                                disabled={negativeStatements.includes(r.misinformation ?? '')}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/10 disabled:opacity-40 disabled:cursor-default transition-colors border-r border-amber-500/15"
                              >
                                <Plus className="w-3 h-3" />
                                {negativeStatements.includes(r.misinformation ?? '') ? 'Saved to corrections' : 'Flag & save correction'}
                              </button>
                              <button
                                onClick={() => {
                                  if (r.misinformation) localStorage.setItem('agents_misinfo_snippets', JSON.stringify([r.misinformation]));
                                  localStorage.setItem('agents_topic', `Counter misinformation about ${brand}: "${r.query}"`);
                                  localStorage.removeItem('agents_last_result');
                                  router.push('/dashboard/agents');
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-pink-400 hover:bg-pink-500/10 transition-colors border-r border-amber-500/15"
                              >
                                <BookOpen className="w-3 h-3" /> Write counter-article
                              </button>
                              <button
                                onClick={() => dismissMisinformation(i)}
                                className="px-3 py-2 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                                title="This is actually correct — dismiss"
                              >
                                Not wrong
                              </button>
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

          {/* Closed gaps — queries that flipped uncited → cited since the last
              probe. This is the payoff moment for the gap workflow. */}
          {closedGaps.length > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl px-6 py-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Gaps Closed</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">{closedGaps.length}</span>
              </div>
              <div className="space-y-1.5">
                {closedGaps.map(c => (
                  <p key={c.query} className="text-xs text-emerald-200/90">
                    ✓ "{c.query}" flipped to <span className="font-bold text-emerald-400">cited</span>
                    {c.wasContentGap && <span className="text-zinc-500"> — was a content gap; your new content worked</span>}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Content gaps — uncited queries with no vault fact nearby. Ranked
              furthest-from-coverage first; each one is a concrete writing brief. */}
          {gaps.length > 0 && (
            <div className="bg-zinc-900/50 border border-violet-500/25 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-white">Content Gaps</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300">{gaps.length}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Queries you&apos;re losing where you have <span className="text-zinc-300">no content nearby</span>. Close a gap, re-probe, and watch it flip.
                </p>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {gaps.slice(0, 6).map((g, i) => (
                  <div key={g.query} className="px-6 py-3.5 flex items-start gap-3">
                    <span className="text-xs font-black text-violet-400/70 mt-0.5 shrink-0 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 font-medium">"{g.query}"</p>
                      <p className="text-xs text-zinc-500 mt-1">{g.recommendation}</p>
                      {g.nearestFact && (
                        <p className="text-[10px] text-zinc-600 mt-1 truncate">Closest existing fact: "{g.nearestFact}"</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        localStorage.setItem('agents_topic', g.query);
                        router.push('/dashboard/agents');
                      }}
                      className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 transition-colors"
                    >
                      Write it
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* Persistent citation-rate history (from Firestore — spans all past runs) */}
      {persistentHistory.length > 1 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Citation Rate Over Time</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-500">{persistentHistory.length} probe{persistentHistory.length !== 1 ? 's' : ''} on record</span>
              {user?.uid && (
                <a
                  href={`/api/export-training-set?userId=${encodeURIComponent(user.uid)}&format=jsonl`}
                  download="training-set.jsonl"
                  className="text-[10px] font-semibold text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-md px-2 py-1 transition-colors"
                  title="Download all probe runs as JSONL for ML training"
                >
                  ↓ Export JSONL
                </a>
              )}
            </div>
          </div>
          {(() => {
            const points = persistentHistory;
            const w = 100, h = 100;
            const max = 100;
            const coords = points.map((p, i) => {
              const x = points.length === 1 ? 0 : (i / (points.length - 1)) * w;
              const y = h - (Math.min(max, Math.max(0, p.citationRate)) / max) * h;
              return { x, y, p };
            });
            const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(' ');
            const first = points[0].citationRate;
            const last = points[points.length - 1].citationRate;
            const delta = last - first;
            return (
              <>
                <div className="relative w-full h-40">
                  <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    {[0, 25, 50, 75, 100].map(g => (
                      <line key={g} x1={0} x2={w} y1={h - (g / max) * h} y2={h - (g / max) * h} stroke="#27272a" strokeWidth="0.5" />
                    ))}
                    <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#citeGrad)" opacity="0.15" />
                    <path d={path} fill="none" stroke="#10b981" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                    {coords.map((c, i) => (
                      <circle key={i} cx={c.x} cy={c.y} r="1.5" fill="#10b981" vectorEffect="non-scaling-stroke" />
                    ))}
                    <defs>
                      <linearGradient id="citeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-zinc-500">
                    {new Date(points[0].timestamp).toLocaleDateString()} → {new Date(points[points.length - 1].timestamp).toLocaleDateString()}
                  </span>
                  <span className={`font-semibold ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                    {delta > 0 ? '▲' : delta < 0 ? '▼' : '–'} {Math.abs(delta)}% since first probe
                  </span>
                </div>

                {/* Per-platform mini-trends (S2.2) */}
                {points.some(p => p.platformRates) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-800">
                    {(Object.keys(PLATFORM_META) as PlatformKey[]).map(pk => {
                      const meta = PLATFORM_META[pk];
                      const series = points.map(p => p.platformRates?.[pk]).filter((v): v is number => v !== null && v !== undefined);
                      if (series.length === 0) return null;
                      const sw = 100, sh = 32;
                      const spark = points
                        .map((p, i) => ({ v: p.platformRates?.[pk], i }))
                        .filter(d => d.v !== null && d.v !== undefined) as { v: number; i: number }[];
                      const coords = spark.map((d, idx) => ({
                        x: spark.length === 1 ? 0 : (idx / (spark.length - 1)) * sw,
                        y: sh - (Math.min(100, Math.max(0, d.v)) / 100) * sh,
                      }));
                      const path = coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
                      const lastVal = series[series.length - 1];
                      return (
                        <div key={pk} className={`rounded-lg border p-3 ${meta.bg} ${meta.border}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold ${meta.text}`}>{meta.label}</span>
                            <span className={`text-xs font-black ${rateColor(lastVal)}`}>{lastVal}%</span>
                          </div>
                          <svg viewBox={`0 0 ${sw} ${sh}`} preserveAspectRatio="none" className="w-full h-8 overflow-visible">
                            <path d={path} fill="none" stroke={meta.color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                            {coords.map((c, idx) => <circle key={idx} cx={c.x} cy={c.y} r="1.5" fill={meta.color} vectorEffect="non-scaling-stroke" />)}
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
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
