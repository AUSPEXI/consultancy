'use client'

import { useState, useEffect } from 'react';
import { Search, FileText, Code2, PenTool, CheckCircle2, Loader2, Play, ArrowRight, X, BrainCircuit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import ReactMarkdown from 'react-markdown';
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { checkTierAccess } from '@/constants/tiers';

type AgentStatus = 'idle' | 'running' | 'completed' | 'error';

export default function AgentsPage() {
  const { tier, userData, user, role } = useAuth();
  const [topic, setTopic] = useState('');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [rateLimitWarning, setRateLimitWarning] = useState('');

  const [crawlerStatus, setCrawlerStatus] = useState<AgentStatus>('idle');
  const [extractionStatus, setExtractionStatus] = useState<AgentStatus>('idle');
  const [schemaStatus, setSchemaStatus] = useState<AgentStatus>('idle');
  const [synthesisStatus, setSynthesisStatus] = useState<AgentStatus>('idle');

  const [extractedFacts, setExtractedFacts] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState('');
  const [finalArticle, setFinalArticle] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const handleSetTopic = (e: any) => { if (e.detail?.topic) setTopic(e.detail.topic); };
    window.addEventListener('set-agent-topic', handleSetTopic);
    return () => window.removeEventListener('set-agent-topic', handleSetTopic);
  }, []);

  if (role !== 'admin' && !checkTierAccess(tier, 'Premium')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Multi-Agent Orchestration</h1>
          <p className="text-zinc-400">Deploy specialized AI agents to crawl, extract, structure, and synthesize GEO-optimized content.</p>
        </div>
        <UpgradePrompt title="Multi-Agent Orchestration Locked" description="Upgrade to the Premium tier to access the full Prompt-to-Conversion Pipeline and deploy specialized AI agents for automated content generation." requiredTier="Premium" />
      </div>
    );
  }

  const resetState = () => {
    setCrawlerStatus('idle'); setExtractionStatus('idle'); setSchemaStatus('idle'); setSynthesisStatus('idle');
    setExtractedFacts(''); setGeneratedSchema(''); setFinalArticle(''); setShowResults(false); setRateLimitWarning('');
  };

  const runOrchestration = async () => {
    if (!topic.trim()) return;
    setIsOrchestrating(true);
    resetState();
    try {
      let vaultContext = '';
      if (user) {
        try {
          const { query: fsQuery, collection: fsCollection, getDocs, where } = await import('firebase/firestore');
          const q = fsQuery(fsCollection(db, 'knowledge_graph'), where('userId', '==', user.uid));
          const snapshot = await getDocs(q);
          const factsArray = snapshot.docs.map(doc => doc.data().fact);
          if (factsArray.length > 0) vaultContext = factsArray.join('\n- ');
        } catch (e) { console.warn('Failed to fetch vault for extraction', e); }
      }

      setCrawlerStatus('running');
      const crawlRes = await fetch('/api/agent/crawl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic }) });
      const crawlData = await crawlRes.json();
      if (!crawlData.success) throw new Error(crawlData.error);
      setCrawlerStatus('completed');

      setExtractionStatus('running');
      const extractRes = await fetch('/api/agent/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, crawlerData: crawlData.result, vaultContext }) });
      const extractData = await extractRes.json();
      if (!extractData.success) throw new Error(extractData.error);
      const facts = extractData.result || 'No facts extracted.';
      setExtractedFacts(facts);
      setExtractionStatus('completed');

      await new Promise(res => setTimeout(res, 5000));

      setSchemaStatus('running');
      const schemaRes = await fetch('/api/agent/schema', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ facts }) });
      const schemaData = await schemaRes.json();
      if (!schemaData.success) throw new Error(schemaData.error);
      const schema = schemaData.result || '{}';
      setGeneratedSchema(schema);
      setSchemaStatus('completed');

      await new Promise(res => setTimeout(res, 5000));

      setSynthesisStatus('running');
      const synthRes = await fetch('/api/agent/synthesize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, facts, brandName: userData?.brand || '' }) });
      const synthData = await synthRes.json();
      if (!synthData.success) throw new Error(synthData.error);
      setFinalArticle(synthData.result || 'Failed to generate article.');
      setSynthesisStatus('completed');
      setShowResults(true);
    } catch (error: any) {
      console.error('Orchestration failed:', error);
      if (error?.message?.includes('429')) setRateLimitWarning('Google API rate limit exceeded. Please wait a bit.');
      setCrawlerStatus(prev => prev === 'running' ? 'error' : prev);
      setExtractionStatus(prev => prev === 'running' ? 'error' : prev);
      setSchemaStatus(prev => prev === 'running' ? 'error' : prev);
      setSynthesisStatus(prev => prev === 'running' ? 'error' : prev);
      alert('Agent workflow failed. Check console for details.');
    } finally {
      setIsOrchestrating(false);
    }
  };

  const handlePublishToCms = async () => {
    setIsPublishing(true);
    try {
      const articlePayload = { userId: user?.uid || 'anonymous', topic, article: finalArticle, facts: extractedFacts, schema: generatedSchema, brand: userData?.brand || '', timestamp: new Date().toISOString() };
      await addDoc(collection(db, 'articles'), articlePayload);
      if (userData?.cmsWebhookUrl) {
        const response = await fetch(userData.cmsWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(articlePayload) });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert(userData?.cmsWebhookUrl ? 'Successfully saved to Database and published via Webhook!' : 'Successfully saved to Native Database!');
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish content. Check console for details.');
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
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Agent Orchestration</h1>
        <p className="text-sm text-zinc-400 mt-1">Run specialized AI crews to prevent hallucinations and generate GEO content.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden relative p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {rateLimitWarning && (
            <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-400">API Quota Exhausted</h4>
                <p className="text-sm text-red-300 mt-1">{rateLimitWarning}</p>
              </div>
            </div>
          )}

          <div className="mb-12 bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-base font-semibold text-white mb-4">Initialize GEO Content Run</h3>
            <div className="flex gap-3">
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter a topic (e.g., 'Serverless Edge Computing Latency')" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50" disabled={isOrchestrating} />
              <button onClick={runOrchestration} disabled={isOrchestrating || !topic.trim()} className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
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
              <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">Orchestration Results</h3>
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
                  <div className="flex items-center gap-2 mb-3 text-emerald-400">
                    <Code2 className="w-4 h-4" />
                    <h4 className="text-sm font-semibold text-white">Generated JSON-LD Schema</h4>
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
                <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('draft-content', { detail: { content: finalArticle, type: 'blog' } }));
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <BrainCircuit className="w-4 h-4" /> Verify AI Extractability
                  </button>
                  <button onClick={handlePublishToCms} disabled={isPublishing} className="bg-white hover:bg-zinc-200 disabled:opacity-50 text-black px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                    {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isPublishing ? 'Publishing...' : 'Publish to Database & CMS'} <ArrowRight className="w-4 h-4" />
                  </button>
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
