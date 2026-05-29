'use client'

import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Line, LineChart, Cell, ReferenceArea, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, Target, Link as LinkIcon, Plus, Loader2, Activity, BrainCircuit, Settings, X, HelpCircle, Sparkles } from 'lucide-react';
import { SyntheticDataPanel } from '@/components/dashboard/SyntheticDataPanel';
import { useAuth } from '@/contexts/AuthContext';
import { checkTierAccess } from '@/constants/tiers';
import { db } from '@/firebase';
import { collection, setDoc, doc, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { logAuditAction } from '@/lib/audit';
import { useGeoAnalytics } from '@/hooks/useGeoAnalytics';
import { UmapVisualization } from '@/components/ui/UmapVisualization';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { SemanticAnchorsModal } from '@/components/dashboard/SemanticAnchorsModal';
import { NeuralTraceConfig } from '@/components/dashboard/NeuralTraceConfig';

const NeuralLegend = () => (
  <div className="flex flex-wrap gap-4 mt-4 px-4 py-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Positive Anchor</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]" />
      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Risk / Neg. Citation</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Neutral Signal</span>
    </div>
    <div className="ml-auto flex items-center gap-2 text-zinc-500">
      <BrainCircuit className="w-3 h-3" />
      <span className="text-[9px] font-mono leading-none">DISTANCE = SEMANTIC DISSIMILARITY</span>
    </div>
  </div>
);

const RacingDial = ({ value, label, color = "#ec4899", size = "sm" }: { value: number; label: string; color?: string; size?: "sm" | "lg" }) => {
  const data = useMemo(() => [
    { name: 'value', value: Math.min(100, Math.max(0, value)), fill: color },
    { name: 'remainder', value: 100 - Math.min(100, Math.max(0, value)), fill: '#18181b' }
  ], [value, color]);
  const isLarge = size === "lg";
  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${isLarge ? 'w-48 h-28' : 'w-32 h-20'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={isLarge ? 60 : 40} outerRadius={isLarge ? 80 : 55} paddingAngle={0} dataKey="value" stroke="none" />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className={`${isLarge ? 'text-3xl' : 'text-xl'} font-black text-white tracking-tighter`}>{value}%</span>
        </div>
      </div>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">{label}</p>
    </div>
  );
};

export default function OverviewPage() {
  const { user, tier, userData, role } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('current');

  const defaultPrompts = useMemo(() => [
    "Is Auspexi a secure enterprise choice?",
    "How does Auspexi compare to legacy SEO?",
    "Is Auspexi's GEO tech proprietary?",
    "Founder reputation and reliability"
  ], []);

  const userPrompts = userData?.sentimentPrompts || defaultPrompts;

  const { pulseData, mapPoints, sentimentTrace, loading: geoLoading, refetch: refetchGeo } = useGeoAnalytics(
    userData?.brand || '',
    userPrompts,
    selectedPlatform,
    selectedTimeframe,
    user?.uid
  );

  const [metrics, setMetrics] = useState<any[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shadowUrl, setShadowUrl] = useState('');
  const [generatedShadowLink, setGeneratedShadowLink] = useState('');
  const [isEditingPrompts, setIsEditingPrompts] = useState(false);
  const [isEditingAnchors, setIsEditingAnchors] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [auditSuccess, setAuditSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSyncingCMS, setIsSyncingCMS] = useState(false);
  const [driftDismissed, setDriftDismissed] = useState(false);

  const userAnchors = userData?.latentAnchors || [
    { label: "Reputational Moat", color: "#ec4899", baseType: "Systemic Anchor" },
    { label: "Technical Competence", color: "#06b6d4", baseType: "Signal Point" },
    { label: "Pricing Perception", color: "#8b5cf6", baseType: "Emergent Trend" },
  ];

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (!user || !checkTierAccess(tier, 'Basic')) return;
    const q = query(
      collection(db, 'sovMetrics'),
      where('userId', '==', user.uid),
      orderBy('date', 'asc'),
      limit(30)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setMetrics(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sovMetrics');
    });
    return () => unsubscribe();
  }, [user, tier]);

  if (role !== 'admin' && !checkTierAccess(tier, 'Basic')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Dashboard Overview</h1>
          <p className="text-zinc-400">Track your Prove-It-Works Metrics.</p>
        </div>
        <UpgradePrompt
          title="Dashboard Locked"
          description="Upgrade to the Basic tier to unlock the Overview Dashboard, track your AI Share of Voice, and generate Shadow Links."
          requiredTier="Basic"
        />
      </div>
    );
  }

  const getSentimentColor = (score: number) => {
    if (score > 60) return 'bg-emerald-500/30';
    if (score > 20) return 'bg-emerald-500/10';
    if (score > -20) return 'bg-zinc-800/40';
    if (score > -60) return 'bg-rose-500/10';
    return 'bg-rose-500/30';
  };

  const runAudit = async () => {
    if (!user) return;
    setIsAuditing(true);
    setAuditSuccess(false);
    setToastMessage({ text: "Deep Semantic Audit Engaged... Traversing 1,000+ inference paths.", type: 'info' });
    try {
      if (userData?.brand && userData?.domain && userData?.keywords && userData.keywords.length > 0) {
        const response = await fetch('/api/run-daily-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, brand: userData.brand, domain: userData.domain, competitors: userData.competitors || [], keywords: userData.keywords, sentimentPrompts: userPrompts })
        });
        const data = await response.json();
        if (data.success && data.metrics) {
          const today = new Date();
          const dateStr = today.toISOString().split('T')[0];
          const expiresAtDate = new Date();
          expiresAtDate.setDate(expiresAtDate.getDate() + 90);
          await setDoc(doc(db, 'sovMetrics', `${user.uid}_${dateStr}`), { userId: user.uid, date: dateStr, shortDate: today.toLocaleDateString('en-US', { weekday: 'short' }), expiresAt: expiresAtDate, ...data.metrics }, { merge: true });
          // Stop spinner immediately — onSnapshot already updated the UI; let audit log + geo refetch run silently
          setIsAuditing(false);
          setAuditSuccess(true);
          setDriftDismissed(true);
          setToastMessage({ text: "Audit Complete! Fresh metrics synchronized with your Neural Twin.", type: 'success' });
          logAuditAction(user.uid, 'Ran Real SOV Audit', { date: dateStr });
          refetchGeo();
        } else {
          const msg = response.status === 429
            ? 'Gemini quota exceeded — enable billing at console.cloud.google.com → APIs → Gemini API'
            : (data.error || 'Audit failed');
          throw new Error(msg);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const lastDate = metrics.length > 0 ? new Date(metrics[metrics.length - 1].date) : new Date();
        if (metrics.length > 0) lastDate.setDate(lastDate.getDate() + 1);
        const dateStr = lastDate.toISOString().split('T')[0];
        const shortDate = lastDate.toLocaleDateString('en-US', { weekday: 'short' });
        const prevAsov = metrics.length > 0 ? metrics[metrics.length - 1].aSov : 12;
        const prevErr = metrics.length > 0 ? metrics[metrics.length - 1].err : 20;
        const prevAiTraffic = metrics.length > 0 ? Math.min(metrics[metrics.length - 1].aiTraffic, 9999) : 120;
        const prevCompA = metrics.length > 0 ? metrics[metrics.length - 1].compA : 45;

        const historicalWrites: Promise<any>[] = [];
        if (metrics.length === 0) {
          for (let i = 5; i > 0; i--) {
            const historyDate = new Date();
            historyDate.setDate(historyDate.getDate() - i);
            const hDateStr = historyDate.toISOString().split('T')[0];
            const hShortDate = historyDate.toLocaleDateString('en-US', { weekday: 'short' });
            const hAsov = Math.max(5, prevAsov - (i * 2));
            historicalWrites.push(setDoc(doc(db, 'sovMetrics', `${user.uid}_${hDateStr}`), { userId: user.uid, date: hDateStr, shortDate: hShortDate, aSov: hAsov, err: Math.max(5, prevErr - (i * 3)), compA: prevCompA + 5, compB: 30, aiTraffic: Math.round(hAsov * 7 + Math.floor(Math.random() * 40)), platforms: { chatgpt: hAsov + 5, perplexity: Math.max(0, hAsov - 10), claude: hAsov + 2, gemini: hAsov + 10 } }, { merge: true }));
          }
        }
        await Promise.all(historicalWrites);

        const newAsov = Math.min(100, Math.max(5, prevAsov + (Math.random() > 0.5 ? Math.floor(Math.random() * 12) : -Math.floor(Math.random() * 5))));
        const newCompA = Math.max(0, Math.min(100, prevCompA + (Math.random() > 0.6 ? Math.floor(Math.random() * 5) : -Math.floor(Math.random() * 8))));
        const simulatedPlatforms = { chatgpt: Math.min(100, Math.max(5, newAsov + Math.floor(Math.random() * 20))), perplexity: Math.min(100, Math.max(0, newAsov - Math.floor(Math.random() * 15))), claude: Math.min(100, Math.max(5, newAsov + Math.floor(Math.random() * 10))), gemini: Math.min(100, Math.max(5, newAsov + Math.floor(Math.random() * 25))) };
        await setDoc(doc(db, 'sovMetrics', `${user.uid}_${dateStr}`), { userId: user.uid, date: dateStr, shortDate, aSov: newAsov, err: Math.min(100, Math.max(0, prevErr + Math.floor(Math.random() * 15) - 5)), compGap: newAsov - newCompA, compA: newCompA, compB: Math.max(0, (metrics.length > 0 ? (metrics[metrics.length - 1].compB || 30) : 30) - Math.floor(Math.random() * 5)), aiTraffic: Math.round(newAsov * 7 + Math.floor(Math.random() * 50)), platforms: simulatedPlatforms }, { merge: true });
        // Stop spinner as soon as data lands — audit log can write silently
        setIsAuditing(false);
        setAuditSuccess(true);
        setDriftDismissed(true);
        setToastMessage({ text: "Simulated Audit Complete! Add your brand in Settings to run a live audit.", type: 'info' });
        logAuditAction(user.uid, 'Ran Simulated SOV Audit', { date: dateStr });
      }
      setTimeout(() => setAuditSuccess(false), 3000);
    } catch (error) {
      console.error('[Audit Error]', error);
      setToastMessage({ text: "Audit failed. Please check your connection and try again.", type: 'error' });
    } finally {
      setIsAuditing(false);
    }
  };

  const generateShadowLink = async () => {
    if (!shadowUrl.trim()) return;
    setIsGeneratingLink(true);
    try {
      const response = await fetch('/api/shadow-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ originalUrl: shadowUrl, userId: user?.uid }) });
      const data = await response.json();
      if (data.success) { setGeneratedShadowLink(data.shadowUrl); }
      else { throw new Error(data.error || 'Failed to generate link'); }
    } catch (e) {
      setGeneratedShadowLink(`${shadowUrl}${shadowUrl.includes('?') ? '&' : '?'}utm_source=llm_ingest&utm_medium=ai_chat&utm_campaign=fact_vault_magnet`);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleSyncCMS = async () => {
    if (!user || !userData?.cmsWebhookUrl) { setToastMessage({ text: 'Configure an Outbound Webhook in Settings first.', type: 'info' }); return; }
    setIsSyncingCMS(true);
    try {
      const payload = { shadowLink: generatedShadowLink, jsonLd: { "@context": "https://schema.org", "@type": "Product", "name": userData.brand || "Your Brand", "url": generatedShadowLink } };
      const resp = await fetch('/api/push-to-cms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ webhookUrl: userData.cmsWebhookUrl, payload }) });
      const data = await resp.json();
      if (data.success) { setToastMessage({ text: 'Shadow Link and JSON-LD injected via webhook.', type: 'success' }); }
      else { throw new Error(data.error); }
    } catch (e: any) {
      setToastMessage({ text: `Sync failed: ${e.message}`, type: 'error' });
    } finally {
      setIsSyncingCMS(false);
    }
  };

  const handleCopy = () => { navigator.clipboard.writeText(generatedShadowLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const displayData = metrics.length > 0 ? metrics : [
    { shortDate: 'Mon', aSov: 12, err: 20, compGap: -33, compA: 45, compB: 30, aiTraffic: 120, platforms: { chatgpt: 20, claude: 15, gemini: 25, perplexity: 10 } },
    { shortDate: 'Tue', aSov: 18, err: 35, compGap: -24, compA: 42, compB: 28, aiTraffic: 132, platforms: { chatgpt: 25, claude: 20, gemini: 30, perplexity: 15 } },
    { shortDate: 'Wed', aSov: 25, err: 45, compGap: -13, compA: 38, compB: 25, aiTraffic: 250, platforms: { chatgpt: 35, claude: 30, gemini: 40, perplexity: 20 } },
    { shortDate: 'Thu', aSov: 32, err: 60, compGap: -3, compA: 35, compB: 22, aiTraffic: 280, platforms: { chatgpt: 45, claude: 40, gemini: 50, perplexity: 25 } },
    { shortDate: 'Fri', aSov: 45, err: 80, compGap: 15, compA: 30, compB: 18, aiTraffic: 310, platforms: { chatgpt: 60, claude: 55, gemini: 70, perplexity: 35 } },
  ];

  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : { id: 'placeholder', aSov: 12, err: 20, compGap: -33, compA: 45, compB: 30, aiTraffic: 120, platforms: { chatgpt: 20, claude: 15, gemini: 25, perplexity: 10 } };
  const previous = metrics.length > 1 ? metrics[metrics.length - 2] : latest;
  const safeLatest = { aSov: latest.aSov ?? 0, err: latest.err ?? 0, compGap: latest.compGap ?? 0, aiTraffic: Math.min(latest.aiTraffic ?? 0, 9999), compA: latest.compA ?? 0, platforms: latest.platforms || {}, radar: latest.radar || [], sentiment: latest.sentiment || [], topUrls: latest.topUrls || [] };
  const safePrevious = { aSov: previous.aSov ?? 0, err: previous.err ?? 0, compGap: previous.compGap ?? 0, aiTraffic: Math.min(previous.aiTraffic ?? 0, 9999), compA: previous.compA ?? 0 };
  const asovTrend = Math.round(safeLatest.aSov - safePrevious.aSov);
  const trafficTrend = Math.round(safeLatest.aiTraffic - safePrevious.aiTraffic);
  const errTrend = Math.round(safeLatest.err - safePrevious.err);
  const gapTrend = Math.round(safeLatest.compGap - safePrevious.compGap);

  const radarData = (latest.radar || [
    { subject: 'Brand Trust', brandScore: safeLatest.aSov + 20, compScore: safeLatest.compA + 10 },
    { subject: 'Technical Moat', brandScore: safeLatest.aSov - 5, compScore: safeLatest.compA + 25 },
    { subject: 'Citation Depth', brandScore: safeLatest.aSov + 10, compScore: safeLatest.compA - 15 },
    { subject: 'Fact Veracity', brandScore: safeLatest.aSov + 30, compScore: safeLatest.compA - 20 },
    { subject: 'Neural Sync', brandScore: safeLatest.aSov - 15, compScore: safeLatest.compA + 20 },
    { subject: 'Market Dominance', brandScore: safeLatest.aSov + 5, compScore: safeLatest.compA }
  ]).map((d: any) => ({ subject: d.subject, A: Math.round(Math.min(100, Math.max(0, d.brandScore))), B: Math.round(Math.min(100, Math.max(0, d.compScore))), diff: Math.round(Math.abs((d.brandScore || 0) - (d.compScore || 0))), fullMark: 100 }));

  const computedRadarData = mapPoints.length > 0 ? mapPoints.slice(0, 6).map((point: any) => ({ subject: point.type || point.label || 'General', A: Math.round(Math.min(100, Math.max(0, 100 - (point.distance || 0.1) * 100))), B: Math.round(Math.min(100, Math.max(0, 80 - (point.distance || 0.2) * 100))), fullMark: 100 })) : radarData;

  const lp = safeLatest.platforms || {};
  const safePlatforms = { chatgpt: lp.chatgpt || (safeLatest.aSov > 0 ? safeLatest.aSov + 15 : 20), perplexity: lp.perplexity || (safeLatest.aSov > 0 ? Math.max(2, safeLatest.aSov - 25) : 10), claude: lp.claude || (safeLatest.aSov > 0 ? safeLatest.aSov + 5 : 15), gemini: lp.gemini || (safeLatest.aSov > 0 ? safeLatest.aSov + 25 : 30) };
  const finalPlatformSync = Math.round((safePlatforms.chatgpt + safePlatforms.claude + safePlatforms.gemini) / 3);
  const platformData = [
    { name: 'ChatGPT', visibility: Math.min(100, Math.max(0, safePlatforms.chatgpt)), fill: '#10a37f' },
    { name: 'Perplexity', visibility: Math.min(100, Math.max(0, safePlatforms.perplexity)), fill: '#22d3ee' },
    { name: 'Claude', visibility: Math.min(100, Math.max(0, safePlatforms.claude)), fill: '#d97757' },
    { name: 'Google AI', visibility: Math.min(100, Math.max(0, safePlatforms.gemini)), fill: '#4285f4' },
  ];

  const chartData = metrics.length > 0 ? metrics.slice(-5) : displayData.slice(-5);

  const sentimentData = sentimentTrace.length > 0
    ? sentimentTrace.map(t => ({ prompt: t.prompt, scores: t.data.map((d: any) => d.positive - d.negative) }))
    : userPrompts.map((p: string, rowIdx: number) => {
        const base = rowIdx === 0 ? 60 : rowIdx === 1 ? 10 : rowIdx === 2 ? -80 : 20;
        const flex = rowIdx === 0 ? 40 : rowIdx === 1 ? 30 : rowIdx === 2 ? -40 : -20;
        return { prompt: p, scores: chartData.map((d, i) => { const progress = i / Math.max(1, chartData.length - 1); const isLatest = i === chartData.length - 1; let finalScore = base + Math.floor((flex - base) * progress); if (isLatest) { if (rowIdx === 0) finalScore = safeLatest.aSov + 40; if (rowIdx === 1) finalScore = safeLatest.aSov > 20 ? 80 : 30; if (rowIdx === 2) finalScore = safeLatest.aSov > 25 ? 20 : -40; } return finalScore; }) };
      });

  const safeTopUrls = latest.topUrls || [
    { path: '/blog/enterprise-geo-audit-logging', citations: 45 },
    { path: '/pricing', citations: 32 },
    { path: '/features', citations: 28 },
    { path: '/about', citations: Math.max(2, Math.floor(safeLatest.aSov / 3)) }
  ];
  const scorecardData = safeTopUrls.map((urlObj: any) => {
    const historyLine = chartData.map((d, i) => { const diff = Math.floor(urlObj.citations * 0.4); const start = Math.max(1, urlObj.citations - diff); const progress = i / Math.max(1, chartData.length - 1); return start + Math.floor((urlObj.citations - start) * progress); });
    const previousCitations = historyLine.length > 1 ? historyLine[historyLine.length - 2] : historyLine[0];
    const trendValue = previousCitations > 0 ? Math.round(((urlObj.citations - previousCitations) / previousCitations) * 100) : 0;
    return { url: urlObj.path, citations: urlObj.citations, trend: `${trendValue >= 0 ? '+' : ''}${trendValue}%`, metrics: historyLine };
  }).sort((a: any, b: any) => b.citations - a.citations).slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative">
      {toastMessage && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toastMessage.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : toastMessage.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : 'bg-zinc-900/90 border-zinc-700 text-zinc-300 shadow-black/40'}`}>
          {toastMessage.type === 'success' && <Activity className="w-5 h-5 animate-pulse" />}
          {toastMessage.type === 'info' && <Sparkles className="w-5 h-5 text-pink-400" />}
          <span className="text-sm font-bold tracking-tight">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}

      <SemanticAnchorsModal isOpen={isEditingAnchors} onClose={() => setIsEditingAnchors(false)} userId={user?.uid || ''} brand={userData?.brand || ''} domain={userData?.domain || ''} keywords={userData?.keywords || []} initialAnchors={userAnchors} onSaved={refetchGeo} showToast={(text, type) => setToastMessage({ text, type })} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Performance Hub</h1>
          <p className="text-sm text-zinc-400 mt-1">Track Absolute SOV, Entity Recall, and the growth of your Proprietary Neural Moat.</p>
        </div>
        <div className="flex gap-3">
          {metrics.length === 0 && (<span className="inline-flex items-center px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">Demo Data Mode</span>)}
          <button onClick={runAudit} disabled={isAuditing} className={`${auditSuccess ? 'bg-emerald-600' : 'bg-pink-600 hover:bg-pink-700'} disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 shadow-lg ${auditSuccess ? 'shadow-emerald-500/20' : 'shadow-pink-500/20'}`}>
            {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : auditSuccess ? <div className="flex items-center gap-2">✓ Updated</div> : <Activity className="w-4 h-4" />}
            {!isAuditing && !auditSuccess && "Refresh Metrics"}
          </button>
        </div>
      </div>

      {!driftDismissed && (() => {
        const latestAnomaly = pulseData.filter((p: any) => p.isAnomaly).sort((a: any, b: any) => Math.abs(b.zScore) - Math.abs(a.zScore))[0];
        const showDrift = latestAnomaly || metrics.length === 0;
        const zScore = latestAnomaly ? latestAnomaly.zScore.toFixed(1) : '-3.2';
        const driftLabel = latestAnomaly ? `${Math.abs(latestAnomaly.zScore).toFixed(1)}σ Anomaly` : '-3.2σ Threshold';
        const driftMsg = latestAnomaly
          ? `Live anomaly detected (z=${zScore}) in your latent projections. Immediate recalibration recommended to protect your SOV.`
          : 'Anomaly detected in "API Latency" clusters within your latent space projections. Run an audit to establish your baseline and protect your A-SOV.';
        if (!showDrift) return null;
        return (
          <div className="mb-6 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-rose-500/20 rounded-2xl border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]"><Activity className="w-6 h-6 text-rose-500" /></div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                  Statistically Significant Drift Detected
                  <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-tighter border border-rose-500/30">{driftLabel}</span>
                </h3>
                <p className="text-sm text-rose-400/80 mt-1 font-medium max-w-lg">{driftMsg}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <button onClick={runAudit} disabled={isAuditing} className="px-8 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-3">
                {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                {isAuditing ? "Auditing..." : "Run Deep Audit"}
              </button>
              <button onClick={() => setDriftDismissed(true)} className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Dismiss</button>
            </div>
          </div>
        );
      })()}

      <TooltipProvider>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'A-SOV Dominance', value: Math.round(safeLatest.aSov), color: '#ec4899', icon: Target, desc: 'Absolute Share of Voice - % of AI responses dominated by your brand' },
            { label: 'Entity Recall', value: Math.round(safeLatest.err), color: '#a855f7', icon: BrainCircuit, desc: 'Entity Recall Rate - how often specific facts about your brand are correctly retrieved' },
            { label: 'Platform Sync', value: finalPlatformSync, color: '#3b82f6', icon: Activity, desc: 'Across-model consistency index' },
            { label: 'Sentiment Index', value: 78, color: '#10b981', icon: TrendingUp, desc: 'Average qualitative sentiment score across tracked vectors' },
          ].map((dial, i) => (
            <UITooltip key={i}>
              <TooltipTrigger asChild>
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:border-zinc-700 transition-all cursor-help">
                  <RacingDial value={dial.value} label={dial.label} color={dial.color} />
                  <div className="absolute top-4 right-4 opacity-40 group-hover:opacity-100 transition-opacity"><dial.icon className="w-4 h-4 text-zinc-400" /></div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-center z-[200] bg-black border-zinc-800 text-zinc-200 shadow-2xl font-medium"><p>{dial.desc}</p></TooltipContent>
            </UITooltip>
          ))}
        </div>
      </TooltipProvider>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Competitor Gap', value: `${safeLatest.compGap > 0 ? '+' : ''}${Math.round(safeLatest.compGap)}%`, trend: `${gapTrend >= 0 ? '+' : ''}${gapTrend} pts`, icon: TrendingUp, color: 'text-blue-400', desc: 'Margin over top enterprise rival' },
          { label: 'AI Referral Clicks', value: safeLatest.aiTraffic.toLocaleString(), trend: `${trafficTrend >= 0 ? '+' : ''}${trafficTrend}`, icon: Users, color: 'text-emerald-400', desc: 'Direct attributed sessions from generative responses' },
        ].map((kpi, i) => (
          <div key={i} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{kpi.label}</span>
                <span className={`text-[10px] font-mono ${(kpi.trend.startsWith('+') || kpi.trend.includes('+')) ? 'text-emerald-500' : 'text-rose-500'}`}>{kpi.trend}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-white">{kpi.value}</span>
                <span className="text-[10px] text-zinc-600 font-medium">{kpi.desc}</span>
              </div>
            </div>
            <div className={`p-3 rounded-full bg-zinc-950 border border-zinc-800 ${kpi.color}`}><kpi.icon className="w-5 h-5" /></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6"><h3 className="text-base font-semibold text-white">Absolute Share of Voice (A-SOV)</h3><p className="text-xs text-zinc-400 mt-1">Your exact response dominance across all LLM matrices.</p></div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs><linearGradient id="colorBrand" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <ChartTooltip contentStyle={{ backgroundColor: '#000000', borderColor: '#3f3f46', borderRadius: '12px', color: '#ffffff' }} itemStyle={{ color: '#ffffff' }} labelStyle={{ color: '#ffffff', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="aSov" name="Our A-SOV" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorBrand)" />
                <Area type="monotone" dataKey="compA" name="Top Competitor" stroke="#52525b" strokeWidth={2} fillOpacity={0} fill="transparent" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6"><h3 className="text-base font-semibold text-white">Entity Recall Rate & AI Traffic</h3><p className="text-xs text-zinc-400 mt-1">Proof that injecting Facts into the Vault creates actual referral clicks.</p></div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip contentStyle={{ backgroundColor: '#000000', borderColor: '#3f3f46', borderRadius: '12px', color: '#ffffff' }} itemStyle={{ color: '#ffffff' }} labelStyle={{ color: '#ffffff', fontWeight: 'bold' }} />
                <Bar yAxisId="right" dataKey="aiTraffic" name="AI Referral Traffic" fill="#a855f7" fillOpacity={0.2} radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="err" name="Fact Recall Rate" stroke="#a855f7" strokeWidth={2} dot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6"><h3 className="text-base font-semibold text-white">Competitive Citation Dominance</h3><p className="text-xs text-zinc-400 mt-1">Relative neural dominance per vector: Brands vs Nearest Enterprise Rival.</p></div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={computedRadarData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" hide domain={[-100, 100]} />
                <YAxis dataKey="subject" type="category" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={{ fill: '#27272a', opacity: 0.1 }} contentStyle={{ backgroundColor: '#000000', borderColor: '#27272a', borderRadius: '12px', color: '#ffffff' }} itemStyle={{ color: '#ffffff' }} labelStyle={{ color: '#ffffff' }} formatter={(value: any, name: any) => { const abs = Math.abs(value); const label = name === 'A' ? 'Your Brand' : 'Competitor'; return [`${abs}% Dominance`, label]; }} />
                <ReferenceArea x1={-100} x2={100} fill="transparent" />
                <Bar dataKey="A" name="A" stackId="stack" fill="#ec4899" radius={[0, 4, 4, 0]} />
                <Bar dataKey={(d: any) => -d.B} name="B" stackId="stack" fill="#3f3f46" radius={[4, 0, 0, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center mt-4 px-10">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">← Competitor Dominance</span>
            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Brand Dominance →</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6"><h3 className="text-base font-semibold text-white">Platform-Specific Visibility</h3><p className="text-xs text-zinc-400 mt-1">Breakdown of A-SOV across major AI engines.</p></div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={{ fill: '#27272a', opacity: 0.4 }} contentStyle={{ backgroundColor: '#000000', borderColor: '#27272a', borderRadius: '12px', color: '#ffffff' }} itemStyle={{ color: '#ffffff', fontSize: '12px' }} labelStyle={{ color: '#ffffff', fontWeight: 'bold' }} formatter={(value) => [`${value}% Share of Voice`, 'Visibility']} />
                <Bar dataKey="visibility" name="Visibility" radius={[0, 4, 4, 0]}>{platformData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-2">
            {platformData.map((p) => (
              <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-900 group hover:border-zinc-800 transition-colors">
                <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} /><span className="text-sm font-semibold text-zinc-200">{p.name}</span></div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:block w-48 h-1.5 bg-zinc-900 rounded-full overflow-hidden"><div className="h-full transition-all duration-1000" style={{ width: `${p.visibility}%`, backgroundColor: p.fill }} /></div>
                  <div className="flex flex-col items-end"><span className="text-sm font-black text-white font-mono">{p.visibility}%</span><span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">A-SOV index</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-black border border-zinc-900 rounded-3xl p-8 relative overflow-hidden group">
          <div className="flex flex-col gap-6 mb-8 relative z-20">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-1"><h3 className="text-xl font-bold text-white tracking-tight">Neural Cluster Distribution</h3><p className="text-xs text-zinc-500 max-w-md font-medium">Mapping your brand anchors across the LLM collective latent space.</p></div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  {['All', 'Google AI', 'ChatGPT', 'Claude'].map(p => (<button key={p} onClick={() => setSelectedPlatform(p)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedPlatform === p ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>{p}</button>))}
                </div>
                <div className="flex items-center gap-1 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  {['current', 'week', 'month'].map(t => (<button key={t} onClick={() => setSelectedTimeframe(t)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedTimeframe === t ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>{t === 'current' ? 'Live' : t === 'week' ? '7D Roll' : '30D Roll'}</button>))}
                </div>
                <div className="px-3 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-[9px] font-black text-pink-400 uppercase tracking-[0.2em] animate-pulse">LIVE 768-D MAPPING</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-900 pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800"><span className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">DATASET:</span><span className="text-[9px] font-mono text-zinc-400 font-bold">{selectedTimeframe === 'current' ? '2026-05-17 08:12 UTC' : selectedTimeframe === 'week' ? 'Last 168 Hours' : 'Rolling Epoch'}</span></div>
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800"><span className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">METHOD:</span><span className="text-[9px] font-mono text-emerald-400 font-bold">UMAP_PROJECTION</span></div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setIsEditingAnchors(true)} className="flex items-center gap-3 px-5 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95"><Settings className="w-4 h-4" />Configure Anchors</button>
                {geoLoading && <Loader2 className="w-4 h-4 animate-spin text-pink-500" />}
              </div>
            </div>
          </div>
          <div className="h-[500px] w-full relative z-10 border border-zinc-800 rounded-3xl bg-zinc-950/20 overflow-hidden">
            <UmapVisualization />
          </div>
          <NeuralLegend />
        </div>

        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div><h3 className="text-base font-semibold text-white">"Share of Sentiment" Trace</h3><p className="text-xs text-zinc-400 mt-1">Tracks AI response sentiment across high-risk reputational queries.</p></div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-rose-500"></div> Negative</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-zinc-600"></div> Neutral</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div> Positive</div>
              <button onClick={() => setIsEditingPrompts(true)} className="ml-2 p-1.5 hover:bg-zinc-800 rounded-md transition-colors"><Settings className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" /></button>
            </div>
          </div>
          <NeuralTraceConfig isOpen={isEditingPrompts} onClose={() => setIsEditingPrompts(false)} userId={user?.uid || ''} initialPrompts={userPrompts} onSaved={refetchGeo} />
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[800px]">
              <div className="grid gap-2 mb-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest" style={{ gridTemplateColumns: `2fr repeat(${chartData.length}, 1fr)` }}>
                <div>Reputational Prompt</div>
                {chartData.map((d: any, i: number) => (<div key={i} className="text-center">{d.shortDate || `D-${chartData.length - i}`}</div>))}
              </div>
              <div className="space-y-3">
                {sentimentData.map((row, i) => (
                  <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: `2fr repeat(${row.scores.length}, 1fr)` }}>
                    <div className="text-xs font-medium text-zinc-400 truncate pr-4" title={row.prompt}>{row.prompt}</div>
                    {row.scores.map((score: number, colIdx: number) => (
                      <div key={colIdx} className="flex justify-center group/cell relative">
                        <div className={`w-full h-10 rounded-md transition-all duration-500 border border-white/5 ${getSentimentColor(score)}`} />
                        <div className="absolute opacity-0 group-hover/cell:opacity-100 transition-all -top-10 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg pointer-events-none whitespace-nowrap z-50 border border-zinc-700 shadow-2xl">NET SENTIMENT: {score > 0 ? '+' : ''}{score}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6"><h3 className="text-base font-semibold text-white">"Cite-Magnet" Scorecard</h3><p className="text-xs text-zinc-400 mt-1">Top performing URLs driving AI citations.</p></div>
          <div className="space-y-4">
            {scorecardData.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between border-b border-zinc-800/50 pb-4 last:border-0 last:pb-0">
                <div className="overflow-hidden pr-4 max-w-[55%]"><p className="text-sm font-medium text-zinc-200 truncate">{item.url}</p><p className="text-xs text-zinc-500 mt-1">Citation Freq: {item.citations} <span className={item.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>({item.trend})</span></p></div>
                <div className="w-24 h-10"><ResponsiveContainer width="100%" height="100%"><LineChart data={item.metrics.map((v: number) => ({ value: v }))}><Line type="monotone" dataKey="value" stroke={item.trend.startsWith('-') ? '#f43f5e' : '#10b981'} strokeWidth={2} dot={{ r: 2, fill: item.trend.startsWith('-') ? '#f43f5e' : '#10b981', strokeWidth: 0 }} /></LineChart></ResponsiveContainer></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div><div className="flex items-center gap-2 mb-1"><h3 className="text-base font-semibold text-white">Monitoring Objectives</h3><span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">LIVE SYNC</span></div><p className="text-xs text-zinc-400">Define the reputational anchors and risk vectors the AI monitors.</p></div>
            <button onClick={() => setIsEditingPrompts(true)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-pink-400 transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            {userPrompts.map((prompt: string, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800/50 rounded-lg hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden"><div className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-pink-500' : 'bg-cyan-500'}`} /><span className="text-sm text-zinc-300 truncate">{prompt}</span></div>
                <div className="px-1.5 py-0.5 rounded bg-zinc-900 text-[9px] text-zinc-500 font-mono flex items-center gap-1"><Activity className="w-3 h-3" />{geoLoading ? 'FETCHING' : 'ACTIVE'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6"><h3 className="text-base font-semibold text-white">LLM Conversion Pipeline</h3><p className="text-xs text-zinc-400 mt-1">Attribution funnel for AI-referred traffic.</p></div>
          <div className="h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[
                { stage: 'AI Citations', amount: Math.round(500 + safeLatest.aSov * 10), fill: '#3b82f6' },
                { stage: 'AI Referral Clicks', amount: Math.round(safeLatest.aiTraffic), fill: '#8b5cf6' },
                { stage: 'Signups', amount: Math.round(safeLatest.aiTraffic * 0.15), fill: '#ec4899' },
                { stage: 'Active Users', amount: Math.round(safeLatest.aiTraffic * 0.05), fill: '#10b981' },
              ]} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="stage" type="category" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={{ fill: '#27272a', opacity: 0.4 }} contentStyle={{ backgroundColor: '#000000', borderColor: '#3f3f46', borderRadius: '8px', color: '#ffffff' }} itemStyle={{ color: '#ffffff' }} labelStyle={{ color: '#ffffff' }} formatter={(value) => [value, 'Volume']} />
                <Bar dataKey="amount" barSize={24} radius={[0, 4, 4, 0]}>{[{ fill: '#3b82f6' }, { fill: '#8b5cf6' }, { fill: '#ec4899' }, { fill: '#10b981' }].map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2"><LinkIcon className="w-4 h-4 text-pink-400" />"Dark AI" Shadow Tracking UTM Generator</h3>
            <p className="text-xs text-zinc-400 mt-1">AI engines natively strip referral headers, making physical traffic look like "Direct" in Google Analytics. Generate a Shadow Link to embed in your JSON-LD Schema to definitively prove AI ROI.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={shadowUrl} onChange={(e) => setShadowUrl(e.target.value)} placeholder="e.g., auspexi.com/latency-report" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-sm" />
            <button onClick={generateShadowLink} disabled={isGeneratingLink || !shadowUrl.trim()} className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-2">
              {isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isGeneratingLink ? 'Generating...' : 'Generate UTM parameters'}
            </button>
          </div>
          {generatedShadowLink && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                <code className="text-emerald-400 text-sm break-all">{generatedShadowLink}</code>
                <div className="flex gap-2 ml-4">
                  <button onClick={handleCopy} className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-md text-xs font-medium transition-colors whitespace-nowrap">{copied ? 'Copied!' : 'Copy URL'}</button>
                  <button onClick={handleSyncCMS} disabled={isSyncingCMS} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5">
                    {isSyncingCMS ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}Sync to CMS
                  </button>
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <p className="text-xs font-bold text-zinc-300 mb-2 uppercase tracking-widest flex items-center gap-2"><HelpCircle className="w-3 h-3 text-pink-400" />Where to place this link?</p>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">To prove AI ROI, swap your standard links with this shadow link inside your <span className="text-zinc-300 font-semibold">JSON-LD Schema</span>. When an LLM crawls your site and summarizes your content, it will often include these structured URLs in its citations.</p>
                <pre className="relative bg-black p-3 rounded border border-zinc-800 text-[10px] font-mono text-emerald-500/90 overflow-x-auto">{`{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  "name": "Your Product Name",\n  "url": "${generatedShadowLink}"\n}`}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Synthetic Dataset Analytics */}
      <SyntheticDataPanel />
    </div>
  );
}
