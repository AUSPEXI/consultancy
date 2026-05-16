import { useState } from 'react';
import { Activity, Play, Loader2, Target, BarChart3, TrendingUp, Cpu, Network } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { checkTierAccess } from '@/constants/tiers';

export function GeoPulse() {
  const { tier, role } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [isProbing, setIsProbing] = useState(false);
  const [results, setResults] = useState<any>(null);

  if (role !== 'admin' && !checkTierAccess(tier, 'Premium')) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-heading">GEO Pulse Index</h1>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">Beta Test</span>
          </div>
          <p className="text-zinc-400">First-Party Data Analytics. Aggregates Search Intent, Public Data, and User Behavior to extract legal "Share of Voice" (SoV).</p>
        </div>
        <UpgradePrompt 
          title="GEO Pulse Index Locked" 
          description="Upgrade to the Premium tier to access real-time brand sentiment benchmarking using our proprietary, compliant data lake."
          requiredTier="Premium"
        />
      </div>
    );
  }

  const runProbe = () => {
    if (!keyword.trim()) return;
    setIsProbing(true);
    setResults(null);
    setCurrentStep(0);
    
    // Simulate steps
    const steps = [
      "Accessing Proprietary Data Lake...",
      "Benchmarking against Semantic Anchors...",
      "Analyzing Vector Distribution...",
      "Calculating Share of Voice...",
      "Finalizing Market Vulnerability Insights..."
    ];
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= steps.length) clearInterval(interval);
    }, 600);

    // Simulate API calls to LLMs
    setTimeout(() => {
      setResults({
        keyword,
        models: [
          { name: 'GPT-4o', sov: 35, sentiment: 'Positive', trend: '+5%' },
          { name: 'Gemini Pro', sov: 42, sentiment: 'Neutral', trend: '-2%' },
          { name: 'Claude 3.5', sov: 28, sentiment: 'Positive', trend: '+12%' }
        ],
        aggregateSov: 35,
        insights: [
          "Your brand is frequently mentioned alongside 'reliability' in GPT-4 outputs.",
          "Claude 3.5 associates your brand with 'innovation' but lacks recent product data.",
          "Gemini Pro favors your competitor for 'cost-effectiveness' queries."
        ]
      });
      setIsProbing(false);
      setCurrentStep(-1);
    }, 3500);
  };

  const [currentStep, setCurrentStep] = useState(-1);
  const probeSteps = [
    "Accessing Proprietary Data Lake...",
    "Benchmarking against Semantic Anchors...",
    "Analyzing Vector Distribution...",
    "Calculating Share of Voice...",
    "Finalizing Market Vulnerability Insights..."
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">GEO Pulse Index</h1>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">Beta Test</span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">Legitimate First-Party Brand Sentiment Aggregator.</p>
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
              placeholder="e.g., 'Best enterprise CRM software'"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              disabled={isProbing}
            />
            <button 
              onClick={runProbe}
              disabled={isProbing || !keyword.trim()}
              className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isProbing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Data...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  Scan
                </>
              )}
            </button>
          </div>
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

            <p className="text-sm text-zinc-500 mt-8 max-w-md mx-auto">
              Aggregating first-party search intent patterns and mapping vector distributions against your Semantic Anchors.
            </p>
          </div>
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
                  <span className="text-sm font-medium">Total Responses</span>
                </div>
                <div className="text-3xl font-bold text-white">150</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Position Drift</span>
                </div>
                <div className="text-3xl font-bold text-emerald-400">+4.2%</div>
              </div>
            </div>

            {/* Model Breakdown */}
            <div>
              <h3 className="text-base font-semibold text-white mb-4">Model Specific Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.models.map((model: any, i: number) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-pink-400" />
                        <span className="font-semibold text-white">{model.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${model.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {model.sentiment}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-zinc-400 flex justify-between">
                        <span>Share of Voice:</span>
                        <span className="text-white font-medium">{model.sov}%</span>
                      </div>
                      <div className="text-sm text-zinc-400 flex justify-between">
                        <span>Trend (30d):</span>
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
                    <div className="mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div></div>
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
