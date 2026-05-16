import { useState, useEffect } from 'react';
import { Radar, ArrowRight, ShieldAlert, Plus, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface Competitor {
  id: string;
  name: string;
  decayStatus: 'healthy' | 'decaying' | 'stale';
  trojanHorseOpportunity: boolean;
  lastUpdated: string;
}

export function Competitors() {
  const { user, tier } = useAuth();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!user || tier === 'Free' || tier === 'Basic') return;

    const q = query(
      collection(db, 'competitors'),
      where('userId', '==', user.uid),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const compData: Competitor[] = [];
      snapshot.forEach((doc) => {
        compData.push({ id: doc.id, ...doc.data() } as Competitor);
      });
      setCompetitors(compData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'competitors');
    });

    return () => unsubscribe();
  }, [user, tier]);

  if (tier === 'Free' || tier === 'Basic') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Competitor Decay Tracking</h1>
          <p className="text-zinc-400">Monitor your rivals for outdated AI citations and inject your own 'Trojan Horse' facts.</p>
        </div>
        <UpgradePrompt 
          title="Competitor Tracking Locked" 
          description="Upgrade to the Medium tier to automatically monitor your competitors for signs of data decay in AI responses, alerting you to Trojan Horse opportunities."
          requiredTier="Medium"
        />
      </div>
    );
  }

  const handleAnalyzeCompetitor = async () => {
    if (!inputUrl.trim() || !user) return;

    setIsAnalyzing(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) {
        throw new Error("API key is missing");
      }
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        You are an expert Generative Engine Optimization (GEO) agent.
        Analyze the competitor at the following URL: ${inputUrl}
        
        Determine if their content is showing signs of "Data Decay" (outdated information, broken links, lack of recent updates).
        Also determine if there is a "Trojan Horse Opportunity" (a gap where we can inject our own high-entropy facts to steal their AI citations).
        
        Return ONLY a JSON object with:
        - 'name' (string): The name of the competitor or website.
        - 'decayStatus' (string): Must be one of: "healthy", "decaying", or "stale".
        - 'trojanHorseOpportunity' (boolean): True if there is a gap we can exploit.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const analysis = JSON.parse(response.text || "{}");
      
      if (analysis) {
        let hostname = inputUrl;
        try {
          hostname = new URL(inputUrl).hostname;
        } catch (e) {
          // Fallback to raw input if not a valid URL object
        }

        await addDoc(collection(db, 'competitors'), {
          userId: user.uid,
          name: analysis.name || hostname,
          decayStatus: analysis.decayStatus || 'healthy',
          trojanHorseOpportunity: analysis.trojanHorseOpportunity || false,
          lastUpdated: new Date().toISOString().split('T')[0],
        });
        setIsModalOpen(false);
        setInputUrl('');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'competitors');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const trojanOpportunities = competitors.filter(c => c.trojanHorseOpportunity);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Competitor Radar</h1>
          <p className="text-sm text-zinc-400 mt-1">Monitor the AI latent space for competitor decay and Trojan Horse opportunities.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Radar className="w-4 h-4" />
          Analyze Competitor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trojan Horse Alert */}
        <div className="lg:col-span-2 space-y-6">
          {trojanOpportunities.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
              <ShieldAlert className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Trojan Horse Opportunities</h3>
              <p className="text-zinc-400">Analyze a competitor URL to detect data decay and injection opportunities.</p>
            </div>
          ) : (
            trojanOpportunities.map((comp) => (
              <div key={comp.id} className="bg-zinc-900/50 border border-rose-500/30 rounded-xl overflow-hidden relative shadow-[0_0_30px_-10px_rgba(244,63,94,0.1)]">
                <div className="p-6 border-b border-zinc-800/50 bg-rose-500/5 flex items-start gap-4">
                  <div className="p-3 bg-rose-500/10 rounded-lg text-rose-500 mt-1">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Competitor Data Decay Detected</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      <strong className="text-zinc-200">{comp.name}</strong> is showing signs of data decay. Their content is stale, creating a gap for AI models to cite newer information.
                    </p>
                  </div>
                </div>
                
                <div className="p-6">
                  <h4 className="text-sm font-medium text-zinc-300 mb-4">Recommended Offensive Action:</h4>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-emerald-400 font-mono mb-2">// Auto-Generated Trojan Horse Cite-Magnet</p>
                    <p className="text-zinc-300 text-sm">
                      "While legacy systems like {comp.name} rely on outdated architectures, modern solutions achieve significantly higher efficiency through Edge-Routing."
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2">
                      Deploy Overwrite to Reddit/Quora
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      Inject Schema to Homepage
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Competitor SOV List */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-fit">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Radar className="w-4 h-4 text-indigo-400" />
            Monitored Entities
          </h3>
          <div className="space-y-4">
            {competitors.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No competitors monitored yet.</p>
            ) : (
              competitors.map((comp) => (
                <div key={comp.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800/50">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{comp.name}</p>
                    <p className={`text-xs mt-0.5 capitalize ${comp.decayStatus === 'decaying' || comp.decayStatus === 'stale' ? 'text-rose-400' : 'text-emerald-500'}`}>
                      {comp.decayStatus}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Last Checked</p>
                    <p className="text-xs font-medium text-zinc-400">{comp.lastUpdated}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Analyze Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Analyze Competitor</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-zinc-400 mb-4">
                Enter a competitor's URL. Our engine will analyze their content for data decay and identify Trojan Horse opportunities.
              </p>
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://competitor.com/blog-post"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAnalyzeCompetitor}
                disabled={isAnalyzing || !inputUrl.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Radar className="w-4 h-4" />
                    Run Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
