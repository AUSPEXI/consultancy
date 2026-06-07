'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Code2, PenTool, CheckCircle2, Loader2, Play, ArrowRight, X, BrainCircuit, Layers, Copy, Download, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { WorkflowProgress, markStepComplete } from '@/components/dashboard/WorkflowProgress';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import ReactMarkdown from 'react-markdown';
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { checkTierAccess } from '@/constants/tiers';
import { logAuditAction } from '@/lib/audit';
import { authFetch } from '@/lib/auth-fetch';

type AgentStatus = 'idle' | 'running' | 'completed' | 'error';
type BulkStatus = 'pending' | 'running' | 'done' | 'error';

interface PermutationItem { query: string; format: string; intent: string; }

export default function AgentsPage() {
  const { tier, userData, user, role } = useAuth();
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [rateLimitWarning, setRateLimitWarning] = useState('');

  // Permutations
  const [permKeyword, setPermKeyword] = useState('');
  const [isGeneratingPerms, setIsGeneratingPerms] = useState(false);
  const [permResult, setPermResult] = useState<{ permutations: PermutationItem[]; byFormat: Record<string, number>; count: number } | null>(null);
  const [permError, setPermError] = useState<string | null>(null);

  const [crawlerStatus, setCrawlerStatus] = useState<AgentStatus>('idle');
  const [extractionStatus, setExtractionStatus] = useState<AgentStatus>('idle');
  const [schemaStatus, setSchemaStatus] = useState<AgentStatus>('idle');
  const [synthesisStatus, setSynthesisStatus] = useState<AgentStatus>('idle');

  const [extractedFacts, setExtractedFacts] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState('');
  const [finalArticle, setFinalArticle] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');

  // Bulk queue
  const [bulkQueue, setBulkQueue] = useState<{ topic: string; status: BulkStatus }[]>([]);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [bulkDoneCount, setBulkDoneCount] = useState(0);
  const [bulkResults, setBulkResults] = useState<{ topic: string; article: string; schema: string; facts: string }[]>(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('agents_bulk_results') || '[]'); } catch { return []; }
    }
    return [];
  });
  const [expandedBulkIdx, setExpandedBulkIdx] = useState<number | null>(null);
  const [restoredFromSession, setRestoredFromSession] = useState(false);
  const [correctionSnippets, setCorrectionSnippets] = useState<string[]>([]);

  // Persist bulk results across navigation
  useEffect(() => {
    localStorage.setItem('agents_bulk_results', JSON.stringify(bulkResults));
  }, [bulkResults]);

  // On mount: load queued topic, bulk queue, or last result
  useEffect(() => {
    const handleSetTopic = (e: any) => { if (e.detail?.topic) setTopic(e.detail.topic); };
    window.addEventListener('set-agent-topic', handleSetTopic);

    const queued = localStorage.getItem('agents_topic');
    const bulkRaw = localStorage.getItem('agents_bulk_queue');

    if (queued) {
      setTopic(queued);
      localStorage.removeItem('agents_topic');
    }

    // Pick up misinformation snippet(s) passed from cite-probe for counter-article generation
    const snippetRaw = localStorage.getItem('agents_misinfo_snippets');
    if (snippetRaw) {
      try {
        const snippets = JSON.parse(snippetRaw);
        if (Array.isArray(snippets) && snippets.length > 0) setCorrectionSnippets(snippets);
      } catch (_) {}
      localStorage.removeItem('agents_misinfo_snippets');
    }

    if (bulkRaw) {
      try {
        const queries: string[] = JSON.parse(bulkRaw);
        if (queries.length > 0) setBulkQueue(queries.map(q => ({ topic: q, status: 'pending' })));
      } catch (_) {}
      localStorage.removeItem('agents_bulk_queue');
    }

    // Restore last result only when nothing new is queued
    if (!queued && !bulkRaw) {
      try {
        const saved = localStorage.getItem('agents_last_result');
        if (saved) {
          const r = JSON.parse(saved);
          if (r.finalArticle) {
            setTopic(r.topic || '');
            setExtractedFacts(r.extractedFacts || '');
            setGeneratedSchema(r.generatedSchema || '');
            setFinalArticle(r.finalArticle || '');
            setCrawlerStatus('completed'); setExtractionStatus('completed');
            setSchemaStatus('completed'); setSynthesisStatus('completed');
            setShowResults(true);
            setRestoredFromSession(true);
          }
        }
      } catch (_) {}
    }

    return () => window.removeEventListener('set-agent-topic', handleSetTopic);
  }, []);

  // Persist latest completed result
  useEffect(() => {
    if (showResults && finalArticle) {
      localStorage.setItem('agents_last_result', JSON.stringify({ topic, extractedFacts, generatedSchema, finalArticle }));
      markStepComplete(3);
    }
  }, [showResults, finalArticle]);

  if (role !== 'admin' && !checkTierAccess(tier, 'Pro')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Multi-Agent Orchestration</h1>
          <p className="text-zinc-400">Deploy specialized AI agents to crawl, extract, structure, and synthesize GEO-optimized content.</p>
        </div>
        <UpgradePrompt title="Multi-Agent Orchestration Locked" description="Upgrade to the Pro tier to access the full Prompt-to-Conversion Pipeline and deploy specialized AI agents for automated content generation." requiredTier="Pro" />
      </div>
    );
  }

  const resetState = () => {
    setCrawlerStatus('idle'); setExtractionStatus('idle'); setSchemaStatus('idle'); setSynthesisStatus('idle');
    setExtractedFacts(''); setGeneratedSchema(''); setFinalArticle(''); setShowResults(false); setRateLimitWarning(''); setPublishMsg('');
  };

  // Core pipeline — accepts optional topic override, returns results, always cleans up isOrchestrating
  const runOrchestration = async (topicOverride?: string): Promise<{ article: string; facts: string; schema: string; topic: string }> => {
    const effectiveTopic = (topicOverride ?? topic).trim();
    if (!effectiveTopic) throw new Error('No topic');

    setIsOrchestrating(true);
    resetState();

    try {
      let vaultContext = '';
      if (user) {
        try {
          const { query: fsQuery, collection: fsCollection, getDocs, where } = await import('firebase/firestore');
          const isCleanFact = (f: string) => {
            const lower = f.toLowerCase();
            return !lower.includes('needs deeper analysis') && !lower.includes('run a scan') &&
              !lower.startsWith('unlike') && !lower.includes('placeholder') && f.length > 20;
          };
          const qVault = fsQuery(fsCollection(db, 'facts'), where('userId', '==', user.uid));
          const vaultSnap = await getDocs(qVault);
          let factsArray = vaultSnap.docs.map(doc => (doc.data().statement as string)).filter(Boolean).filter(isCleanFact);
          if (factsArray.length === 0) {
            const qKg = fsQuery(fsCollection(db, 'knowledge_graph'), where('userId', '==', user.uid));
            const kgSnap = await getDocs(qKg);
            factsArray = kgSnap.docs.map(doc => (doc.data().fact as string)).filter(Boolean).filter(isCleanFact);
          }
          if (factsArray.length > 0) vaultContext = factsArray.join('\n- ');
        } catch (e) { console.warn('Failed to fetch vault', e); }
      }

      setCrawlerStatus('running');
      const crawlRes = await authFetch('/api/agent/crawl', { method: 'POST', body: JSON.stringify({ topic: effectiveTopic }) });
      const crawlData = await crawlRes.json();
      if (!crawlData.success) throw new Error(crawlData.error);
      setCrawlerStatus('completed');

      setExtractionStatus('running');
      const extractRes = await authFetch('/api/agent/extract', { method: 'POST', body: JSON.stringify({ topic: effectiveTopic, crawlerData: crawlData.result, vaultContext }) });
      const extractData = await extractRes.json();
      if (!extractData.success) throw new Error(extractData.error);
      const facts = extractData.result || 'No facts extracted.';
      setExtractedFacts(facts);
      setExtractionStatus('completed');

      await new Promise(res => setTimeout(res, 5000));

      setSchemaStatus('running');
      const schemaRes = await authFetch('/api/agent/schema', { method: 'POST', body: JSON.stringify({ facts }) });
      const schemaData = await schemaRes.json();
      if (!schemaData.success) throw new Error(schemaData.error);
      const schema = schemaData.result || '{}';
      setGeneratedSchema(schema);
      setSchemaStatus('completed');

      await new Promise(res => setTimeout(res, 5000));

      setSynthesisStatus('running');
      const allCorrections = [...(userData?.negativeStatements || []), ...correctionSnippets].filter(Boolean);
      const synthRes = await authFetch('/api/agent/synthesize', { method: 'POST', body: JSON.stringify({ topic: effectiveTopic, facts, brandName: userData?.brand || '', negativeStatements: allCorrections }) });
      const synthData = await synthRes.json();
      if (!synthData.success) throw new Error(synthData.error);
      const article = synthData.result || 'Failed to generate article.';
      setFinalArticle(article);
      setSynthesisStatus('completed');
      setShowResults(true);

      return { article, facts, schema, topic: effectiveTopic };
    } catch (error) {
      setCrawlerStatus(prev => prev === 'running' ? 'error' : prev);
      setExtractionStatus(prev => prev === 'running' ? 'error' : prev);
      setSchemaStatus(prev => prev === 'running' ? 'error' : prev);
      setSynthesisStatus(prev => prev === 'running' ? 'error' : prev);
      throw error;
    } finally {
      setIsOrchestrating(false);
    }
  };

  const handleRunOrchestration = async () => {
    try {
      await runOrchestration();
    } catch (error: any) {
      if (error?.message?.includes('429')) setRateLimitWarning('Google API rate limit exceeded. Please wait a bit before retrying.');
      else setRateLimitWarning(error?.message || 'Agent workflow failed. Check console for details.');
    }
  };

  const generatePermutations = async () => {
    if (!permKeyword.trim() || !user) return;
    setIsGeneratingPerms(true);
    setPermError(null);
    setPermResult(null);
    try {
      const res = await authFetch('/api/permutations', {
        method: 'POST',
        body: JSON.stringify({ keyword: permKeyword.trim(), brand: userData?.brand || '' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Permutation generation failed');
      setPermResult(data);
    } catch (err: any) {
      setPermError(err.message);
    } finally {
      setIsGeneratingPerms(false);
    }
  };

  // Bulk: runs all pending queue items in sequence, auto-saves each to Firestore
  const runBulkQueue = async () => {
    setIsBulkRunning(true);
    let done = 0;

    for (let i = 0; i < bulkQueue.length; i++) {
      if (bulkQueue[i].status === 'done') { done++; continue; }

      setBulkQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'running' } : q));
      try {
        const result = await runOrchestration(bulkQueue[i].topic);

        if (user) {
          const payload = {
            userId: user.uid, topic: result.topic, article: result.article,
            facts: result.facts, schema: result.schema,
            brand: userData?.brand || '', timestamp: new Date().toISOString(), source: 'bulk_run',
          };
          await addDoc(collection(db, 'articles'), payload);
          await logAuditAction(user.uid, 'Bulk Article Saved', { topic: result.topic });
          if (userData?.cmsWebhookUrl) {
            fetch(userData.cmsWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
          }
        }

        done++;
        setBulkDoneCount(done);
        setBulkQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'done' } : q));
        setBulkResults(prev => [...prev, { topic: result.topic, article: result.article, schema: result.schema, facts: result.facts }]);
      } catch (err: any) {
        setBulkQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'error' } : q));
        console.error('Bulk item failed:', bulkQueue[i].topic, err);
      }

      // Pause between runs to avoid rate limits
      if (i < bulkQueue.length - 1) await new Promise(res => setTimeout(res, 4000));
    }

    setIsBulkRunning(false);
  };

  const handlePublishToCms = async () => {
    setIsPublishing(true);
    setPublishMsg('');
    try {
      const articlePayload = { userId: user?.uid || 'anonymous', topic, article: finalArticle, facts: extractedFacts, schema: generatedSchema, brand: userData?.brand || '', timestamp: new Date().toISOString() };
      await addDoc(collection(db, 'articles'), articlePayload);
      if (user) await logAuditAction(user.uid, 'Published Article to CMS', { topic, brand: userData?.brand || '' });
      if (userData?.cmsWebhookUrl) {
        const response = await fetch(userData.cmsWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(articlePayload) });
        if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
        const webhookData = await response.json().catch(() => ({}));
        setPublishMsg(webhookData.emailed ? `Saved and pushed to your CMS (email receipt sent to ${webhookData.to}).` : 'Article saved and pushed to your CMS via webhook.');
      } else {
        setPublishMsg('Article saved to Auspexi. Add a CMS Webhook URL in Settings → Integrations to automatically push to your site.');
      }
    } catch (error: any) {
      setPublishMsg(`Error: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const StatusBadge = ({ status, activeText }: { status: AgentStatus; activeText: string }) => {
    if (status === 'idle') return <div className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">Idle</div>;
    if (status === 'running') return <div className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> {activeText}</div>;
    if (status === 'error') return <div className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full"><X className="w-3 h-3" /> Failed</div>;
    return <div className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Complete</div>;
  };

  const progressWidth = synthesisStatus === 'completed' ? '100%' : schemaStatus === 'completed' ? '75%' : extractionStatus === 'completed' ? '50%' : crawlerStatus === 'completed' ? '25%' : '0%';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <WorkflowProgress currentStep={3} />

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Agent Orchestration</h1>
        <p className="text-sm text-zinc-400 mt-1">Run specialized AI crews to prevent hallucinations and generate GEO content.</p>
      </div>

      {/* Query Permutations Engine */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-violet-400" />
              Query Permutations Engine
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Generate ~60 query variants for a keyword (7 formats × ~9 each) — all embedded to 768D vectors and stored to
              {' '}<code className="text-zinc-400 text-[10px]">fact_permutations</code> for model training. Load into bulk queue to generate GEO articles for the full query space.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={permKeyword}
            onChange={e => setPermKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isGeneratingPerms && generatePermutations()}
            placeholder={`e.g. generative engine optimization for ${userData?.brand || 'B2B SaaS'}`}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500"
          />
          <button
            onClick={generatePermutations}
            disabled={isGeneratingPerms || !permKeyword.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
          >
            {isGeneratingPerms ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</> : <><Play className="w-3.5 h-3.5 fill-current" />Generate</>}
          </button>
        </div>

        {permError && <p className="text-xs text-rose-400">{permError}</p>}

        {permResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-zinc-400">{permResult.count} queries generated with 768D embeddings</span>
                {Object.entries(permResult.byFormat).map(([fmt, n]) => (
                  n > 0 && <span key={fmt} className="text-[10px] px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400">{fmt}: {n}</span>
                ))}
              </div>
              <button
                onClick={() => {
                  setBulkQueue(permResult.permutations.slice(0, 30).map(p => ({ topic: p.query, status: 'pending' as const })));
                }}
                className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shrink-0"
              >
                Load top 30 into Bulk Queue →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto">
              {permResult.permutations.slice(0, 20).map((p, i) => (
                <button
                  key={i}
                  onClick={() => setTopic(p.query)}
                  title="Click to use as single topic"
                  className="text-left text-xs px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all truncate"
                >
                  <span className={`text-[9px] font-bold mr-1.5 ${p.format === 'question' ? 'text-blue-400' : p.format === 'best' ? 'text-emerald-400' : p.format === 'vs' ? 'text-rose-400' : p.format === 'howto' ? 'text-amber-400' : 'text-zinc-600'}`}>
                    {p.format}
                  </span>
                  {p.query}
                </button>
              ))}
            </div>
            {permResult.count > 20 && <p className="text-[10px] text-zinc-600">+ {permResult.count - 20} more stored in Firestore for model training</p>}
          </div>
        )}
      </div>

      {/* Bulk queue panel */}
      {bulkQueue.length > 0 && (
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Bulk Run Queue</h3>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                {bulkQueue.filter(q => q.status === 'done').length}/{bulkQueue.length} done
              </span>
            </div>
            {!isBulkRunning && !bulkQueue.every(q => q.status === 'done') && (
              <button
                onClick={runBulkQueue}
                disabled={isOrchestrating}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                Start Bulk Run
              </button>
            )}
            {bulkQueue.every(q => q.status === 'done') && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> All articles saved
              </span>
            )}
          </div>
          <div className="space-y-2">
            {bulkQueue.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  item.status === 'done' ? 'bg-emerald-400' :
                  item.status === 'running' ? 'bg-amber-400 animate-pulse' :
                  item.status === 'error' ? 'bg-rose-400' : 'bg-zinc-600'
                }`} />
                <span className={`flex-1 truncate ${item.status === 'done' ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>
                  {item.topic}
                </span>
                <span className={`text-[10px] font-medium uppercase tracking-wide shrink-0 ${
                  item.status === 'done' ? 'text-emerald-400' :
                  item.status === 'running' ? 'text-amber-400' :
                  item.status === 'error' ? 'text-rose-400' : 'text-zinc-600'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
          {isBulkRunning && (
            <p className="text-xs text-zinc-500">
              Processing queries one at a time. Each article is auto-saved to Firestore{userData?.cmsWebhookUrl ? ' and pushed to your CMS' : ''}. Do not close this tab.
            </p>
          )}
        </div>
      )}

      {/* Bulk results — one card per generated article */}
      {bulkResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Generated Articles
              <span className="text-xs text-zinc-500 font-normal">{bulkResults.length} article{bulkResults.length !== 1 ? 's' : ''}</span>
            </h3>
            <button onClick={() => { setBulkResults([]); setExpandedBulkIdx(null); localStorage.removeItem('agents_bulk_results'); }} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Clear
            </button>
          </div>
          {bulkResults.map((r, idx) => (
            <div key={idx} className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <span className="text-xs font-bold text-zinc-500 shrink-0 w-5 text-center">{idx + 1}</span>
                <span className="flex-1 text-sm text-zinc-200 font-medium truncate">{r.topic}</span>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => navigator.clipboard.writeText(r.article)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                    title="Copy article"
                  >
                    <Copy className="w-3 h-3" /> Article
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.schema)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                    title="Copy JSON-LD schema"
                  >
                    <Copy className="w-3 h-3" /> Schema
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([r.article], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `${r.topic.replace(/\s+/g, '-').toLowerCase().slice(0, 60)}.md`;
                      a.click(); URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                    title="Download .md"
                  >
                    <Download className="w-3 h-3" /> .md
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('contentScorer_draft', JSON.stringify({ content: r.article, type: 'blog' }));
                      router.push('/dashboard/content-scorer');
                    }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors"
                  >
                    Score →
                  </button>
                  <button
                    onClick={() => setExpandedBulkIdx(expandedBulkIdx === idx ? null : idx)}
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-md transition-colors"
                    title={expandedBulkIdx === idx ? 'Collapse' : 'Preview'}
                  >
                    {expandedBulkIdx === idx ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {expandedBulkIdx === idx && (
                <div className="border-t border-zinc-800 p-4 space-y-3">
                  <div className="bg-zinc-950 rounded-lg p-4 text-xs text-zinc-300 max-h-64 overflow-y-auto prose prose-invert prose-xs max-w-none">
                    <ReactMarkdown>{r.article}</ReactMarkdown>
                  </div>
                  <details>
                    <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none flex items-center gap-1">
                      <Code2 className="w-3 h-3" /> View JSON-LD Schema
                    </summary>
                    <div className="mt-2 bg-zinc-950 rounded-lg p-3 font-mono text-xs text-zinc-400 max-h-40 overflow-y-auto">
                      <pre>{r.schema}</pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {correctionSnippets.length > 0 && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Counter-article mode</p>
            <p className="text-xs text-zinc-400 mt-0.5">The article will explicitly counter this misinformation: <span className="italic text-amber-200">"{correctionSnippets[0]}"</span></p>
          </div>
        </div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden relative p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {rateLimitWarning && (
            <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-400">
                  {rateLimitWarning.includes('401') || rateLimitWarning.includes('UNAUTHENTICATED') || rateLimitWarning.includes('service account')
                    ? 'API Key Invalid — Service Account Disabled'
                    : rateLimitWarning.includes('429') || rateLimitWarning.includes('rate limit')
                      ? 'API Rate Limit Exceeded'
                      : 'Agent Workflow Error'}
                </h4>
                <p className="text-sm text-red-300 mt-1">{rateLimitWarning}</p>
                {(rateLimitWarning.includes('401') || rateLimitWarning.includes('service account')) && (
                  <p className="text-xs text-red-300/70 mt-2">
                    The Google Cloud service account tied to your Gemini API key has been disabled. Generate a new key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline">aistudio.google.com</a> and update <code className="bg-red-900/30 px-1 rounded">GEMINI_API_KEY</code> in your Netlify environment variables.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mb-12 bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-base font-semibold text-white mb-4">Initialize GEO Content Run</h3>
            <div className="flex gap-3">
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter a topic (e.g., 'Serverless Edge Computing Latency')" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50" disabled={isOrchestrating || isBulkRunning} />
              <button onClick={handleRunOrchestration} disabled={isOrchestrating || isBulkRunning || !topic.trim()} className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                {isOrchestrating ? <><Loader2 className="w-4 h-4 animate-spin" />Running Crew...</> : <><Play className="w-4 h-4 fill-current" />Start Workflow</>}
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -translate-y-1/2 z-0 hidden md:block">
              <div className="h-full bg-pink-500 transition-all duration-1000 ease-in-out" style={{ width: progressWidth }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
              {[
                { status: crawlerStatus, label: 'Crawler Agent', sub: 'Neural Search', activeText: 'Fetching Data', Icon: Search, color: 'blue' },
                { status: extractionStatus, label: 'Extraction Agent', sub: 'Fact Isolation', activeText: 'Extracting Facts', Icon: FileText, color: 'amber' },
                { status: schemaStatus, label: 'Schema Agent', sub: 'JSON-LD Generator', activeText: 'Writing Code', Icon: Code2, color: 'emerald' },
                { status: synthesisStatus, label: 'Synthesis Agent', sub: 'Final Report Writer', activeText: 'Writing Article', Icon: PenTool, color: 'purple' },
              ].map(({ status, label, sub, activeText, Icon, color }) => (
                <div key={label} className={`bg-zinc-950 border ${status === 'running' ? 'border-pink-500 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]' : 'border-zinc-800'} rounded-xl p-5 text-center transition-all duration-300`}>
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 transition-colors ${status === 'running' ? `bg-${color}-500/20 text-${color}-400 border border-${color}-500/50` : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{label}</h3>
                  <p className="text-xs text-zinc-500 mb-3">{sub}</p>
                  <StatusBadge status={status} activeText={activeText} />
                </div>
              ))}
            </div>
          </div>

          {showResults && (
            <div className="mt-12 space-y-6 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h3 className="text-lg font-bold text-white">Orchestration Results</h3>
                {restoredFromSession && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">Restored from last session</span>
                    <button
                      onClick={() => {
                        resetState();
                        localStorage.removeItem('agents_last_result');
                        setRestoredFromSession(false);
                      }}
                      className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-md transition-colors"
                    >
                      Start fresh
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-amber-400">
                    <FileText className="w-4 h-4" />
                    <h4 className="text-sm font-semibold text-white">Isolated Facts (No Hallucinations)</h4>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-4 text-xs text-zinc-300">
                    <ReactMarkdown>{extractedFacts}</ReactMarkdown>
                  </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Code2 className="w-4 h-4" />
                      <h4 className="text-sm font-semibold text-white">Generated JSON-LD Schema</h4>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(generatedSchema)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                        title="Copy JSON-LD to clipboard"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([generatedSchema], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = `${topic.replace(/\s+/g, '-').toLowerCase()}-schema.json`;
                          a.click(); URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                        title="Download as .json"
                      >
                        <Download className="w-3 h-3" /> .json
                      </button>
                    </div>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-4 text-sm text-zinc-300 overflow-x-auto font-mono text-xs max-h-[200px] overflow-y-auto">
                    <pre>{generatedSchema}</pre>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-lg border-t-4 border-t-pink-500">
                <div className="flex items-center gap-2 mb-4 text-purple-400">
                  <PenTool className="w-5 h-5" />
                  <h4 className="text-base font-semibold text-white">Final Synthesized Content</h4>
                </div>
                <div className="text-sm text-zinc-300 prose prose-invert max-w-none">
                  <ReactMarkdown>{finalArticle}</ReactMarkdown>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-col gap-3">
                  {publishMsg && (
                    <p className={`text-xs px-3 py-2 rounded-md ${publishMsg.startsWith('Error') ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {publishMsg}
                    </p>
                  )}
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">What to do next</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(finalArticle)}
                      className="flex items-center gap-1.5 text-sm px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Article
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([finalArticle], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `${topic.replace(/\s+/g, '-').toLowerCase()}.md`;
                        a.click(); URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1.5 text-sm px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download .md
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem('contentScorer_draft', JSON.stringify({ content: finalArticle, type: 'blog' }));
                        router.push('/dashboard/content-scorer');
                      }}
                      className="flex items-center gap-1.5 text-sm px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" /> Score for GEO →
                    </button>
                    <button onClick={handlePublishToCms} disabled={isPublishing} className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black rounded-md font-medium transition-colors ml-auto">
                      {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      {isPublishing ? 'Publishing...' : userData?.cmsWebhookUrl ? 'Publish to CMS' : 'Save Article'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showResults && !isOrchestrating && (
            <div className="mt-8 bg-zinc-950 border border-zinc-800 rounded-lg p-5">
              <h4 className="text-sm font-semibold text-white mb-2">Why Multi-Agent?</h4>
              <p className="text-sm text-zinc-400">Monolithic prompts lead to &ldquo;Lost in the Middle&rdquo; syndrome and hallucinations. By separating concerns, the Schema Agent never hallucinates facts, and the Extraction Agent never breaks JSON syntax. This ensures enterprise-grade accuracy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
