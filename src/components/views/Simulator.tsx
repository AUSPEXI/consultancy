import { useState } from 'react';
import { MonitorPlay, Loader2, Bot, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';

export function Simulator() {
  const { tier } = useAuth();
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<any>(null);

  if (tier === 'Free' || tier === 'Basic') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Multi-Engine SOV Simulator</h1>
          <p className="text-zinc-400">Simulate how different LLMs respond to high-intent queries and track your Share of Voice.</p>
        </div>
        <UpgradePrompt 
          title="Simulator Locked" 
          description="Upgrade to the Medium tier to access the Multi-Engine SOV Simulator and see exactly how ChatGPT, Claude, Gemini, and Perplexity view your brand."
          requiredTier="Medium"
        />
      </div>
    );
  }

  const handleSimulate = async () => {
    if (!query.trim() || !brand.trim()) return;
    setIsSimulating(true);
    setResults(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) throw new Error("API key is missing");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        You are an advanced AI simulation engine.
        Simulate how 4 different AI engines (ChatGPT, Claude, Gemini, Perplexity) would answer the following high-intent query: "${query}".
        The brand we are tracking is: "${brand}".
        
        For each engine, write a realistic 2-3 sentence response to the query. 
        Decide randomly if the engine should mention the brand or a competitor. 
        
        Return a JSON object with:
        - chatgpt: { response: string, mentionedBrand: boolean }
        - claude: { response: string, mentionedBrand: boolean }
        - gemini: { response: string, mentionedBrand: boolean }
        - perplexity: { response: string, mentionedBrand: boolean }
        - sovScore: number (0 to 100, based on how many mentioned the brand)
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              chatgpt: { type: Type.OBJECT, properties: { response: { type: Type.STRING }, mentionedBrand: { type: Type.BOOLEAN } } },
              claude: { type: Type.OBJECT, properties: { response: { type: Type.STRING }, mentionedBrand: { type: Type.BOOLEAN } } },
              gemini: { type: Type.OBJECT, properties: { response: { type: Type.STRING }, mentionedBrand: { type: Type.BOOLEAN } } },
              perplexity: { type: Type.OBJECT, properties: { response: { type: Type.STRING }, mentionedBrand: { type: Type.BOOLEAN } } },
              sovScore: { type: Type.NUMBER }
            },
            required: ["chatgpt", "claude", "gemini", "perplexity", "sovScore"]
          }
        }
      });

      setResults(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Error simulating:", error);
      alert("Failed to run simulation. Please try again.");
    } finally {
      setIsSimulating(false);
    }
  };

  const EngineCard = ({ name, data }: { name: string, data: any }) => (
    <div className={`bg-zinc-900 border ${data.mentionedBrand ? 'border-emerald-500/50' : 'border-zinc-800'} rounded-xl p-5 relative overflow-hidden`}>
      {data.mentionedBrand && (
        <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-bl-lg">
          Brand Cited
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <Bot className={`w-5 h-5 ${data.mentionedBrand ? 'text-emerald-400' : 'text-zinc-500'}`} />
        <h3 className="font-semibold text-white">{name}</h3>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">
        {data.response}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2 flex items-center gap-3">
          <MonitorPlay className="w-8 h-8 text-indigo-500" />
          Multi-Engine SOV Simulator
        </h1>
        <p className="text-zinc-400">Test high-intent queries across engines to see if your brand is recommended.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Target Brand</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Auspexi"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">User Query</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Best GEO marketing platform"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <button
          onClick={handleSimulate}
          disabled={isSimulating || !query.trim() || !brand.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSimulating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Running Simulation...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Simulate Engines</>
          )}
        </button>
      </div>

      {results && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Simulated AI Share of Voice (SOV)</h3>
              <p className="text-sm text-zinc-400">Percentage of engines that cited your brand for this query.</p>
            </div>
            <div className="text-4xl font-bold text-indigo-400">
              {results.sovScore}%
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EngineCard name="ChatGPT (OpenAI)" data={results.chatgpt} />
            <EngineCard name="Claude (Anthropic)" data={results.claude} />
            <EngineCard name="Gemini (Google)" data={results.gemini} />
            <EngineCard name="Perplexity" data={results.perplexity} />
          </div>
        </div>
      )}
    </div>
  );
}
