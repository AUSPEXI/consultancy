'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Lock, Unlock, CheckCircle2, AlertCircle, Plus, X, Loader2, Megaphone, Sparkles, Search, Network, FileText, BarChart2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { checkTierAccess } from '@/constants/tiers';
import { db } from '@/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { GoogleGenAI, Type } from '@google/genai';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { AmplifyModal } from '@/components/ui/AmplifyModal';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { logAuditAction } from '@/lib/audit';
import { authFetch } from '@/lib/auth-fetch';

interface Fact {
  id: string;
  statement: string;
  entropyScore: number;
  cliffhangerActive: boolean;
  category: string;
  createdAt: string;
  status?: string;
}

export default function FactVault() {
  const { user, tier, userData, role } = useAuth();
  const router = useRouter();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [industry, setIndustry] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [amplifyingFact, setAmplifyingFact] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

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
    if (!checkTierAccess(tier, 'Basic')) return 0;
    if (tier === 'Basic') return 10;
    if (tier === 'Medium') return 50;
    if (tier === 'Premium') return 150;
    return Infinity; // Pro, Business, Enterprise, PipelineOffer
  };

  const currentLimit = getFactLimit();
  const isAtLimit = facts.length >= currentLimit;

  if (role !== 'admin' && !checkTierAccess(tier, 'Basic')) {
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
      showToast(`Fact limit reached (${currentLimit} for ${tier} tier). Upgrade to add more.`, 'info');
      return;
    }

    setIsExtracting(true);
    try {
      const response = await authFetch('/api/extract-high-entropy-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputText })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const extractedFacts = data.facts || [];

      if (extractedFacts && Array.isArray(extractedFacts)) {
        // Save extracted facts to Firestore
        const newFactsPayloads = [];
        for (const fact of extractedFacts) {
          const payload = {
            userId: user.uid,
            statement: fact.statement,
            entropyScore: fact.entropyScore,
            cliffhangerActive: fact.entropyScore > 80, // Automatically gate high-entropy facts
            category: 'Extracted',
            createdAt: new Date().toISOString().split('T')[0],
          };
          await addDoc(collection(db, 'facts'), payload);
          newFactsPayloads.push(payload);
        }

        if (userData?.cmsWebhookUrl && newFactsPayloads.length > 0) {
          try {
            await fetch(userData.cmsWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'fact_injection', source: 'extraction', facts: newFactsPayloads })
            });
          } catch(e) {
            console.error("Webhook push failed", e);
          }
        }

        await logAuditAction(user.uid, 'Extracted Facts', { count: extractedFacts.length, source: 'Text Input' });
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
      showToast(`Fact limit reached (${currentLimit} for ${tier} tier). Upgrade to add more.`, 'info');
      return;
    }

    setIsResearching(true);
    try {
      const res = await fetch('/api/research-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      let extractedFacts = data.facts || [];

      if (extractedFacts && Array.isArray(extractedFacts)) {
        const newFactsPayloads = [];
        for (const fact of extractedFacts) {
          const payload = {
            userId: user.uid,
            statement: fact.statement,
            entropyScore: fact.entropyScore,
            cliffhangerActive: fact.entropyScore > 80,
            category: 'Auto-Researched',
            createdAt: new Date().toISOString().split('T')[0],
          };
          await addDoc(collection(db, 'facts'), payload);
          newFactsPayloads.push(payload);
        }

        if (userData?.cmsWebhookUrl && newFactsPayloads.length > 0) {
          try {
            await fetch(userData.cmsWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'fact_injection', source: 'auto_research', facts: newFactsPayloads })
            });
          } catch(e) {
            console.error("Webhook push failed", e);
          }
        }

        await logAuditAction(user.uid, 'Researched Facts', { count: extractedFacts.length, industry });
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
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : 'bg-zinc-900/90 border-zinc-700 text-zinc-300'}`}>
          <span className="text-sm font-bold tracking-tight">{toast.text}</span>
        </div>
      )}
      {/* Pipeline workflow guide */}
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono overflow-x-auto pb-1">
        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">1 · Fact Vault</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 whitespace-nowrap">2 · Agent Orchestration</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 whitespace-nowrap">3 · Content Scorer</span>
        <span>→</span>
        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 whitespace-nowrap">4 · Cite Probe</span>
        <span className="ml-2 text-zinc-600 hidden sm:inline">— Use "Write Article" on any fact to send it to Agents as the topic.</span>
      </div>

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
                showToast(`Fact limit reached (${currentLimit} for ${tier} tier). Upgrade to add more.`, 'info');
              } else {
                setIsResearchModalOpen(true);
              }
            }}
            className={`${isAtLimit ? 'bg-zinc-700 cursor-not-allowed' : 'bg-pink-600/20 text-pink-400 hover:bg-pink-600/30'} px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2`}
          >
            <Sparkles className="w-4 h-4" />
            Auto-Research
          </button>
          <button
            onClick={() => {
              if (isAtLimit) {
                showToast(`Fact limit reached (${currentLimit} for ${tier} tier). Upgrade to add more.`, 'info');
              } else {
                setIsModalOpen(true);
              }
            }}
            className={`${isAtLimit ? 'bg-zinc-700 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 text-white'} px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2`}
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
                      <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mb-4">
                        <Database className="w-8 h-8 text-pink-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">Your Fact-Vault is Empty</h3>
                      <p className="text-zinc-400 text-sm mb-6">
                        Store unique, high-entropy data points here to feed AI models. Not sure where to start? Let our Fact-Grabber research assistant generate some facts for your industry.
                      </p>
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={() => setIsResearchModalOpen(true)}
                          className="flex-1 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 cursor-help"
                        title="This fact is active in your Vault — it gets automatically included in every AI request as context (Retrieval-Augmented Generation). AI models citing your brand will draw from it."
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> AI Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            localStorage.setItem('agents_topic', fact.statement);
                            router.push('/dashboard/agents');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-colors text-xs font-medium border border-violet-500/20"
                        >
                          <FileText className="w-3.5 h-3.5" /> Write Article
                        </button>
                        <button
                          onClick={() => {
                            localStorage.setItem('contentScorer_draft', JSON.stringify({ content: fact.statement, type: 'blog' }));
                            router.push('/dashboard/content-scorer');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors text-xs font-medium border border-cyan-500/20"
                        >
                          <BarChart2 className="w-3.5 h-3.5" /> Score
                        </button>
                        <button
                          onClick={async () => {
                            const ontologyData = {
                              "@context": "https://schema.org",
                              "@type": "Fact",
                              "text": fact.statement,
                              "entropyScore": fact.entropyScore,
                              "status": fact.cliffhangerActive ? "gated" : "public",
                              "about": {
                                "@type": "Thing",
                                "name": "Brand Fact"
                              }
                            };

                            const downloadFallback = () => {
                              const blob = new Blob([JSON.stringify(ontologyData, null, 2)], { type: 'application/ld+json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `ontology-fact-${fact.id}.json`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            };

                            if (userData?.cmsWebhookUrl) {
                              try {
                                let webhookUrl = userData.cmsWebhookUrl.trim();
                                // If the user provided the frontend URL but they are on a different environment,
                                // it may fail due to CORS.
                                // To make testing easier, use a local URL if it seems they want the current app backend:
                                if (webhookUrl.includes('/api/webhooks/auspexi')) {
                                   webhookUrl = '/api/webhooks/auspexi';
                                }

                                const response = await fetch(webhookUrl, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ type: 'ontology_injection', ontology: ontologyData })
                                });
                                if (!response.ok) throw new Error('Webhook rejected');
                                showToast('Ontology schema injected via webhook.', 'success');
                              } catch (e: any) {
                                console.error(e);
                                showToast('Webhook push failed — downloading instead. Check your webhook URL in Settings.', 'error');
                                downloadFallback();
                              }
                            } else {
                              downloadFallback();
                              showToast('JSON-LD schema downloaded. Paste it into your website <head> as: <script type="application/ld+json">…</script>. Or add a Webhook URL in Settings to push automatically.', 'info');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors text-xs font-medium border border-indigo-500/20"
                        >
                          <Network className="w-3.5 h-3.5" /> Map Ontology
                        </button>
                        <button
                          onClick={() => setAmplifyingFact(fact.statement)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300 transition-colors text-xs font-medium border border-pink-500/20"
                        >
                          <Megaphone className="w-3.5 h-3.5" /> Amplify
                        </button>
                      </div>
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
                className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
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
                className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
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
                <Sparkles className="w-5 h-5 text-pink-400" />
                Fact-Grabber Research
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
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
                className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
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
