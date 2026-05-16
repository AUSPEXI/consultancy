import { useState, useEffect } from 'react';
import { Database, Lock, Unlock, CheckCircle2, AlertCircle, Plus, X, Loader2, Megaphone, Sparkles, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { AmplifyModal } from '@/components/ui/AmplifyModal';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface Fact {
  id: string;
  statement: string;
  entropyScore: number;
  cliffhangerActive: boolean;
  category: string;
  createdAt: string;
  status?: string;
}

export function FactVault() {
  const { user, tier } = useAuth();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [industry, setIndustry] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [amplifyingFact, setAmplifyingFact] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'facts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const factsData: Fact[] = [];
      snapshot.forEach((doc) => {
        factsData.push({ id: doc.id, ...doc.data() } as Fact);
      });
      setFacts(factsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'facts');
    });

    return () => unsubscribe();
  }, [user]);

  const getFactLimit = () => {
    if (tier === 'Free') return 0;
    if (tier === 'Basic') return 10;
    if (tier === 'Medium') return 50;
    return Infinity; // Premium
  };

  const currentLimit = getFactLimit();
  const isAtLimit = facts.length >= currentLimit;

  if (tier === 'Free') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">The Fact-Vault</h1>
          <p className="text-zinc-400">Store and manage your high-entropy data points designed for AI extraction.</p>
        </div>
        <UpgradePrompt 
          title="Fact-Vault Locked" 
          description="Upgrade to the Basic tier to start extracting and storing high-entropy facts that AI models love to cite."
          requiredTier="Basic"
        />
      </div>
    );
  }

  const handleExtractFacts = async () => {
    if (!inputText.trim() || !user) return;
    
    if (isAtLimit) {
      alert(`You have reached your limit of ${currentLimit} facts for the ${tier} tier. Please upgrade to extract more.`);
      return;
    }

    setIsExtracting(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) {
        throw new Error("Gemini API key is missing");
      }
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        You are an expert Generative Engine Optimization (GEO) agent.
        Analyze the following text and extract 3 "High-Entropy Facts" (unique, non-obvious data points that AI models would want to cite).
        For each fact, assign an "Entropy Score" from 0 to 100 (higher means more unique).
        
        Text to analyze:
        ${inputText}
        
        Return ONLY a JSON array of objects with 'statement' (string) and 'entropyScore' (number).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const extractedFacts = JSON.parse(response.text || "[]");
      
      if (extractedFacts && Array.isArray(extractedFacts)) {
        // Save extracted facts to Firestore
        for (const fact of extractedFacts) {
          await addDoc(collection(db, 'facts'), {
            userId: user.uid,
            statement: fact.statement,
            entropyScore: fact.entropyScore,
            cliffhangerActive: fact.entropyScore > 80, // Automatically gate high-entropy facts
            category: 'Extracted',
            createdAt: new Date().toISOString().split('T')[0],
          });
        }
        setIsModalOpen(false);
        setInputText('');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'facts');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleResearch = async () => {
    if (!industry.trim() || !user) return;
    
    if (isAtLimit) {
      alert(`You have reached your limit of ${currentLimit} facts for the ${tier} tier. Please upgrade to extract more.`);
      return;
    }

    setIsResearching(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) {
        throw new Error("Gemini API key is missing");
      }
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        You are an expert Generative Engine Optimization (GEO) agent and NotebookLM-style research assistant.
        The user's industry/domain is: "${industry}".
        Generate 3 "High-Entropy Facts" (unique, non-obvious, highly specific data points or statistics that AI models would want to cite) related to this industry.
        For each fact, assign an "Entropy Score" from 0 to 100 (higher means more unique).
        
        Return ONLY a JSON array of objects with 'statement' (string) and 'entropyScore' (number).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const extractedFacts = JSON.parse(response.text || "[]");
      
      if (extractedFacts && Array.isArray(extractedFacts)) {
        for (const fact of extractedFacts) {
          await addDoc(collection(db, 'facts'), {
            userId: user.uid,
            statement: fact.statement,
            entropyScore: fact.entropyScore,
            cliffhangerActive: fact.entropyScore > 80,
            category: 'Auto-Researched',
            createdAt: new Date().toISOString().split('T')[0],
          });
        }
        setIsResearchModalOpen(false);
        setIndustry('');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'facts');
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">The Fact-Vault</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage your High-Entropy Data and Cite-Magnets.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-zinc-400">
            {facts.length} / {currentLimit === Infinity ? '∞' : currentLimit} Facts
          </div>
          <button 
            onClick={() => {
              if (isAtLimit) {
                alert(`You have reached your limit of ${currentLimit} facts for the ${tier} tier. Please upgrade to extract more.`);
              } else {
                setIsResearchModalOpen(true);
              }
            }}
            className={`${isAtLimit ? 'bg-zinc-700 cursor-not-allowed' : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30'} px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2`}
          >
            <Sparkles className="w-4 h-4" />
            Auto-Research
          </button>
          <button 
            onClick={() => {
              if (isAtLimit) {
                alert(`You have reached your limit of ${currentLimit} facts for the ${tier} tier. Please upgrade to extract more.`);
              } else {
                setIsModalOpen(true);
              }
            }}
            className={`${isAtLimit ? 'bg-zinc-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2`}
          >
            <Database className="w-4 h-4" />
            Add New Fact
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden relative">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/80">
          <h3 className="text-base font-semibold text-white">Information Cliffhangers</h3>
          <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
            To combat the "Zero-Click" nature of AI search, high-entropy facts are fed to the LLM, but the "How-To" or deep technical architecture is gated behind a citation link. This forces the user to click through to your site.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Extracted Fact (Cite-Magnet)</th>
                <th className="px-6 py-4 font-medium">Entropy Score</th>
                <th className="px-6 py-4 font-medium">Zero-Click Gated</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {facts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                      <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                        <Database className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">Your Fact-Vault is Empty</h3>
                      <p className="text-zinc-400 text-sm mb-6">
                        Store unique, high-entropy data points here to feed AI models. Not sure where to start? Let our NotebookLM-style research assistant generate some facts for your industry.
                      </p>
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={() => setIsResearchModalOpen(true)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Research My Industry
                        </button>
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Manually
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                facts.map((fact) => (
                  <tr key={fact.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-zinc-200 font-medium max-w-md">{fact.statement}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 max-w-[60px]">
                          <div 
                            className={`h-1.5 rounded-full ${fact.entropyScore > 80 ? 'bg-emerald-500' : fact.entropyScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                            style={{ width: `${fact.entropyScore}%` }}
                          ></div>
                        </div>
                        <span className={fact.entropyScore > 80 ? 'text-emerald-400' : 'text-rose-400'}>{fact.entropyScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {fact.cliffhangerActive ? (
                        <div className="flex items-center gap-2 text-amber-400">
                          <Lock className="w-4 h-4" />
                          <span className="text-xs font-medium border-b border-amber-400/30 border-dashed pb-0.5 cursor-help" title="Gated Content">
                            Cliffhanger Active
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Unlock className="w-4 h-4" />
                          <span className="text-xs">Exposed</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Injected
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setAmplifyingFact(fact.statement)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors text-xs font-medium border border-indigo-500/20"
                      >
                        <Megaphone className="w-3.5 h-3.5" /> Amplify
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Fact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Extract High-Entropy Facts</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-zinc-400 mb-4">
                Paste your blog post, whitepaper, or technical documentation below. Our proprietary AI engine will analyze the text and extract unique, non-obvious data points that AI models are likely to cite.
              </p>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your content here..."
                className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
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
                onClick={handleExtractFacts}
                disabled={isExtracting || !inputText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Extract & Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Research Modal */}
      {isResearchModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                NotebookLM Research
              </h2>
              <button 
                onClick={() => setIsResearchModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-zinc-400 mb-4">
                Tell us your industry or domain. Our research assistant will generate high-entropy facts to kickstart your vault.
              </p>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. B2B SaaS, Cybersecurity, Vegan Skincare..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && industry.trim() && !isResearching) {
                    handleResearch();
                  }
                }}
              />
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsResearchModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleResearch}
                disabled={isResearching || !industry.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Generate Facts
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Amplify Modal */}
      {amplifyingFact && (
        <AmplifyModal 
          fact={amplifyingFact} 
          onClose={() => setAmplifyingFact(null)} 
        />
      )}
    </div>
  );
}
