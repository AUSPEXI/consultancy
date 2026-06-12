'use client';
import { useState } from 'react';
import { Activity, Loader2, Target, BarChart3, TrendingUp, Cpu, Network, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { checkTierAccess } from '@/constants/tiers';
import { authFetch } from '@/lib/auth-fetch';

export default function GeoPulsePage() {
  const { tier, role, userData } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [isProbing, setIsProbing] = useState(false);
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [results, setResults] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<Array<{ keyword: string; result: any }>>([]);
  const [error, setError] = useState<string | null>(null);

  const savedKeywords: string[] = userData?.keywords ?? [];

  const isReadOnly = role !== 'admin' && !checkTierAccess(tier, 'Pro');

  const probeSteps = [
    "Accessing Proprietary Data Lake...",
    "Benchmarking against Semantic Anchors...",
    "Analyzing Vector Distribution...",
    "Calculating Share of Voice...",
    "Finalizing Market Vulnerability Insights..."
  ];

  const fetchKeyword = async (kw: string) => {
    const res = await authFetch('/api/geo-pulse', {
      method: 'POST',
      body: JSON.stringify({ keyword: kw }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Scan failed');
    return json.result;
  };

  const runProbe = async () => {
    if (!keyword.trim()) return;
    setIsProbing(true);
    setResults(null);
    setBatchResults([]);
    setError(null);
    setCurrentStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= probeSteps.length) clearInterval(interval);
    }, 500);

    try {
      const result = await fetchKeyword(keyword.trim());
      setResults(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      clearInterval(interval);
      setCurrentStep(-1);
      setIsProbing(false);
    }
  };

  const runBatchScan = async () => {
    if (savedKeywords.length === 0 || isBatchScanning) return;
    setIsBatchScanning(true);
    setResults(null);
    setBatchResults([]);
    setError(null);

    const accumulated: Array<{ keyword: string; result: any }> = [];
    for (const kw of savedKeywords) {
      try {
        const result = await fetchKeyword(kw);
        accumulated.push({ keyword: kw, result });
        setBatchResults([...accumulated]);
      } catch {
        accumulated.push({ keyword: kw, result: null });
        setBatchResults([...accumulated]);
      }
    }
    setIsBatchScanning(false);
  };

  const sentimentColor = (s: string) => {
    if (s === 'Positive') return 'bg-emerald-500/10 text-emerald-400';
    if (s === 'Negative') return 'bg-red-500/10 text-red-400';
    return 'bg-amber-500/10 text-amber-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {isReadOnly && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-200">
            You&apos;re viewing <strong>read-only mode</strong>. Upgrade to <strong>Pro</strong> to run GEO Pulse probes.
          </p>
          <a href="/#pricing" className="text-[11px] font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors shrink-0">
            Upgrade
          </a>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">GEO Pulse Index</h1>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">Beta Test</span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">Scan AI engines for brand mentions across your target queries.</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden p-6">
        {/* Input Section */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Target Keyword / Intent</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isProbing && runProbe()}
              placeholder="e.g., 'Best enterprise CRM software'"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              disabled={isProbing || isBatchScanning}
            />
            <button
              onClick={runProbe}
              disabled={isReadOnly || isProbing || isBatchScanning || !keyword.trim()}
              title={isReadOnly ? 'Upgrade to Pro to run probes' : undefined}
              className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isProbing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  Scan
                </>
              )}
            </button>
          </div>

          {/* Saved keyword chips */}
          {savedKeywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-zinc-500 shrink-0">Saved:</span>
              {savedKeywords.map((kw) => (
                <button
                  key={kw}
                  onClick={() => { setKeyword(kw); setResults(null); setBatchResults([]); }}
                  disabled={isProbing || isBatchScanning}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 hover:bg-pink-600/20 hover:text-pink-300 text-zinc-400 border border-zinc-700 hover:border-pink-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {kw}
                </button>
              ))}
              <button
                onClick={runBatchScan}
                disabled={isReadOnly || isProbing || isBatchScanning}
                title={isReadOnly ? 'Upgrade to Pro to run probes' : undefined}
                className="ml-auto px-3 py-1 rounded-full text-xs font-semibold bg-pink-600/20 hover:bg-pink-600/40 text-pink-400 border border-pink-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isBatchScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                Scan All
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isProbing && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-pink-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
              <Network className="absolute inset-0 m-auto w-6 h-6 text-pink-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Querying Proprietary Data Lake</h3>
            <div className="space-y-2 mt-4 max-w-xs mx-auto text-left">
              {probeSteps.map((step, i) => (
                <div key={i} className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-all duration-300 ${i < currentStep ? 'text-emerald-500' : i === currentStep ? 'text-pink-500' : 'text-zinc-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${i < currentStep ? 'bg-emerald-500' : i === currentStep ? 'bg-pink-500 animate-pulse' : 'bg-zinc-800'}`} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Batch scanning progress */}
        {isBatchScanning && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-4" />
            <p className="text-sm text-zinc-400">Scanning {batchResults.length + 1} of {savedKeywords.length} keywords…</p>
            {batchResults.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {batchResults.map(({ keyword: kw, result }) => (
                  <span key={kw} className={`px-2 py-1 rounded-full text-xs font-medium ${result ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Batch results table */}
        {!isBatchScanning && batchResults.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-700">
            <h3 className="text-base font-semibold text-white border-b border-zinc-800 pb-2">Batch Scan Results: {batchResults.length} Keywords</h3>
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950">
                    <th className="text-left px-4 py-3 text-zinc-400 font-medium">Keyword</th>
                    <th className="text-left px-4 py-3 text-zinc-400 font-medium">Agg. SoV</th>
                    <th className="text-left px-4 py-3 text-zinc-400 font-medium">Signals</th>
                    <th className="text-left px-4 py-3 text-zinc-400 font-medium">Sentiment</th>
                    <th className="text-left px-4 py-3 text-zinc-400 font-medium hidden md:table-cell">Top Insight</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map(({ keyword: kw, result }) => (
                    <tr
                      key={kw}
                      onClick={() => result && (setKeyword(kw), setResults(result), setBatchResults([]))}
                      className="border-b border-zinc-800/50 hover:bg-zinc-900/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-200">{kw}</td>
                      {result ? (
                        <>
                          <td className="px-4 py-3 text-white font-bold">{result.aggregateSov}%</td>
                          <td className="px-4 py-3 text-zinc-300">{result.totalSignals.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${result.overallSentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-400' : result.overallSentiment === 'Negative' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {result.overallSentiment}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs hidden md:table-cell max-w-xs truncate">
                            {result.insights?.[0] ?? 'N/A'}
                          </td>
                        </>
                      ) : (
                        <td colSpan={4} className="px-4 py-3 text-red-400 text-xs">Scan failed</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-zinc-500">Click any row to drill into that keyword's full analysis.</p>
          </div>
        )}

        {/* Error */}
        {error && !isProbing && (
          <div className="py-8 text-center text-red-400 text-sm">{error}</div>
        )}

        {/* Results */}
        {results && !isProbing && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            {/* Aggregate */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">Aggregate SoV</span>
                </div>
                <div className="text-3xl font-bold text-white">{results.aggregateSov}%</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">Data Signals</span>
                </div>
                <div className="text-3xl font-bold text-white">{results.totalSignals.toLocaleString()}</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <TrendingUp className={`w-4 h-4 ${results.overallSentiment === 'Positive' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className={`text-sm font-medium ${results.overallSentiment === 'Positive' ? 'text-emerald-400' : 'text-amber-400'}`}>Overall Sentiment</span>
                </div>
                <div className={`text-3xl font-bold ${results.overallSentiment === 'Positive' ? 'text-emerald-400' : results.overallSentiment === 'Negative' ? 'text-red-400' : 'text-amber-400'}`}>
                  {results.overallSentiment}
                </div>
              </div>
            </div>

            {/* Model Breakdown */}
            <div>
              <h3 className="text-base font-semibold text-white mb-4">Model Specific Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {results.models.map((model: any, i: number) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-pink-400" />
                        <span className="font-semibold text-white text-sm">{model.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${sentimentColor(model.sentiment)}`}>
                        {model.sentiment}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-zinc-400 flex justify-between">
                        <span>Share of Voice:</span>
                        <span className="text-white font-medium">{model.sov}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${Math.min(model.sov, 100)}%` }} />
                      </div>
                      <div className="text-sm text-zinc-400 flex justify-between">
                        <span>Trend:</span>
                        <span className={model.trend.startsWith('+') ? 'text-emerald-400' : 'text-amber-400'}>{model.trend}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vulnerability Report */}
            <div>
              <h3 className="text-base font-semibold text-white mb-4 border-b border-zinc-800 pb-2">Market Vulnerability Insights</h3>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                {results.insights.map((insight: string, i: number) => (
                  <div key={i} className="flex gap-3 text-sm text-zinc-300">
                    <div className="mt-1 shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div></div>
                    <p>{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
