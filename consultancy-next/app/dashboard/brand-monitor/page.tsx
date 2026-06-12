'use client';
import { useState } from 'react';
import { Radar, Loader2, AlertOctagon, MessageSquare, PenTool, Sprout, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logAuditAction } from '@/lib/audit';
import { checkTierAccess } from '@/constants/tiers';
import { authFetch } from '@/lib/auth-fetch';

interface SeedDraft {
  reddit: {
    subreddit: string;
    postType: 'comment' | 'post';
    title?: string;
    body: string;
    tone: string;
    optimalTime: string;
    rationale: string;
  };
  linkedin: {
    body: string;
    tone: string;
    hashtags: string[];
    optimalTime: string;
    rationale: string;
  };
  keyMessages: string[];
}

interface ThreadSeedState {
  loading: boolean;
  draft: SeedDraft | null;
  expanded: boolean;
  copiedReddit: boolean;
  copiedLinkedIn: boolean;
}

export default function BrandMonitorPage() {
  const { tier, role, user, userData } = useAuth();
  const [brand, setBrand] = useState(userData?.brand || '');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [seedStates, setSeedStates] = useState<Record<number, ThreadSeedState>>({});

  const isReadOnly = role !== 'admin' && !checkTierAccess(tier, 'Pro');
  const isBusiness = role === 'admin' || checkTierAccess(tier, 'Business');

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleMonitor = async () => {
    if (isReadOnly) return;
    if (!brand.trim()) return;
    setIsMonitoring(true);
    setResults(null);
    setSeedStates({});

    try {
      const res = await authFetch('/api/brand-monitor', {
        method: 'POST',
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

  const handleSeed = async (i: number, thread: any) => {
    if (isReadOnly) return;
    setSeedStates(prev => ({ ...prev, [i]: { loading: true, draft: null, expanded: true, copiedReddit: false, copiedLinkedIn: false } }));
    try {
      const res = await authFetch('/api/seed-content', {
        method: 'POST',
        body: JSON.stringify({
          brand,
          threadTitle: thread.title,
          threadUrl: thread.url,
          threadSummary: thread.summary,
          sentiment: thread.sentiment,
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Seed generation failed');
      setSeedStates(prev => ({ ...prev, [i]: { loading: false, draft: data.draft, expanded: true, copiedReddit: false, copiedLinkedIn: false } }));
      if (user) {
        await logAuditAction(user.uid, 'Generated Seed Content', { brand, threadTitle: thread.title });
      }
    } catch (err) {
      console.error('seed error:', err);
      showToast('Failed to generate seed content.', 'error');
      setSeedStates(prev => ({ ...prev, [i]: { loading: false, draft: null, expanded: false, copiedReddit: false, copiedLinkedIn: false } }));
    }
  };

  const copyText = async (text: string, i: number, field: 'copiedReddit' | 'copiedLinkedIn') => {
    await navigator.clipboard.writeText(text);
    setSeedStates(prev => ({ ...prev, [i]: { ...prev[i], [field]: true } }));
    setTimeout(() => setSeedStates(prev => ({ ...prev, [i]: { ...prev[i], [field]: false } })), 2000);
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'Positive') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (sentiment === 'Negative') return 'text-red-400 bg-red-400/10 border-red-400/20';
    return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
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
          <Radar className="w-8 h-8 text-pink-500" />
          Consensus Platform Monitor
        </h1>
        <p className="text-zinc-400">Real-time mention scanning across Reddit, Quora, and forums.</p>
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
            disabled={isReadOnly || isMonitoring || !brand.trim()}
            title={isReadOnly ? 'Upgrade to Pro to use this feature' : undefined}
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
            {!isBusiness && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sprout className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Autonomous Seeding</span>
                  <span className="text-xs px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full">Business</span>
                </div>
                <p className="text-xs text-zinc-500">Upgrade to Business to generate ready-to-post Reddit and LinkedIn counter-narrative drafts for each detected threat.</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Consensus Threads</h3>
              {typeof results.totalSignals === 'number' && (
                <span className="text-xs text-zinc-500">
                  {results.totalSignals} live source{results.totalSignals === 1 ? '' : 's'} via Exa
                </span>
              )}
            </div>
            {results.threads.map((thread: any, i: number) => {
              const seed = seedStates[i];
              return (
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
                    <div className="mt-4 flex flex-wrap items-center gap-2 justify-end">
                      <button
                        onClick={() => {
                           window.dispatchEvent(new CustomEvent('set-agent-topic', { detail: { topic: `Write a counter-narrative or response addressing this consensus topic: ${thread.title}` }}));
                           window.dispatchEvent(new CustomEvent('change-dashboard-tab', { detail: { tab: 'agents' } }));
                        }}
                        className="px-4 py-2 border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <PenTool className="w-3.5 h-3.5" /> Draft Counter-Narrative (Agents)
                      </button>
                      {isBusiness && (
                        <button
                          onClick={() => seed?.draft
                            ? setSeedStates(prev => ({ ...prev, [i]: { ...prev[i], expanded: !prev[i].expanded } }))
                            : handleSeed(i, thread)
                          }
                          disabled={isReadOnly || seed?.loading}
                          title={isReadOnly ? 'Upgrade to Pro to use this feature' : undefined}
                          className="px-4 py-2 border border-emerald-700/50 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                          {seed?.loading ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                          ) : seed?.draft ? (
                            seed.expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide Seed Drafts</> : <><ChevronDown className="w-3.5 h-3.5" /> Show Seed Drafts</>
                          ) : (
                            <><Sprout className="w-3.5 h-3.5" /> Generate Seed Content</>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Seed draft panel — Business only */}
                  {seed?.draft && seed.expanded && (
                    <div className="mt-5 space-y-4 border-t border-zinc-800 pt-5">
                      <div className="flex items-center gap-2 mb-1">
                        <Sprout className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-400">Seed Content Drafts</span>
                      </div>

                      {seed.draft.keyMessages.length > 0 && (
                        <div className="bg-zinc-800/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-zinc-400 mb-2">Key Messages</p>
                          <ul className="space-y-1">
                            {seed.draft.keyMessages.map((msg, mi) => (
                              <li key={mi} className="text-xs text-zinc-300 flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">·</span>{msg}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Reddit draft */}
                      <div className="bg-orange-950/20 border border-orange-800/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-xs font-semibold text-orange-400">Reddit</span>
                            <span className="text-xs text-zinc-500 ml-2">r/{seed.draft.reddit.subreddit} · {seed.draft.reddit.postType} · {seed.draft.reddit.tone}</span>
                          </div>
                          <button
                            onClick={() => copyText(
                              (seed.draft!.reddit.title ? `${seed.draft!.reddit.title}\n\n` : '') + seed.draft!.reddit.body,
                              i,
                              'copiedReddit'
                            )}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs bg-orange-900/40 hover:bg-orange-800/40 text-orange-300 rounded-md transition-colors"
                          >
                            {seed.copiedReddit ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                          </button>
                        </div>
                        {seed.draft.reddit.title && (
                          <p className="text-sm font-medium text-white mb-2">{seed.draft.reddit.title}</p>
                        )}
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{seed.draft.reddit.body}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                          <span>Post at: <span className="text-zinc-400">{seed.draft.reddit.optimalTime}</span></span>
                          <span>Why: <span className="text-zinc-400">{seed.draft.reddit.rationale}</span></span>
                        </div>
                      </div>

                      {/* LinkedIn draft */}
                      <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-xs font-semibold text-blue-400">LinkedIn</span>
                            <span className="text-xs text-zinc-500 ml-2">{seed.draft.linkedin.tone}</span>
                          </div>
                          <button
                            onClick={() => copyText(
                              seed.draft!.linkedin.body + '\n\n' + seed.draft!.linkedin.hashtags.map(h => `#${h}`).join(' '),
                              i,
                              'copiedLinkedIn'
                            )}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs bg-blue-900/40 hover:bg-blue-800/40 text-blue-300 rounded-md transition-colors"
                          >
                            {seed.copiedLinkedIn ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                          </button>
                        </div>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{seed.draft.linkedin.body}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {seed.draft.linkedin.hashtags.map((tag, ti) => (
                            <span key={ti} className="text-xs text-blue-400">#{tag}</span>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                          <span>Post at: <span className="text-zinc-400">{seed.draft.linkedin.optimalTime}</span></span>
                          <span>Why: <span className="text-zinc-400">{seed.draft.linkedin.rationale}</span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {results.threads.length === 0 && (
              <div className="text-zinc-500 text-center py-8">No recent threads found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
