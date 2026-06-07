'use client'

import { useState, useEffect } from 'react';
import { PenTool, Loader2, CheckCircle2, AlertTriangle, ArrowRight, LayoutTemplate, FileText, BookOpen, Database, Megaphone, Code2, Download, FlaskConical } from 'lucide-react';
import { WorkflowProgress, markStepComplete } from '@/components/dashboard/WorkflowProgress';
import { useAuth } from '@/contexts/AuthContext';
import { checkTierAccess } from '@/constants/tiers';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { logAuditAction } from '@/lib/audit';
import { authFetch } from '@/lib/auth-fetch';
import { AmplifyModal } from '@/components/ui/AmplifyModal';
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

type ContentType = 'sales' | 'blog' | 'technical';

export default function ContentScorerPage() {
  const { tier, role, user, userData } = useAuth();
  const [content, setContent] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('contentScorer_content') || '';
    return '';
  });
  const [contentType, setContentType] = useState<ContentType>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('contentScorer_contentType') as ContentType) || 'sales';
    return 'sales';
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('contentScorer_result');
      if (saved) { try { return JSON.parse(saved); } catch { return null; } }
    }
    return null;
  });
  const [isPreviewingUpdate, setIsPreviewingUpdate] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [showAmplifyModal, setShowAmplifyModal] = useState(false);
  const [isSavingFacts, setIsSavingFacts] = useState(false);
  const [factsSaved, setFactsSaved] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [labLevers, setLabLevers] = useState<any[]>([]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Pull the GEO Lab's validated content levers so the recommendations shown
  // here are grounded in the lab's real A/B citation experiments, not guesswork.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/api/geo-findings');
        const data = await res.json();
        if (!cancelled && data.success) setLabLevers(data.recommendations || []);
      } catch {
        /* non-blocking — the panel simply stays hidden if the loop has no data yet */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { localStorage.setItem('contentScorer_content', content); }, [content]);
  useEffect(() => { localStorage.setItem('contentScorer_contentType', contentType); }, [contentType]);
  useEffect(() => {
    if (result) localStorage.setItem('contentScorer_result', JSON.stringify(result));
    else localStorage.removeItem('contentScorer_result');
  }, [result]);

  // Read draft passed from agents page via localStorage
  useEffect(() => {
    const stored = localStorage.getItem('contentScorer_draft');
    if (stored) {
      try {
        const { content: c, type: t } = JSON.parse(stored);
        if (c) { setContent(c); setContentType(t || 'blog'); }
      } catch (_) {}
      localStorage.removeItem('contentScorer_draft');
    }
  }, []);

  useEffect(() => {
    const handleDraftContent = (e: Event) => {
      const customEvent = e as CustomEvent<{ content: string; type: ContentType }>;
      setContent(customEvent.detail.content);
      setContentType(customEvent.detail.type);
    };
    window.addEventListener('draft-content', handleDraftContent);
    return () => window.removeEventListener('draft-content', handleDraftContent);
  }, []);

  const handleDownloadMarkdown = () => {
    if (!content.trim()) return;
    const header = `# Content (${contentType}) — GEO Score: ${result?.overallScore ?? '?'}/100\n\n`;
    const blob = new Blob([header + content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `article-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded as Markdown.', 'info');
  };

  const handlePublish = async () => {
    if (!user || !content.trim()) return;
    setIsPublishing(true);
    try {
      if (userData?.cmsWebhookUrl) {
        const payload = { content, contentType, score: result?.overallScore, rewrittenSnippet: result?.rewrittenSnippet || '', brand: userData?.brand || '', timestamp: new Date().toISOString() };
        const res = await fetch(userData.cmsWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
        showToast('Published to your CMS via webhook.', 'success');
      } else {
        // No webhook — download as Markdown
        const header = `# Content (${contentType}) — GEO Score: ${result?.overallScore ?? '?'}/100\n\n`;
        const blob = new Blob([header + content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `article-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Downloaded as Markdown. Add a CMS Webhook in Settings to publish directly.', 'info');
      }
      await logAuditAction(user.uid, 'Published Content', { contentType, score: result?.overallScore, method: userData?.cmsWebhookUrl ? 'webhook' : 'download' });
      setPublishSuccess(true);
      setTimeout(() => { setPublishSuccess(false); setIsPreviewingUpdate(false); }, 3000);
    } catch (err: any) {
      showToast(`Publish failed: ${err.message}`, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveFacts = async () => {
    if (!user || !result || !content.trim()) return;
    setIsSavingFacts(true);
    try {
      const response = await fetch('/api/extract-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, contentType, userId: user.uid })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      const facts = data.facts || [];
      const dateStr = new Date().toISOString().split('T')[0];
      for (const fact of facts) {
        // extract-facts now returns { statement, embedding } objects
        const statement = typeof fact === 'string'
          ? fact.substring(0, 1000)
          : (fact.statement ?? JSON.stringify(fact)).substring(0, 1000);
        const payload: Record<string, any> = {
          userId: user.uid,
          statement,
          entropyScore: Math.floor(Math.random() * 40) + 60,
          cliffhangerActive: false,
          category: contentType,
          createdAt: dateStr,
        };
        if (fact.embedding?.length > 0) {
          payload.embedding = fact.embedding;
          if (fact.embeddingSpace) payload.embeddingSpace = fact.embeddingSpace;
        }
        await addDoc(collection(db, 'facts'), payload);
      }
      await logAuditAction(user.uid, 'Extracted facts to Vault', { count: facts.length });
      setFactsSaved(true);
      setTimeout(() => setFactsSaved(false), 3000);
    } catch (e) {
      console.error(e);
      showToast('Failed to save facts.', 'error');
    } finally {
      setIsSavingFacts(false);
    }
  };

  if (role !== 'admin' && !checkTierAccess(tier, 'Starter')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Pre-Publish Content Scorer</h1>
          <p className="text-zinc-400">Analyze your content for &ldquo;Machine Readability&rdquo; before you publish.</p>
        </div>
        <UpgradePrompt title="Content Scorer Locked" description="Upgrade to the Starter tier to access the Pre-Publish Content Scorer and ensure your content is optimized for LLM extraction." requiredTier="Starter" />
      </div>
    );
  }

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      if (!user) throw new Error('User required');
      const res = await authFetch('/api/content-scorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, contentType, userId: user.uid })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Analysis failed');
      const parsedResult = data.result;
      setResult(parsedResult);
      markStepComplete(4);
      // Pre-load content into Technical page for schema generation
      localStorage.setItem('technical_content_source', JSON.stringify({ content, score: parsedResult.overallScore }));
      if (user) await logAuditAction(user.uid, 'Scored Content', { contentType, score: parsedResult.overallScore });
    } catch (error) {
      console.error('Error scoring content:', error);
      showToast('Failed to analyze content. Please try again.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : 'bg-zinc-900/90 border-zinc-700 text-zinc-300'}`}>
          <span className="text-sm font-bold tracking-tight">{toast.text}</span>
        </div>
      )}
      <WorkflowProgress currentStep={4} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <PenTool className="w-6 h-6 text-pink-500" />
            Pre-Publish Content Scorer
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Analyze your content for &ldquo;Machine Readability&rdquo; before you publish.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <label className="block text-sm font-medium text-zinc-300 mb-3">What type of content is this?</label>
            <div className="grid grid-cols-3 gap-2">
              {([['sales', 'Sales / Landing Page', LayoutTemplate, 'pink'], ['blog', 'Blog / Article', FileText, 'emerald'], ['technical', 'Technical Docs', BookOpen, 'amber']] as const).map(([type, label, Icon, color]) => (
                <button key={type} onClick={() => setContentType(type as ContentType)} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${contentType === type ? `bg-${color}-500/10 border-${color}-500/50 text-${color}-400` : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'}`}>
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Paste your draft here..." className="w-full h-80 bg-zinc-950 border border-zinc-800/50 rounded-lg p-4 text-zinc-300 placeholder-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-sm" />
          </div>
          <button onClick={handleAnalyze} disabled={isAnalyzing || !content.trim()} className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Intent &amp; Readability...</> : <><PenTool className="w-4 h-4" /> Analyze Content</>}
          </button>

          {labLevers.length > 0 && (
            <div className="bg-zinc-900/50 border border-indigo-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Lab-Validated GEO Levers</h3>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                Apply these while drafting — each is backed by a real A/B citation experiment in the Auspexi GEO Lab.
              </p>
              <div className="space-y-2">
                {labLevers.map((lev) => (
                  <div key={lev.lever} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-indigo-300">{lev.headline}</p>
                      {lev.topEffect && (
                        <span className="shrink-0 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {lev.topEffect.diffPp > 0 ? '+' : ''}{lev.topEffect.diffPp}pp · {lev.topEffect.platform}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{lev.recommendation}</p>
                    {lev.topEffect && (
                      <p className="text-[10px] text-zinc-600 mt-1.5">
                        p={lev.topEffect.pValue}{lev.trialsPerVariant ? ` · n=${lev.trialsPerVariant}/variant` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-white">Overall GEO Score</h3>
                  <p className="text-xs text-zinc-500 mt-1">Optimized for {contentType} intent</p>
                </div>
                <div className={`text-4xl font-bold tracking-tighter ${getScoreColor(result.overallScore)}`}>{result.overallScore}/100</div>
              </div>
              <div className="space-y-5">
                {[['Entity Density', result.entityDensityScore], ['Statistical Anchors', result.statisticalAnchorsScore], ['Inverted Pyramid', result.invertedPyramidScore]].map(([label, score]) => (
                  <div key={label as string}>
                    <div className="flex justify-between text-xs font-medium mb-2">
                      <span className="text-zinc-400 uppercase tracking-wider">{label}</span>
                      <span className={getScoreColor(score as number)}>{score as number}/100</span>
                    </div>
                    <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-pink-500 h-full rounded-full transition-all duration-1000" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Actionable Feedback
              </h3>
              <ul className="space-y-3">
                {result.feedback.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                    <ArrowRight className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
              <h3 className="text-sm font-semibold text-pink-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Suggested Rewrite (GEO-Optimized)
              </h3>
              <p className="text-sm text-pink-100/80 leading-relaxed bg-zinc-950/50 p-4 rounded-lg border border-pink-500/10 mb-4">{result.rewrittenSnippet}</p>
              {!isPreviewingUpdate ? (
                <button onClick={() => setIsPreviewingUpdate(true)} className="w-full py-2.5 bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <LayoutTemplate className="w-4 h-4" /> Preview Auto-Update on Website
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      {userData?.cmsWebhookUrl ? 'Publish via Configured Webhook' : 'Download Article'}
                    </h4>
                    <p className="text-sm text-zinc-400 mb-4">
                      {userData?.cmsWebhookUrl
                        ? `This will POST the scored content to ${userData.cmsWebhookUrl}. Use Download if you prefer a local copy.`
                        : 'No CMS webhook configured. Download as Markdown, or add a webhook URL in Settings to push directly to your CMS.'}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {userData?.cmsWebhookUrl && (
                        <button onClick={handlePublish} disabled={isPublishing || publishSuccess} className="flex-1 min-w-[140px] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                          {isPublishing ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</> : publishSuccess ? <><CheckCircle2 className="w-4 h-4" /> Done</> : <><CheckCircle2 className="w-4 h-4" /> Publish to CMS</>}
                        </button>
                      )}
                      <button onClick={handleDownloadMarkdown} disabled={isPublishing} className="flex-1 min-w-[140px] py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        <Download className="w-4 h-4" /> Download Markdown
                      </button>
                      <button onClick={() => setIsPreviewingUpdate(false)} disabled={isPublishing} className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {result.overallScore > 80 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2"><Megaphone className="w-4 h-4 text-emerald-400" />Ready for Omnichannel Distribution</h3>
                    <p className="text-xs text-zinc-400">Because this content scored highly (&gt;{result.overallScore}%), it is extractable enough to seed into LinkedIn and Reddit without losing its core entities.</p>
                  </div>
                  <button onClick={() => setShowAmplifyModal(true)} className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <Megaphone className="w-4 h-4" /> Push to Omnichannel Amplifier
                  </button>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2"><Database className="w-4 h-4 text-blue-400" />Reverse-Extract Knowledge</h3>
                    <p className="text-xs text-zinc-400">Automatically isolate the core statements from this text and save them back into your Fact-Vault as persistent, verifiable JSON-LD atomic facts.</p>
                  </div>
                  <button onClick={handleSaveFacts} disabled={isSavingFacts || factsSaved} className="w-full py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSavingFacts ? <Loader2 className="w-4 h-4 animate-spin" /> : factsSaved ? <CheckCircle2 className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                    {isSavingFacts ? 'Extracting...' : factsSaved ? 'Saved to Vault' : 'Extract into Fact-Vault'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5 CTA — only shown after scoring */}
        {result && (
          <div className="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Code2 className="w-4 h-4 text-pink-400" />
              <div>
                <p className="text-sm font-medium text-white">Ready for Step 5: Schema & Deploy</p>
                <p className="text-xs text-zinc-500">Your content has been pre-loaded into the Schema generator.</p>
              </div>
            </div>
            <a
              href="/dashboard/technical"
              className="flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Next: Schema & Deploy <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
      {showAmplifyModal && <AmplifyModal fact={content} onClose={() => setShowAmplifyModal(false)} />}
    </div>
  );
}
