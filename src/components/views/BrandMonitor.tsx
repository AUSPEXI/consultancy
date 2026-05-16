import { useState } from 'react';
import { Radar, Loader2, AlertOctagon, MessageSquare, TrendingDown } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';

export function BrandMonitor() {
  const { tier } = useAuth();
  const [brand, setBrand] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [results, setResults] = useState<any>(null);

  if (tier === 'Free' || tier === 'Basic') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Consensus Platform Monitor</h1>
          <p className="text-zinc-400">Defensive GEO: Monitor Reddit, Quora, and forums to prevent AI context poisoning.</p>
        </div>
        <UpgradePrompt 
          title="Brand Monitor Locked" 
          description="Upgrade to the Medium tier to access the Consensus Platform Monitor and detect negative sentiment before it trains the next LLM."
          requiredTier="Medium"
        />
      </div>
    );
  }

  const handleMonitor = async () => {
    if (!brand.trim()) return;
    setIsMonitoring(true);
    setResults(null);

    try {
      // 1. Search Exa for Reddit/Quora mentions
      const exaRes = await fetch('/api/exa-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `"${brand}" site:reddit.com OR site:quora.com`, numResults: 5 })
      });
      const exaData = await exaRes.json();
      
      if (!exaData.success) throw new Error(exaData.error);

      const context = exaData.results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nText: ${r.text}`).join("\n\n");

      // 2. Analyze sentiment with Gemini
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) throw new Error("API key is missing");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        You are a Defensive GEO Analyst.
        Analyze the following search results from Reddit and Quora regarding the brand: "${brand}".
        
        Context:
        ${context}
        
        Determine the overall sentiment and identify any "Context Poisoning Risks" (negative narratives that could be absorbed by LLMs).
        
        Return a JSON object with:
        - overallSentiment: "Positive", "Neutral", or "Negative"
        - riskScore: number (0-100, higher means more risk of AI context poisoning)
        - threads: array of objects { title: string, url: string, sentiment: "Positive" | "Neutral" | "Negative", summary: string }
        - actionPlan: string (what the brand should do to inject positive counter-narratives)
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallSentiment: { type: Type.STRING },
              riskScore: { type: Type.NUMBER },
              threads: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { 
                    title: { type: Type.STRING }, 
                    url: { type: Type.STRING }, 
                    sentiment: { type: Type.STRING }, 
                    summary: { type: Type.STRING } 
                  } 
                } 
              },
              actionPlan: { type: Type.STRING }
            },
            required: ["overallSentiment", "riskScore", "threads", "actionPlan"]
          }
        }
      });

      setResults(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Error monitoring brand:", error);
      alert("Failed to run monitor. Please try again.");
    } finally {
      setIsMonitoring(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'Positive') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (sentiment === 'Negative') return 'text-red-400 bg-red-400/10 border-red-400/20';
    return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2 flex items-center gap-3">
          <Radar className="w-8 h-8 text-indigo-500" />
          Consensus Platform Monitor
        </h1>
        <p className="text-zinc-400">Scan Reddit and Quora to detect "Context Poisoning" before the next LLM training run.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Enter brand name to monitor..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleMonitor}
            disabled={isMonitoring || !brand.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
            <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-6">
              <h3 className="text-sm font-medium text-indigo-300 mb-3">Defensive Action Plan</h3>
              <p className="text-sm text-indigo-100/80 leading-relaxed">
                {results.actionPlan}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Consensus Threads</h3>
            {results.threads.map((thread: any, i: number) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <a href={thread.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 font-medium line-clamp-1">
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
              </div>
            ))}
            {results.threads.length === 0 && (
              <div className="text-zinc-500 text-center py-8">No recent threads found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
