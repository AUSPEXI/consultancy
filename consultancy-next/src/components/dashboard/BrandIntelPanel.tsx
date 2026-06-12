'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, Zap, ShieldAlert, BarChart3, Database, Crosshair } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth-fetch';

// Brand Intelligence panel — the real replacement for the old AetherGen
// synthetic-data demo. Every number here comes from the user's own probe
// history via /api/analytics/intel. No synthetic rows: when there is no probe
// history we say so instead of decorating the page with fake charts.

const ENGINE_COLORS: Record<string, string> = {
  chatgpt: '#10b981',
  claude: '#f59e0b',
  gemini: '#3b82f6',
  perplexity: '#ff1493',
  grok: '#a78bfa',
  deepseek: '#06b6d4',
  google_aio: '#84cc16',
};

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Google AI',
  perplexity: 'Perplexity',
  grok: 'Grok',
  deepseek: 'DeepSeek',
  google_aio: 'Google AIO',
};

const TREND_BADGE: Record<string, string> = {
  rising: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  declining: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  stable: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  'single-probe': 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20',
};

type Tab = 'trend' | 'platforms' | 'competitors' | 'drift' | 'content';

interface IntelData {
  probeCount: number;
  spanDays?: number;
  summary?: {
    citationRate: number | null;
    citationDelta: number | null;
    avgPositionPct: number | null;
    sentiment: { positive: number; neutral: number; negative: number };
    driftEventCount: number;
    trojanOpportunityCount: number;
  };
  trend?: { date: string | null; citationRate: number | null; platformRates: Record<string, number | null> }[];
  platforms?: { platform: string; rate: number | null; delta: number | null }[];
  driftAlerts?: { from: string | null; to: string | null; platform: string; fromRate: number; toRate: number; deltaPp: number; zScore: number }[];
  competitors?: {
    brand: string; domain: string; latestRate: number; trendDelta: number; trendStatus: string;
    wins: number; losses: number; probeCount: number;
    history: { date: string | null; rate: number }[];
    trojanQueries: string[];
  }[];
}

interface Props {
  realArticles?: { id: string; topic?: string; geoScore?: number; timestamp?: string }[];
  userBrand?: string;
}

