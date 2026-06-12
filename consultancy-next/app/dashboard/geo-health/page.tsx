'use client';

import { useState } from 'react';
import { Search, Shield, Globe, ExternalLink, CheckCircle2, XCircle, AlertCircle, Loader2, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth-fetch';

// ── Types ──────────────────────────────────────────────────────────────────────

interface BingResult {
  indexed: boolean;
  estimatedPages: number | null;
  topResult: string | null;
  checkedAt: string;
}

interface EntitySource {
  name: string;
  found: boolean;
  url: string | null;
  note: string | null;
}

interface EntityResult {
  brand: string;
  domain: string;
  sources: EntitySource[];
  sameAsLinks: string[];
  sameAsGaps: string[];
  score: number;
  recommendations: string[];
  auditedAt: string;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ found }: { found: boolean }) {
  return found
    ? <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />Found</span>
    : <span className="inline-flex items-center gap-1 text-pink-400 text-xs font-semibold"><XCircle className="w-3.5 h-3.5" />Missing</span>;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e';
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={40} cy={40} r={r} fill="none" stroke="#27272a" strokeWidth={8} />
        <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform="rotate(-90 40 40)" />
        <text x={40} y={45} textAnchor="middle" fontSize={14} fontWeight="bold" fill="white">{score}</text>
      </svg>
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Entity Score</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function GeoHealthPage() {
  const { userData } = useAuth();

  const [domain, setDomain] = useState(userData?.domain || '');
  const [brand, setBrand] = useState(userData?.brand || '');
  const [urls, setUrls] = useState('');

  const [bingResult, setBingResult] = useState<BingResult | null>(null);
  const [bingLoading, setBingLoading] = useState(false);
  const [bingError, setBingError] = useState('');

  const [entityResult, setEntityResult] = useState<EntityResult | null>(null);
  const [entityLoading, setEntityLoading] = useState(false);
  const [entityError, setEntityError] = useState('');

  const [indexNowResult, setIndexNowResult] = useState<{ success: boolean; message: string; keyLocation: string; indexNowKey?: string; keyFileLive?: boolean } | null>(null);
  const [indexNowLoading, setIndexNowLoading] = useState(false);

  // Lets the user download the exact verification file IndexNow expects —
  // no copy-pasting keys by hand.
  const downloadKeyFile = (key: string) => {
    const blob = new Blob([key], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${key}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const checkBing = async () => {
    if (!domain) return;
    setBingLoading(true);
    setBingError('');
    setBingResult(null);
    try {
      const r = await authFetch(`/api/bing-index?domain=${encodeURIComponent(domain)}`);
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Check failed');
      setBingResult(d);
    } catch (e: any) {
      setBingError(e.message);
    } finally {
      setBingLoading(false);
    }
  };

  const pushIndexNow = async () => {
    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
    if (!domain || urlList.length === 0) return;
    setIndexNowLoading(true);
    try {
      const r = await authFetch('/api/bing-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, urls: urlList }),
      });
      const d = await r.json();
      setIndexNowResult(d);
    } catch (e: any) {
      setIndexNowResult({ success: false, message: e.message, keyLocation: '' });
    } finally {
      setIndexNowLoading(false);
    }
  };

  const runEntityAudit = async () => {
    if (!brand || !domain) return;
    setEntityLoading(true);
    setEntityError('');
    setEntityResult(null);
    try {
      const r = await authFetch('/api/entity-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, domain }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Audit failed');
      setEntityResult(d);
    } catch (e: any) {
      setEntityError(e.message);
    } finally {
      setEntityLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">GEO Health</h1>
        <p className="text-sm text-zinc-400 mt-1">
          ChatGPT search runs on Bing. AI models draw on Wikidata, Wikipedia, and Crunchbase for entity knowledge.
          Both need to know you exist before they can cite you.
        </p>
      </div>

      {/* Shared inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Brand name</label>
          <input
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder="L8EntSpace"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Domain</label>
          <input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="l8entspace.com"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40"
          />
        </div>
      </div>

      {/* ── Bing Indexation ─────────────────────────────────────────────────── */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-5 h-5 text-pink-400" />
          <h2 className="text-base font-semibold text-white">Bing Indexation Check</h2>
          <span className="ml-auto text-[10px] font-bold text-zinc-600 uppercase tracking-widest">ChatGPT runs on Bing</span>
        </div>
        <p className="text-xs text-zinc-400">
          If your domain is not indexed on Bing, ChatGPT-with-search cannot find it, regardless of how good your content is.
        </p>

        <button
          onClick={checkBing}
          disabled={bingLoading || !domain}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {bingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Check Bing Indexation
        </button>

        {bingError && <p className="text-sm text-pink-400">{bingError}</p>}

        {bingResult && (
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${bingResult.indexed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-pink-500/10 border-pink-500/20'}`}>
              {bingResult.indexed
                ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                : <XCircle className="w-6 h-6 text-pink-400 shrink-0" />}
              <div>
                <p className={`text-sm font-semibold ${bingResult.indexed ? 'text-emerald-300' : 'text-pink-300'}`}>
                  {bingResult.indexed ? `Indexed on Bing` : 'Not indexed on Bing'}
                </p>
                {bingResult.estimatedPages != null && (
                  <p className="text-xs text-zinc-400">~{bingResult.estimatedPages.toLocaleString()} pages indexed</p>
                )}
                {bingResult.topResult && (
                  <a href={bingResult.topResult} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mt-0.5">
                    <ExternalLink className="w-3 h-3" /> Top result: {bingResult.topResult.slice(0, 60)}…
                  </a>
                )}
              </div>
            </div>

            {!bingResult.indexed && (
              <div className="text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-1">
                <p className="font-semibold text-zinc-300">How to fix this:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Submit your sitemap in <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">Bing Webmaster Tools</a></li>
                  <li>Use IndexNow below to push your key pages directly</li>
                  <li>Add inbound links from already-indexed domains</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── IndexNow Push ─────────────────────────────────────────────────────── */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-white">IndexNow Push</h2>
        </div>
        <p className="text-xs text-zinc-400">
          Push URLs directly to Bing (and Yandex) for immediate crawl. Works best for new or updated pages.
          After first use, a key file must be hosted at the displayed URL to verify ownership.
        </p>
        <textarea
          value={urls}
          onChange={e => setUrls(e.target.value)}
          placeholder={`https://${domain || 'yourdomain.com'}/page-1\nhttps://${domain || 'yourdomain.com'}/page-2`}
          rows={4}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-mono resize-none"
        />
        <button
          onClick={pushIndexNow}
          disabled={indexNowLoading || !domain || !urls.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {indexNowLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Push to Bing via IndexNow
        </button>

        {indexNowResult && (
          <div className={`text-sm p-4 rounded-lg border ${indexNowResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-pink-500/10 border-pink-500/20 text-pink-300'}`}>
            <p className="font-semibold">{indexNowResult.success ? '✓ ' : '✗ '}{indexNowResult.message}</p>
            {indexNowResult.keyFileLive === true && (
              <p className="text-xs text-emerald-300 mt-2">✓ Domain ownership verified. Your key file is live. Bing will process these URLs; nothing else to do.</p>
            )}
            {indexNowResult.keyFileLive === false && indexNowResult.indexNowKey && (
              <div className="mt-3 bg-zinc-950 border border-amber-500/30 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-amber-300">⚠ One-time setup needed: Bing will ignore these URLs until it can verify you own {domain}:</p>
                <ol className="text-xs text-zinc-300 space-y-1.5 list-decimal pl-4">
                  <li>
                    <button onClick={() => downloadKeyFile(indexNowResult.indexNowKey!)} className="text-pink-400 underline hover:text-pink-300 font-semibold">
                      Download your key file
                    </button>{' '}
                    (a tiny .txt file; we&apos;ve filled it in for you)
                  </li>
                  <li>Upload it to the top level of your website, so it appears at <code className="text-zinc-400 bg-zinc-900 px-1 rounded break-all">{indexNowResult.keyLocation}</code></li>
                  <li>Push again: we re-check automatically and this notice turns green</li>
                </ol>
                <p className="text-[11px] text-zinc-500">On WordPress use a file-manager plugin; on Netlify/Vercel drop it in your <code className="bg-zinc-900 px-1 rounded">public/</code> folder. It&apos;s safe to leave there forever.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Entity Grounding Audit ───────────────────────────────────────────── */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-semibold text-white">Entity Grounding Audit</h2>
        </div>
        <p className="text-xs text-zinc-400">
          AI models resolve brand identity through structured knowledge sources. Missing entries mean the model
          treats your brand as an unknown entity, reducing citation probability even when your content is excellent.
        </p>

        <button
          onClick={runEntityAudit}
          disabled={entityLoading || !brand || !domain}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {entityLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          Run Entity Audit
        </button>

        {entityError && <p className="text-sm text-pink-400">{entityError}</p>}

        {entityResult && (
          <div className="space-y-5">
            <div className="flex items-center gap-6">
              <ScoreRing score={entityResult.score} />
              <div className="flex-1">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Knowledge sources</p>
                <div className="space-y-2">
                  {entityResult.sources.map(src => (
                    <div key={src.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusBadge found={src.found} />
                        <span className="text-sm text-zinc-300">{src.name}</span>
                      </div>
                      <div className="text-right">
                        {src.url && (
                          <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> View
                          </a>
                        )}
                        {!src.found && src.note && <p className="text-xs text-zinc-600">{src.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {entityResult.sameAsLinks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">sameAs links in your schema</p>
                <div className="flex flex-wrap gap-2">
                  {entityResult.sameAsLinks.map(link => (
                    <a key={link} href={link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 hover:text-white">
                      <Globe className="w-3 h-3" />{new URL(link).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {entityResult.sameAsGaps.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-xs font-semibold text-amber-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> sameAs gaps detected
                </p>
                <p className="text-xs text-zinc-400 mb-2">These entity URLs were found but are NOT linked from your schema markup:</p>
                <div className="space-y-1">
                  {entityResult.sameAsGaps.map(url => (
                    <code key={url} className="block text-xs text-amber-300 bg-zinc-900 px-2 py-1 rounded">{url}</code>
                  ))}
                </div>
              </div>
            )}

            {entityResult.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Recommendations</p>
                {entityResult.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
