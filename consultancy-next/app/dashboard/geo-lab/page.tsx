'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth-fetch';
import { checkTierAccess } from '@/constants/tiers';
import { FlaskConical, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { db } from '@/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface TopEffect {
  platform: string;
  treatment: string;
  diffPp: number;
  pValue: number;
}

interface Recommendation {
  lever: string;
  headline: string;
  recommendation: string;
  appliesTo: string[];
  topEffect: TopEffect | null;
  platforms: string[];
  trialsPerVariant: number | null;
  runAt: string | null;
}

function EffectBadge({ effect }: { effect: TopEffect }) {
  const sign = effect.diffPp > 0 ? '+' : '';
  const color = effect.diffPp > 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold ${color}`}>
      {effect.diffPp > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {sign}{effect.diffPp.toFixed(1)}pp · {effect.platform}
    </span>
  );
}

function FindingCard({ rec }: { rec: Recommendation }) {
  const [expanded, setExpanded] = useState(false);
  const age = rec.runAt ? Math.round((Date.now() - new Date(rec.runAt).getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-zinc-900/80 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-widest font-mono">{rec.lever}</span>
            {rec.topEffect && <EffectBadge effect={rec.topEffect} />}
            {rec.topEffect && (
              <span className="text-[10px] text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">
                p={rec.topEffect.pValue.toFixed(3)} {rec.topEffect.pValue < 0.05 ? '✓' : '~'}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white">{rec.headline}</p>
        </div>
        <div className="shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-zinc-800 pt-4 space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">{rec.recommendation}</p>

          <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
            {rec.trialsPerVariant && <span>{rec.trialsPerVariant.toLocaleString()} trials per variant</span>}
            {rec.platforms.length > 0 && <span>Platforms: {rec.platforms.join(', ')}</span>}
            {age !== null && <span>Experiment ran {age} day{age !== 1 ? 's' : ''} ago</span>}
          </div>

          {rec.appliesTo.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {rec.appliesTo.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// S6.3: experiment request form
function RequestForm({ userId, isReadOnly }: { userId: string; isReadOnly: boolean }) {
  const [hypothesis, setHypothesis] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (isReadOnly) return;
    if (!hypothesis.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'lab_requests'), {
        userId,
        hypothesis: hypothesis.trim(),
        submittedAt: new Date().toISOString(),
        status: 'pending',
      });
      setSubmitted(true);
      setHypothesis('');
    } catch { /* non-fatal */ }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-400">
        Request submitted. The GEO Lab team will review it for the next experiment batch.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
      <div>
        <p className="text-sm font-semibold text-white mb-1">Request an experiment</p>
        <p className="text-xs text-zinc-500">Have a hunch about what improves AI citations? Submit a hypothesis and it may be tested in a future GEO Lab A/B experiment.</p>
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          value={hypothesis}
          onChange={e => setHypothesis(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !submitting && handleSubmit()}
          placeholder="e.g. Adding a numbered list of statistics increases citation rate vs prose"
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40"
        />
        <button
          onClick={handleSubmit}
          disabled={isReadOnly || submitting || !hypothesis.trim()}
          title={isReadOnly ? 'Upgrade to Pro to use this feature' : undefined}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          Submit
        </button>
      </div>
    </div>
  );
}

export default function GeoLabPage() {
  const { user, tier, role } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [nullCount, setNullCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isReadOnly = role !== 'admin' && !checkTierAccess(tier, 'Pro');

  useEffect(() => {
    authFetch('/api/geo-findings')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setRecommendations(d.recommendations || []);
          setNullCount(d.nullResultCount || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2 flex items-center gap-3">
            <FlaskConical className="w-7 h-7 text-pink-400" />
            GEO Lab Results
          </h1>
          <p className="text-zinc-400 max-w-2xl">
            Live findings from the L8EntSpace GEO Lab. Real A/B experiments measuring which content tactics lift citation rate. Only statistically significant results appear here.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500 shrink-0">
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg font-medium">
            {recommendations.length} active finding{recommendations.length !== 1 ? 's' : ''}
          </span>
          {nullCount > 0 && (
            <span className="bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-lg">
              {nullCount} null result{nullCount !== 1 ? 's' : ''} (stored for transparency)
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
          Loading lab findings…
        </div>
      )}

      {!loading && recommendations.length === 0 && (
        <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <FlaskConical className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">No lab findings yet.</p>
          <p className="text-sm text-zinc-600 mt-1 max-w-md mx-auto">
            The GEO Lab runs weekly A/B experiments. Significant results will appear here once the first experiment completes. Set <code className="text-pink-400">GEO_FINDINGS_SECRET</code> in both Netlify and GitHub secrets to connect the lab.
          </p>
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 border-b border-zinc-800 pb-3">
            Sorted by effect size (strongest first). Click any finding to expand the recommendation.
          </p>
          {recommendations.map(rec => <FindingCard key={rec.lever} rec={rec} />)}
        </div>
      )}

      {!loading && nullCount > 0 && (
        <div className="text-center py-4 text-xs text-zinc-600 flex items-center justify-center gap-2">
          <Minus className="w-3 h-3" />
          {nullCount} experiment{nullCount !== 1 ? 's' : ''} returned null results. No significant effect detected. Null results are stored but not shown as recommendations.
        </div>
      )}

      {/* S6.3: experiment request form */}
      {!loading && user && <RequestForm userId={user.uid} isReadOnly={isReadOnly} />}
    </div>
  );
}