export function BrandIntelPanel({ realArticles = [], userBrand = 'Your Brand' }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('trend');

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/api/analytics/intel');
        const json = await res.json();
        if (!cancelled && json.success) setData(json);
      } catch { /* panel is optional — fail silently */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const scoredArticles = realArticles.filter(a => a.geoScore != null);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Crosshair className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Brand Intelligence</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {data && data.probeCount > 0
                ? `${data.probeCount} probe runs · ${data.spanDays ?? 0} day window · live data`
                : 'your real probe history, analysed'}
            </p>
          </div>
        </div>
        {data?.summary && (
          <div className="flex gap-4 text-center">
            {[
              {
                label: 'Citation Rate',
                value: data.summary.citationRate !== null ? `${data.summary.citationRate}%` : 'N/A',
              },
              {
                label: 'Δ Last Probe',
                value: data.summary.citationDelta !== null
                  ? `${data.summary.citationDelta > 0 ? '+' : ''}${data.summary.citationDelta}pp` : 'N/A',
              },
              { label: 'Drift Events', value: String(data.summary.driftEventCount) },
              { label: 'Trojan Opps', value: String(data.summary.trojanOpportunityCount) },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xs font-bold text-white">{s.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto">
        {([
          ['trend', 'Citation Trend', TrendingUp],
          ['platforms', 'Platforms', BarChart3],
          ['competitors', 'Competitors', ShieldAlert],
          ['drift', 'Drift Alerts', Zap],
          ['content', 'Content Scores', Database],
        ] as [Tab, string, any][]).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === id
                ? 'text-pink-400 border-pink-500 bg-pink-500/5'
                : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/30'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-zinc-500">
            <div className="w-4 h-4 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            <span className="text-sm">Loading your probe history...</span>
          </div>
        )}

        {/* Honest empty state — no fake charts */}
        {!loading && (!data || data.probeCount === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Crosshair className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-sm font-semibold text-zinc-300">No probe history yet</p>
            <p className="text-xs text-zinc-500 mt-1.5 max-w-sm">
              Run a Citation Probe to start building your brand intelligence: citation trends,
              per-platform drift detection, and competitor head-to-head tracking, all from real
              AI engine responses, not synthetic data.
            </p>
            <a
              href="/dashboard/cite-probe"
              className="mt-4 px-4 py-2 text-xs font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-lg hover:bg-pink-500/20 transition-colors"
            >
              Run your first probe →
            </a>
          </div>
        )}

        {!loading && data && data.probeCount > 0 && (
          <>
            {/* Citation Trend */}
            {activeTab === 'trend' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-white">Citation Rate Over Time</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {userBrand} · per probe run, overall + per engine · {data.probeCount} runs
                  </p>
                </div>
                {data.probeCount < 2 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">
                    One probe run so far. The trend appears after your second run.
                  </p>
                ) : (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <LineChart
                        data={(data.trend ?? []).map(t => ({
                          date: t.date,
                          Overall: t.citationRate,
                          ...Object.fromEntries(Object.entries(t.platformRates).map(([k, v]) => [ENGINE_LABELS[k] ?? k, v])),
                        }))}
                        margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                          labelStyle={{ color: '#a1a1aa', fontSize: 11 }}
                          itemStyle={{ fontSize: 11 }}
                        />
                        <Line type="monotone" dataKey="Overall" stroke="#ff1493" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                        {Object.entries(ENGINE_LABELS).map(([key, label]) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={label}
                            stroke={ENGINE_COLORS[key]}
                            strokeWidth={1.25}
                            strokeOpacity={0.6}
                            dot={false}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="text-[10px] text-zinc-600">
                  Bold pink = overall citation rate. Thin lines = per-engine rates. Every point is a real probe run.
                </p>
              </div>
            )}

            {/* Platforms */}
            {activeTab === 'platforms' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-white">Per-Engine Citation Rate: Latest Probe</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">With change vs your previous probe</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(data.platforms ?? []).filter(p => p.rate !== null).map(p => (
                    <div key={p.platform} className="flex flex-col items-center gap-1 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <span className="text-xl font-black" style={{ color: ENGINE_COLORS[p.platform] ?? '#6b7280' }}>
                        {p.rate}%
                      </span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                        {ENGINE_LABELS[p.platform] ?? p.platform}
                      </span>
                      {p.delta !== null && p.delta !== 0 && (
                        <span className={`text-[10px] font-mono font-bold ${p.delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {p.delta > 0 ? '▲' : '▼'} {Math.abs(p.delta)}pp
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                      data={(data.platforms ?? []).filter(p => p.rate !== null).map(p => ({
                        engine: ENGINE_LABELS[p.platform] ?? p.platform, rate: p.rate, key: p.platform,
                      }))}
                      margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="engine" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={(v) => [`${v}%`, 'Citation Rate']} />
                      <Bar dataKey="rate" radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {(data.platforms ?? []).filter(p => p.rate !== null).map(p => (
                          <Cell key={p.platform} fill={ENGINE_COLORS[p.platform] ?? '#6b7280'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Competitors */}
            {activeTab === 'competitors' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Competitor Head-to-Head</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Real probes of your competitors on YOUR queries · trojan opportunities = queries they win and you don&apos;t
                  </p>
                </div>
                {(data.competitors ?? []).length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">
                    No competitor probes yet. Add competitors on the Citation Probe page and re-run. Each rival is probed
                    on the same queries as your brand.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(data.competitors ?? []).map(c => (
                      <div key={c.domain} className="p-4 bg-zinc-950 border border-zinc-800/50 rounded-xl space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-white">{c.brand}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{c.domain}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TREND_BADGE[c.trendStatus] ?? ''}`}>
                              {c.trendStatus === 'single-probe' ? '1 probe' : c.trendStatus}
                              {c.trendStatus !== 'single-probe' && c.trendDelta !== 0 && ` ${c.trendDelta > 0 ? '+' : ''}${c.trendDelta}pp`}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-mono">
                            <span className="text-zinc-400">them <span className="text-white font-bold">{c.latestRate}%</span></span>
                            <span className="text-emerald-400">you win {c.wins}</span>
                            <span className="text-rose-400">they win {c.losses}</span>
                          </div>
                        </div>
                        {c.trojanQueries.length > 0 && (
                          <div className="pt-2 border-t border-zinc-800/50">
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1.5">
                              Trojan opportunities: they&apos;re cited, you&apos;re not
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {c.trojanQueries.slice(0, 6).map(q => (
                                <span key={q} className="px-2 py-1 bg-amber-500/5 border border-amber-500/20 rounded text-[10px] text-amber-300/90">
                                  {q}
                                </span>
                              ))}
                              {c.trojanQueries.length > 6 && (
                                <span className="px-2 py-1 text-[10px] text-zinc-500">+{c.trojanQueries.length - 6} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Drift Alerts */}
            {activeTab === 'drift' && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Citation Drift Alerts</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Two-proportion z-test between consecutive probes · |z| &gt; 1.96 = unlikely to be sampling noise
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {(data.driftAlerts ?? []).length} detected
                  </span>
                </div>
                {(data.driftAlerts ?? []).length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">
                    No statistically significant rate changes between your probe runs. Your citation rates are stable.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {(data.driftAlerts ?? []).map((alert, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800/50 rounded-xl">
                        <div className={`shrink-0 w-12 h-10 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${Math.abs(alert.zScore) > 2.58 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          z={alert.zScore > 0 ? '+' : ''}{alert.zScore}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-white">{ENGINE_LABELS[alert.platform] ?? alert.platform}</span>
                          <p className="text-xs text-zinc-500 mt-0.5">{alert.from} → {alert.to}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold font-mono ${alert.deltaPp > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {alert.fromRate}% → {alert.toRate}%
                          </p>
                          <p className="text-[10px] text-zinc-500">{alert.deltaPp > 0 ? '+' : ''}{alert.deltaPp}pp</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content Scores */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Your Content: Real GEO Scores</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Scored autopilot articles, most recent first</p>
                </div>
                {scoredArticles.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">
                    No scored articles yet. Run the content scorer on your autopilot articles to populate this tab.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {scoredArticles.slice(0, 10).map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800/50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{a.topic || 'Untitled'}</p>
                          {a.timestamp && <p className="text-[9px] text-zinc-600 mt-0.5">{new Date(a.timestamp).toLocaleDateString()}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-24 h-1.5 bg-zinc-800 rounded-full">
                            <div
                              className={`h-full rounded-full ${(a.geoScore ?? 0) >= 80 ? 'bg-emerald-500' : (a.geoScore ?? 0) >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${a.geoScore ?? 0}%` }}
                            />
                          </div>
                          <span className={`text-xs font-mono font-bold w-8 text-right ${(a.geoScore ?? 0) >= 80 ? 'text-emerald-400' : (a.geoScore ?? 0) >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {a.geoScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
