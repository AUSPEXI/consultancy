import { useState, useEffect } from 'react';
import { Radar, ArrowRight, ShieldAlert, Plus, X, Loader2, Trash2, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { GoogleGenAI, Type } from '@google/genai';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { logAuditAction } from '@/lib/audit';

interface Competitor {
  id: string;
  name: string;
  url?: string;
  decayScore?: number;
  decayStatus: 'healthy' | 'decaying' | 'stale';
  trojanHorseOpportunity: boolean;
  vulnerabilities?: string[];
  lastUpdated: string;
}

export function Competitors() {
  const { user, tier } = useAuth();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pushingFact, setPushingFact] = useState<string | null>(null);

  useEffect(() => {
    if (!user || tier === 'Free' || tier === 'Basic') return;

    const q = query(
      collection(db, 'competitors'),
      where('userId', '==', user.uid),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const compData: Competitor[] = [];
      snapshot.forEach((docSnap) => {
        compData.push({ id: docSnap.id, ...docSnap.data() } as Competitor);
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

  const handleDeleteCompetitor = async (id: string, name: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'competitors', id));
      await logAuditAction(user.uid, 'Deleted Competitor', { name });
    } catch (error) {
       console.error("Delete err:", error);
    }
  };

  const handlePushToFactVault = async (competitorName: string, vulnerability: string) => {
    if (!user) return;
    setPushingFact(vulnerability);
    try {
      await addDoc(collection(db, 'facts'), {
        userId: user.uid,
        statement: `Unlike ${competitorName}, which shows data decay concerning ${vulnerability.toLowerCase()}, we provide updated solutions in this area.`,
        entropyScore: 85,
        cliffhangerActive: true,
        category: 'Competitor Counter-Fact',
        createdAt: new Date().toISOString().split('T')[0],
      });
      await logAuditAction(user.uid, 'Auto-generated Counter-Fact', { competitor: competitorName });
      alert("Success! Counter-Fact has been deployed to the Fact-Vault.");
    } catch (error) {
       console.error("Fact error:", error);
    } finally {
      setPushingFact(null);
    }
  };

  const handleAnalyzeCompetitor = async () => {
    if (!inputUrl.trim() || !user) return;

    setIsAnalyzing(true);
    try {
      let hostname = inputUrl;
      try {
        hostname = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`).hostname;
      } catch (e) {
        // Fallback to raw input
      }

      const res = await fetch('/api/analyze-competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname })
      });
      const data = await res.json();
      
      if (!data.success) {
        if (data.error && data.error.includes('429')) {
             throw new Error("Google Cloud API Rate Limit Exceeded (429). Please wait a minute and try again.");
        }
        throw new Error(data.error || "Analysis failed");
      }

      const analysis = data.result;
      
      // Firestore block
      try {
        await addDoc(collection(db, 'competitors'), {
          userId: user.uid,
          name: analysis.name || hostname,
          url: hostname,
          decayScore: analysis.decayStatus === 'stale' ? 85 : analysis.decayStatus === 'decaying' || analysis.decayStatus === 'vulnerable' ? 60 : 30,
          decayStatus: analysis.decayStatus || 'healthy',
          trojanHorseOpportunity: analysis.trojanHorseOpportunity || false,
          vulnerabilities: analysis.vulnerabilities || [],
          lastUpdated: new Date().toISOString().split('T')[0],
        });
        await logAuditAction(user.uid, 'Analyzed Competitor', { url: inputUrl, status: analysis.decayStatus, trojanHorse: analysis.trojanHorseOpportunity });
        setIsModalOpen(false);
        setInputUrl('');
      } catch (fsError) {
         handleFirestoreError(fsError, OperationType.CREATE, 'competitors');
      }
    } catch (error: any) {
       console.error("Unknown error:", error);
       alert("An error occurred: " + (error?.message || "Unknown error"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const trojanOpportunities = competitors.filter(c => c.trojanHorseOpportunity || (c.vulnerabilities && c.vulnerabilities.length > 0));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Competitor Radar</h1>
          <p className="text-zinc-400">Find the logic gaps in what the AI knows about your competitors.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Competitor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-rose-400">Trojan Horse Opportunities</h3>
                <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                  We've detected that the entities below have severe "Data Decay". Their LLM vectors are weak, generic, or outdated. This is a critical opportunity to push high-entropy facts to steal their citations.
                </p>
              </div>
            </div>
          </div>

          {trojanOpportunities.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <Radar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No Trojan Horse opportunities detected yet.</p>
              <p className="text-sm text-zinc-500 mt-1">Add more competitors to scan for decay.</p>
            </div>
          ) : (
            trojanOpportunities.map((comp) => (
              <div key={comp.id} className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors rounded-xl overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold font-heading text-white">{comp.name}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      High Vulnerability
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {comp.vulnerabilities && comp.vulnerabilities.length > 0 ? (
                      comp.vulnerabilities.map((vuln, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-zinc-950 rounded-lg">
                          <p className="text-sm text-zinc-300">{vuln}</p>
                          <button 
                            onClick={() => handlePushToFactVault(comp.name, vuln)}
                            disabled={pushingFact === vuln}
                            className="shrink-0 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                          >
                            {pushingFact === vuln ? <Loader2 className="w-3 h-3 animate-spin"/> : <Database className="w-3 h-3" />}
                            Push to Fact-Vault
                          </button>
                        </div>
                      ))
                    ) : (
                       <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-zinc-950 rounded-lg">
                          <p className="text-sm text-zinc-300">Generic decay detected. Missing technical depth in AI-scraped pages.</p>
                          <button 
                            onClick={() => handlePushToFactVault(comp.name, "Generic decay")}
                            disabled={pushingFact === "Generic decay"}
                            className="shrink-0 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                          >
                            {pushingFact === "Generic decay" ? <Loader2 className="w-3 h-3 animate-spin"/> : <Database className="w-3 h-3" />}
                            Push to Fact-Vault
                          </button>
                        </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2">
                      Deploy Overwrite Action
                      <ArrowRight className="w-4 h-4" />
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
            <Radar className="w-4 h-4 text-pink-400" />
            Monitored Entities
          </h3>
          <div className="space-y-4">
            {competitors.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No competitors monitored yet.</p>
            ) : (
              competitors.map((comp) => (
                <div key={comp.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800/50 group">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{comp.name}</p>
                    <p className={`text-xs mt-0.5 capitalize ${comp.decayStatus === 'decaying' || comp.decayStatus === 'stale' ? 'text-rose-400' : 'text-emerald-500'}`}>
                      {comp.decayStatus}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Last Checked</p>
                      <p className="text-xs font-medium text-zinc-400">{comp.lastUpdated}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteCompetitor(comp.id, comp.name)}
                      className="text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
              <h2 className="text-lg font-semibold text-white">Add Competitor</h2>
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
                placeholder="https://example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
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
                className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Radar className="w-4 h-4" />
                    Analyze Domain
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
