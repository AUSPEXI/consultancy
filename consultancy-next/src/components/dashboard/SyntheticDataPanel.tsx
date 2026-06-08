'use client';

import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { Database, TrendingUp, Zap, ShieldAlert, BarChart3, ChevronDown } from 'lucide-react';
import { useGeoData } from '@/hooks/useGeoData';

const BRAND_COLORS: Record<string, string> = {
  AcmeCloud: '#ff1493',
  ClearSignal: '#8b5cf6',
  ContentEdge: '#06b6d4',
  DataPulse: '#10b981',
  NexusSEO: '#f59e0b',
  OmniSearch: '#3b82f6',
  TrustLayer: '#ef4444',
  VantageAI: '#a78bfa',
};

const ENGINE_COLORS: Record<string, string> = {
  ChatGPT: '#10b981',
  Claude: '#f59e0b',
  'Google AI': '#3b82f6',
  Perplexity: '#ff1493',
};

const DECAY_BADGE: Record<string, string> = {
  healthy: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  decaying: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  stale: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

type Tab = 'sov' | 'competitors' | 'platforms' | 'drift' | 'content';

interface Props {
  realPlatformRates?: Record<string, number | null> | null;
  realArticles?: { id: string; topic?: string; geoScore?: number; timestamp?: string }[];
  userBrand?: string;
}

export function SyntheticDataPanel({ realPlatformRates, realArticles = [], userBrand = 'Your Brand' }: Props) {
  const { data, loading, error } = useGeoData();
  const [activeTab, setActiveTab] = useState<Tab>('sov');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');

  if (error) return null;

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Database className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AetherGen Synthetic Dataset</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">10,000 rows · 40 fields · nearest-neighbour synthesis</p>
          </div>
        </div>
        {data && (
          <div className="flex gap-4 text-center">
            {[
              { label: 'Citation Rate', value: `${data.stats.citation_rate}%` },
              { label: 'Avg SOV', value: `${data.stats.avg_sov}` },
              { label: 'Drift Events', value: data.stats.drift_count.toLocaleString() },
              { label: 'Trojan Ops', value: data.stats.trojan_count.toLocaleString() },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xs font-bold text-white">{loading ? '—' : s.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto">
        {([
          ['sov', 'SOV Trends', TrendingUp],
          ['platforms', 'Platform Scores', BarChart3],
          ['competitors', 'Competitor Decay', ShieldAlert],
          ['drift', 'Drift Alerts', Zap],
          ['content', 'Content Scoring', Database],
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
            <span className="text-sm">Loading dataset...</span>
          </div>
        )}

        {!loading && data && (
          <>
            {/* SOV Trends */}
            {activeTab === 'sov' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Share of Voice — 18-Month Trend</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Monthly avg SOV per brand across all 4 AI engines</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.brands.map(br => (
                      <div key={br} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAND_COLORS[br] || '#6b7280' }} />
                        <span className="text-[10px] text-zinc-400">{br}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={data.sovTimeSeries} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="month" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                        labelStyle={{ color: '#a1a1aa', fontSize: 11 }}
                        itemStyle={{ fontSize: 11 }}
                      />
                      {data.brands.map(br => (
                        <Line
                          key={br}
                          type="monotone"
                          dataKey={br}
                          stroke={BRAND_COLORS[br] || '#6b7280'}
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* SOV by brand bar */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Average SOV by Brand</h4>
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={data.sovByBrand} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="brand" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} itemStyle={{ fontSize: 11 }} />
                        <Bar dataKey="sov" radius={[4, 4, 0, 0]}>
                          {data.sovByBrand.map(entry => (
                            <Cell key={entry.brand} fill={BRAND_COLORS[entry.brand] || '#ff1493'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Platform Scores */}
            {activeTab === 'platforms' && (
              <div className="space-y-6">
                {/* Real data callout when available */}
                {realPlatformRates && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Your Brand — Real Citation Rates</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { key: 'chatgpt', label: 'ChatGPT', color: ENGINE_COLORS['ChatGPT'] },
                        { key: 'perplexity', label: 'Perplexity', color: ENGINE_COLORS['Perplexity'] },
                        { key: 'gemini', label: 'Google AI', color: ENGINE_COLORS['Google AI'] },
                        { key: 'claude', label: 'Claude', color: ENGINE_COLORS['Claude'] },
                      ].map(({ key, label, color }) => {
                        const rate = realPlatformRates[key];
                        const pct = rate !== null && rate !== undefined ? Math.round(rate * 100) : null;
                        return (
                          <div key={key} className="flex flex-col items-center gap-1 p-2 bg-zinc-900/60 rounded-lg border border-zinc-800">
                            <span className="text-lg font-black" style={{ color: pct !== null ? color : '#3f3f46' }}>
                              {pct !== null ? `${pct}%` : '—'}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-zinc-600 mt-2">From your most recent Citation Probe run · benchmark against synthetic industry data below</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Platform SOV by Brand</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">ChatGPT / Perplexity / Claude / Google AI share per brand · synthetic benchmark</p>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                    <select
                      value={selectedBrand}
                      onChange={e => setSelectedBrand(e.target.value)}
                      className="bg-transparent text-xs text-zinc-300 outline-none"
                    >
                      <option value="All">All Brands</option>
                      {data.brands.map(br => <option key={br} value={br}>{br}</option>)}
                    </select>
                    <ChevronDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </div>

                {/* Radar for selected brand */}
                {selectedBrand !== 'All' && (() => {
                  const b = data.platformByBrand.find(p => p.brand === selectedBrand);
                  if (!b) return null;
                  const radarData = [
                    { subject: 'ChatGPT', value: b.ChatGPT },
                    { subject: 'Perplexity', value: b.Perplexity },
                    { subject: 'Claude', value: b.Claude },
                    { subject: 'Google AI', value: b.Gemini },
                  ];
                  return (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#27272a" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                          <Radar dataKey="value" stroke="#ff1493" fill="#ff1493" fillOpacity={0.2} strokeWidth={2} />
                          <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}

                {/* Grouped bar for all brands */}
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                      data={selectedBrand === 'All' ? data.platformByBrand : data.platformByBrand.filter(p => p.brand === selectedBrand)}
                      margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="brand" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                      {['ChatGPT', 'Perplexity', 'Claude', 'Google AI'].map(p => (
                        <Bar key={p} dataKey={p} fill={ENGINE_COLORS[p]} radius={[2, 2, 0, 0]} maxBarSize={18} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 flex-wrap">
                  {['ChatGPT', 'Perplexity', 'Claude', 'Google AI'].map(p => (
                    <div key={p} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ENGINE_COLORS[p] }} />
                      <span className="text-[10px] text-zinc-400">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competitor Decay */}
            {activeTab === 'competitors' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Competitor Decay Analysis</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">7 competitors · sorted by decay score descending</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {['Competitor', 'Avg SOV', 'Decay Score', 'Status', 'Trojan Opp'].map(h => (
                          <th key={h} className="pb-3 pr-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {data.competitors.map(c => (
                        <tr key={c.name} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="py-3 pr-4 font-medium text-white text-sm">{c.name}</td>
                          <td className="py-3 pr-4 text-zinc-300 font-mono text-xs">{c.avg_sov}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full max-w-[80px]">
                                <div
                                  className={`h-full rounded-full ${c.avg_decay > 70 ? 'bg-rose-500' : c.avg_decay > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${c.avg_decay}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-zinc-400">{c.avg_decay}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${DECAY_BADGE[c.decay_status] || ''}`}>
                              {c.decay_status}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${c.trojan_pct > 15 ? 'bg-rose-400' : 'bg-zinc-600'}`} />
                              <span className={`text-xs font-mono ${c.trojan_pct > 15 ? 'text-rose-400' : 'text-zinc-500'}`}>{c.trojan_pct}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Citation rate by engine mini chart */}
                <div className="pt-4 border-t border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Citation Rate by AI Engine</h4>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={data.citationByEngine} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="engine" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} formatter={(v) => [`${v}%`, 'Citation Rate']} />
                        <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                          {data.citationByEngine.map(e => (
                            <Cell key={e.engine} fill={ENGINE_COLORS[e.engine] || '#6b7280'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Drift Alerts */}
            {activeTab === 'drift' && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Sentiment Drift Alerts</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Top 25 events · |z-score| &gt; 2 · sorted by magnitude</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {data.stats.drift_count.toLocaleString()} total
                  </span>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {data.driftAlerts.map((alert, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-colors">
                      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${Math.abs(alert.z_score) > 2.5 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {alert.z_score > 0 ? '+' : ''}{alert.z_score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{alert.brand}</span>
                          <span className="text-[10px] text-zinc-500">via {alert.ai_engine}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{alert.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-bold ${alert.sentiment === 'Positive' ? 'text-emerald-400' : alert.sentiment === 'Negative' ? 'text-rose-400' : 'text-amber-400'}`}>
                          {alert.sentiment}
                        </p>
                        <p className="text-[10px] text-zinc-500">risk {alert.risk_score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Scoring */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                {/* Real scored articles when available */}
                {realArticles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Your Scored Articles — Real GEO Scores</p>
                    {realArticles.filter(a => a.geoScore != null).slice(0, 5).map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800/50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{a.topic || 'Untitled'}</p>
                          {a.timestamp && <p className="text-[9px] text-zinc-600 mt-0.5">{new Date(a.timestamp).toLocaleDateString()}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-20 h-1.5 bg-zinc-800 rounded-full">
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
                    {realArticles.filter(a => a.geoScore != null).length === 0 && (
                      <p className="text-xs text-zinc-500 py-2">Run content scorer on your autopilot articles to see real scores here.</p>
                    )}
                    <div className="border-t border-zinc-800 pt-4">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Industry Benchmark — Synthetic Reference</p>
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold text-white">Content Score Breakdown by Brand</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">5 dimensions · averaged across all content types · synthetic benchmark</p>
                </div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={data.contentScores} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="brand" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                      <Bar dataKey="content_score" name="Content" fill="#ff1493" radius={[2, 2, 0, 0]} maxBarSize={14} />
                      <Bar dataKey="entity_density" name="Entity Density" fill="#8b5cf6" radius={[2, 2, 0, 0]} maxBarSize={14} />
                      <Bar dataKey="statistical_anchors" name="Stat Anchors" fill="#06b6d4" radius={[2, 2, 0, 0]} maxBarSize={14} />
                      <Bar dataKey="inverted_pyramid" name="Inv. Pyramid" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={14} />
                      <Bar dataKey="entropy" name="Entropy" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 flex-wrap">
                  {[['Content', '#ff1493'], ['Entity Density', '#8b5cf6'], ['Stat Anchors', '#06b6d4'], ['Inv. Pyramid', '#10b981'], ['Entropy', '#f59e0b']].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                      <span className="text-[10px] text-zinc-400">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Top brand table */}
                <div className="pt-4 border-t border-zinc-800">
                  <div className="space-y-2">
                    {data.contentScores.map(c => (
                      <div key={c.brand} className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400 w-24 shrink-0">{c.brand}</span>
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full">
                          <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${c.content_score}%` }} />
                        </div>
                        <span className="text-xs font-mono text-zinc-400 w-8 text-right">{c.content_score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
