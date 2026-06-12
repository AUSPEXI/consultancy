'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Lock, Unlock, CheckCircle2, AlertCircle, Plus, X, Loader2, Megaphone, Sparkles, Search, Network, FileText, BarChart2 } from 'lucide-react';
import { WorkflowProgress, markStepComplete } from '@/components/dashboard/WorkflowProgress';
import { useAuth } from '@/contexts/AuthContext';
import { checkTierAccess, normalizeTier } from '@/constants/tiers';
import { db } from '@/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { GoogleGenAI, Type } from '@google/genai';
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
  embedding?: number[] | null;
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
  const [schemaPanel, setSchemaPanel] = useState<{ json: string; factId: string; factStatement?: string } | null>(null);
  const [schemaVerify, setSchemaVerify] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
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
    const t = normalizeTier(tier);
    if (t === 'Free') return 0;
    if (t === 'Starter') return 50;   // $149 — pricing page advertises "1GB Fact-Vault"
    if (t === 'Pro') return 500;      // $499 — "10GB Fact-Vault"
    return Infinity;                  // Business ($1,899) — "50GB Fact-Vault"
  };

  const currentLimit = getFactLimit();
  const isAtLimit = facts.length >= currentLimit;

  const isReadOnly = role !== 'admin' && !checkTierAccess(tier, 'Starter');

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
          const payload: Record<string, any> = {
            userId: user.uid,
            statement: fact.statement,
            entropyScore: fact.entropyScore,
            cliffhangerActive: fact.entropyScore > 80, // Automatically gate high-entropy facts
            category: 'Extracted',
            createdAt: new Date().toISOString().split('T')[0],
          };
          if (fact.embedding?.length > 0) {
            payload.embedding = fact.embedding;
            if (fact.embeddingSpace) payload.embeddingSpace = fact.embeddingSpace;
          }
          if (fact.localEmbedding?.length > 0) {
            payload.localEmbedding = fact.localEmbedding;
            payload.localEmbeddingSpace = fact.localEmbeddingSpace ?? 'local-synonym-v1';
          }
          if (fact.embeddingAlignmentScore != null) payload.embeddingAlignmentScore = fact.embeddingAlignmentScore;
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

        markStepComplete(2);
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
      const res = await authFetch('/api/research-facts', {
        method: 'POST',
        body: JSON.stringify({ industry })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      let extractedFacts = data.facts || [];

      if (extractedFacts && Array.isArray(extractedFacts)) {
        const newFactsPayloads = [];
        for (const fact of extractedFacts) {
          const payload: Record<string, any> = {
            userId: user.uid,
            statement: fact.statement,
            entropyScore: fact.entropyScore,
            cliffhangerActive: fact.entropyScore > 80,
            category: 'Auto-Researched',
            createdAt: new Date().toISOString().split('T')[0],
          };
          if (fact.embedding?.length > 0) {
            payload.embedding = fact.embedding;
            if (fact.embeddingSpace) payload.embeddingSpace = fact.embeddingSpace;
          }
          if (fact.localEmbedding?.length > 0) {
            payload.localEmbedding = fact.localEmbedding;
            payload.localEmbeddingSpace = fact.localEmbeddingSpace ?? 'local-synonym-v1';
          }
          if (fact.embeddingAlignmentScore != null) payload.embeddingAlignmentScore = fact.embeddingAlignmentScore;
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
      {isReadOnly && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-200">
            You&apos;re viewing <strong>read-only mode</strong>. Upgrade to <strong>Starter</strong> to use this feature.
          </p>
          <a href="/#pricing" className="text-[11px] font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors shrink-0">
            Upgrade
          </a>
        </div>
      )}
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : 'bg-zinc-900/90 border-zinc-700 text-zinc-300'}`}>
          <span className="text-sm font-bold tracking-tight">{toast.text}</span>
        </div>
      )}
      <WorkflowProgress currentStep={2} />

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
              if (isReadOnly || isAtLimit) {
                showToast(isReadOnly ? 'Upgrade to Starter to use this feature.' : `Fact limit reached (${currentLimit} for ${tier} tier). Upgrade to add more.`, 'info');
              } else {
                setIsResearchModalOpen(true);
              }
            }}
            disabled={isReadOnly}
            title={isReadOnly ? 'Upgrade to Starter to use this feature' : undefined}
            className={`${isAtLimit || isReadOnly ? 'bg-zinc-700 cursor-not-allowed' : 'bg-pink-600/20 text-pink-400 hover:bg-pink-600/30'} px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2`}
          >
            <Sparkles className="w-4 h-4" />
            Auto-Research
          </button>
          <button
            onClick={() => {
              if (isReadOnly || isAtLimit) {
                showToast(isReadOnly ? 'Upgrade to Starter to use this feature.' : `Fact limit reached (${currentLimit} for ${tier} tier). Upgrade to add more.`, 'info');
              } else {
                setIsModalOpen(true);
              }
            }}
            disabled={isReadOnly}
            title={isReadOnly ? 'Upgrade to Starter to use this feature' : undefined}
            className={`${isAtLimit || isReadOnly ? 'bg-zinc-700 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 text-white'} px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2`}
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
                        title="This fact is active in your Vault: it gets automatically included in every AI request as context (Retrieval-Augmented Generation). AI models citing your brand will draw from it."
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
                              "@type": "Claim",
                              "text": fact.statement,
                              "about": { "@type": "Organization", "name": userData?.brand || "Brand" },
                              "appearance": { "@type": "WebPage", "url": userData?.domain ? `https://${userData.domain}` : undefined },
                            };
                            const jsonStr = JSON.stringify(ontologyData, null, 2);

                            // Always save to schema registry (admin SDK writes to Firestore → layout injects into page head)
                            if (user && userData?.domain) {
                              authFetch('/api/schema-registry', {
                                method: 'POST',
                                body: JSON.stringify({ domain: userData.domain, schema: ontologyData, factId: fact.id }),
                              }).catch(() => {});
                            }

                            if (userData?.cmsWebhookUrl) {
                              try {
                                const res = await authFetch('/api/webhook-proxy', {
                                  method: 'POST',
                                  body: JSON.stringify({ webhookUrl: userData.cmsWebhookUrl.trim(), payload: { type: 'ontology_injection', ontology: ontologyData } }),
                                });
                                if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
                                showToast('Schema saved to registry and pushed to CMS. Use "Verify on site" below to confirm.', 'success');
                              } catch (e: any) {
                                showToast(`Webhook failed: ${e.message}. Schema saved to registry. Copy snippet below to add manually.`, 'error');
                              }
                            } else {
                              showToast('Schema saved to site registry. Copy the snippet below to also add it manually to your site head.', 'info');
                            }
                            setSchemaVerify(null);
                            setSchemaPanel({ json: jsonStr, factId: fact.id, factStatement: fact.statement });
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
                disabled={isExtracting || !inputText.trim() || isReadOnly}
                title={isReadOnly ? 'Upgrade to Starter to use this feature' : undefined}
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

      {/* Schema Panel */}
      {schemaPanel && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) { setSchemaPanel(null); setSchemaVerify(null); } }}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl shadow-2xl my-4">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-400" /> JSON-LD Schema · Claim
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {userData?.cmsWebhookUrl
                    ? 'Sent to CMS. Verify below that it appears in your live page HTML.'
                    : 'No webhook configured. Add this to your site manually.'}
                </p>
              </div>
              <button onClick={() => { setSchemaPanel(null); setSchemaVerify(null); }} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">

              {/* JSON display */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 relative">
                <pre className="text-xs text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap">{schemaPanel.json}</pre>
                <button
                  onClick={() => { navigator.clipboard.writeText(schemaPanel.json); showToast('Schema copied.', 'success'); }}
                  className="absolute top-3 right-3 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  title="Copy JSON"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>

              {/* How to add manually */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">If adding manually</p>
                <p className="text-xs text-zinc-400">Paste inside your page's <code className="text-indigo-300">&lt;head&gt;</code> tag:</p>
                <div className="bg-black rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <code className="text-[11px] text-indigo-300 font-mono">{`<script type="application/ld+json">${schemaPanel.json.replace(/\n/g, ' ')}</script>`}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`<script type="application/ld+json">${schemaPanel.json}</script>`); showToast('HTML snippet copied.', 'success'); }}
                    className="shrink-0 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                    title="Copy HTML snippet"
                  >
                    <CheckCircle2 className="w-3 h-3 text-zinc-500" />
                  </button>
                </div>
              </div>

              {/* Verify on site */}
              {userData?.domain && (
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      setIsVerifying(true);
                      setSchemaVerify(null);
                      try {
                        const res = await authFetch('/api/verify-schema', {
                          method: 'POST',
                          body: JSON.stringify({ domain: userData.domain, factStatement: schemaPanel.factStatement }),
                        });
                        const data = await res.json();
                        setSchemaVerify(data);
                      } catch (e: any) {
                        setSchemaVerify({ error: e.message });
                      } finally {
                        setIsVerifying(false);
                      }
                    }}
                    disabled={isVerifying}
                    className="w-full flex items-center justify-center gap-2 text-xs text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/10 rounded-lg py-2.5 transition-colors disabled:opacity-50"
                  >
                    {isVerifying ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking {userData.domain}…</> : <><Search className="w-3.5 h-3.5" /> Verify schema is live on {userData.domain}</>}
                  </button>

                  {schemaVerify && !schemaVerify.error && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-zinc-400 uppercase tracking-widest">Live schema check: {schemaVerify.url}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${schemaVerify.schemasFound > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {schemaVerify.schemasFound} schema{schemaVerify.schemasFound !== 1 ? 's' : ''} found
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Organization schema', ok: schemaVerify.hasOrganization },
                          { label: 'Claim schema', ok: schemaVerify.hasClaim },
                          { label: 'WebSite schema', ok: schemaVerify.hasWebSite },
                          { label: 'This fact in schema', ok: schemaVerify.factFound },
                        ].map(({ label, ok }) => (
                          <div key={label} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-900 text-zinc-500'}`}>
                            {ok ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
                            {label}
                          </div>
                        ))}
                      </div>
                      {schemaVerify.sameAsLinks?.length > 0 && (
                        <div>
                          <p className="text-zinc-500 mb-1">sameAs links found:</p>
                          {schemaVerify.sameAsLinks.map((l: string, i: number) => <p key={i} className="text-zinc-400 font-mono truncate">{l}</p>)}
                        </div>
                      )}
                      {schemaVerify.schemasFound === 0 && (
                        <p className="text-amber-400/80 text-[11px] leading-relaxed">No structured data found on your homepage. The schema was not written to page HTML. The webhook server received the data but isn't embedding it.</p>
                      )}
                      {schemaVerify.schemasFound > 0 && !schemaVerify.hasClaim && (
                        <p className="text-amber-400/80 text-[11px] leading-relaxed">Schemas found (Organization/WebSite) but no Claim type yet. Your webhook was received but the JSON-LD from Map Ontology hasn't been embedded. Copy it manually from above and paste into your site's &lt;head&gt;.</p>
                      )}
                      {schemaVerify.schemasFound > 0 && schemaVerify.hasClaim && !schemaVerify.factFound && (
                        <p className="text-emerald-400/70 text-[11px] leading-relaxed">Claim schema is present on the page. This specific fact statement wasn't detected in the schema text (may be a different claim or a truncation). Check the schema content on your site.</p>
                      )}
                      {schemaVerify.schemasFound > 0 && schemaVerify.hasClaim && schemaVerify.factFound && (
                        <p className="text-emerald-400 text-[11px] leading-relaxed">This fact is live in your page structured data. AI crawlers will see it as an authoritative Claim attributed to your brand.</p>
                      )}
                    </div>
                  )}
                  {schemaVerify?.error && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2">{schemaVerify.error}</p>
                  )}
                </div>
              )}

              {!userData?.cmsWebhookUrl && (
                <button
                  onClick={() => { setSchemaPanel(null); setSchemaVerify(null); router.push('/dashboard/settings'); }}
                  className="w-full text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 rounded-lg py-2 transition-colors"
                >
                  Set up CMS webhook in Settings to push automatically →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
