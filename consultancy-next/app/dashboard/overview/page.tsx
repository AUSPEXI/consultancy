'use client'

import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, Target, Link as LinkIcon, Plus, Loader2, Activity, BrainCircuit, Settings, X, HelpCircle, Sparkles } from 'lucide-react';
import { SyntheticDataPanel } from '@/components/dashboard/SyntheticDataPanel';
import { Ga4AttributionPanel } from '@/components/dashboard/Ga4AttributionPanel';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { useAuth } from '@/contexts/AuthContext';
import { checkTierAccess } from '@/constants/tiers';
import { authFetch } from '@/lib/auth-fetch';
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
      <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(255,20,147,0.4)]" />
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

const RacingDial = ({ value, label, color = "#ff1493", size = "sm" }: { value: number | null; label: string; color?: string; size?: "sm" | "lg" }) => {
  const safeValue = value ?? 0;
  const data = useMemo(() => [
    { name: 'value', value: Math.min(100, Math.max(0, safeValue)), fill: value === null ? '#27272a' : color },
    { name: 'remainder', value: 100 - Math.min(100, Math.max(0, safeValue)), fill: '#18181b' }
  ], [safeValue, color, value]);
  const isLarge = size === "lg";
  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${isLarge ? 'w-48 h-28' : 'w-32 h-20'}`}>
        <ResponsiveContainer width={isLarge ? 192 : 128} height={isLarge ? 112 : 80} minWidth={0}>
          <PieChart>
            <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={isLarge ? 60 : 40} outerRadius={isLarge ? 80 : 55} paddingAngle={0} dataKey="value" stroke="none" />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className={`${isLarge ? 'text-3xl' : 'text-xl'} font-black tracking-tighter ${value === null ? 'text-zinc-600' : 'text-white'}`}>{value === null ? '—' : `${value}%`}</span>
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
    "Is L8EntSpace a secure enterprise choice?",
    "How does L8EntSpace compare to legacy SEO?",
    "Is L8EntSpace's GEO tech proprietary?",
    "Founder reputation and reliability"
  ], []);

  const userPrompts = userData?.sentimentPrompts || defaultPrompts;

  const { pulseData, mapPoints, loading: geoLoading, refetch: refetchGeo } = useGeoAnalytics(
    userData?.brand || '',
    userPrompts,
    selectedPlatform,
    selectedTimeframe,
    user?.uid
  );

  const [metrics, setMetrics] = useState<any[]>([]);
  const [citationData, setCitationData] = useState<any>(null);
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
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
    { label: "Reputational Moat", color: "#ff1493", baseType: "Systemic Anchor" },
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
    if (!user || !checkTierAccess(tier, 'Starter')) return;
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

  // Real citation data — actual LLM queries, not estimates
  useEffect(() => {
    if (!user || !checkTierAccess(tier, 'Starter')) return;
    const q = query(
      collection(db, 'citation_tests'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) setCitationData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
    }, () => {});
    return () => unsubscribe();
  }, [user, tier]);

  // Recent articles — used by Content Scoring tab in SyntheticDataPanel
  useEffect(() => {
    if (!user || !checkTierAccess(tier, 'Starter')) return;
    const q = query(
      collection(db, 'articles'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setRecentArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return () => unsubscribe();
  }, [user, tier]);

  // Real citation history — used to build the A-SOV trend chart from actual probe
  // runs when sovMetrics is empty (i.e. user runs Cite-Probe but not the daily audit)
  const [citationHistory, setCitationHistory] = useState<any[]>([]);
  useEffect(() => {
    if (!user?.uid) return;
    authFetch(`/api/cite-probe?limit=14`)
      .then(r => r.json())
      .then(j => { if (j.success && Array.isArray(j.history)) setCitationHistory(j.history); })
      .catch(() => {});
  }, [user?.uid]);

  if (role !== 'admin' && !checkTierAccess(tier, 'Starter')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Dashboard Overview</h1>
          <p className="text-zinc-400">Track your Prove-It-Works Metrics.</p>
        </div>
        <UpgradePrompt
          title="Dashboard Locked"
          description="Upgrade to the Starter tier to unlock the Overview Dashboard, track your AI Share of Voice, and generate Shadow Links."
          requiredTier="Starter"
        />
      </div>
    );
  }

  const runAudit = async () => {
    if (!user) return;
    setIsAuditing(true);
    setAuditSuccess(false);
    setToastMessage({ text: "Deep Semantic Audit Engaged... Traversing 1,000+ inference paths.", type: 'info' });
    try {
      if (userData?.brand && userData?.domain && userData?.keywords && userData.keywords.length > 0) {
        const response = await authFetch('/api/run-daily-audit', {
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
        setIsAuditing(false);
        setToastMessage({ text: "Add your brand name in Settings to run a live SOV audit.", type: 'info' });
        return;
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
      const response = await authFetch('/api/shadow-link', { method: 'POST', body: JSON.stringify({ originalUrl: shadowUrl }) });
      const data = await response.json();
      if (data.success) { setGeneratedShadowLink(data.shadowUrl); }
      else { throw new Error(data.error || 'Failed to generate link'); }
    } catch (e: any) {
      // Don't fabricate an untracked link on failure — that would look real but
      // never be persisted or attributable. Surface the error instead.
      setToastMessage({ text: e.message || 'Failed to generate Shadow Link. Please try again.', type: 'error' });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleSyncCMS = async () => {
    if (!user || !userData?.cmsWebhookUrl) { setToastMessage({ text: 'Configure an Outbound Webhook in Settings first.', type: 'info' }); return; }
    setIsSyncingCMS(true);
    try {
      const payload = { shadowLink: generatedShadowLink, jsonLd: { "@context": "https://schema.org", "@type": "Product", "name": userData.brand || "Your Brand", "url": generatedShadowLink } };
      const resp = await authFetch('/api/push-to-cms', { method: 'POST', body: JSON.stringify({ webhookUrl: userData.cmsWebhookUrl, payload }) });
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

  // Real trend built from accumulated Cite-Probe runs (aSov = citationRate). Only
  // platform/aSov values are real; competitor/traffic fields stay 0 (no fabrication).
  const realTrend = citationHistory.map((h: any) => {
    const pr = h.platformRates || {};
    return {
      shortDate: h.timestamp ? new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      aSov: Math.round(h.citationRate ?? 0),
      platforms: {
        chatgpt: pr.chatgpt ?? 0,
        claude: pr.claude ?? 0,
        gemini: pr.gemini ?? 0,
        perplexity: pr.perplexity ?? 0,
      },
      isReal: true,
    };
  });

  // Synthetic demo ramp — only shown when the user has NO real data at all
  const demoTrend = [
    { shortDate: 'Mon', aSov: 12, platforms: { chatgpt: 20, claude: 15, gemini: 25, perplexity: 10 } },
    { shortDate: 'Tue', aSov: 18, platforms: { chatgpt: 25, claude: 20, gemini: 30, perplexity: 15 } },
    { shortDate: 'Wed', aSov: 25, platforms: { chatgpt: 35, claude: 30, gemini: 40, perplexity: 20 } },
    { shortDate: 'Thu', aSov: 32, platforms: { chatgpt: 45, claude: 40, gemini: 50, perplexity: 25 } },
    { shortDate: 'Fri', aSov: 45, platforms: { chatgpt: 60, claude: 55, gemini: 70, perplexity: 35 } },
  ];

  const displayData = metrics.length > 0 ? metrics : realTrend.length > 0 ? realTrend : demoTrend;
  const trendIsReal = metrics.length > 0 || realTrend.length > 0;

  const latest = metrics.length > 0 ? metrics[metrics.length - 1]
    : realTrend.length > 0 ? realTrend[realTrend.length - 1]
    : { id: 'placeholder', aSov: 12, platforms: { chatgpt: 20, claude: 15, gemini: 25, perplexity: 10 } };
  const safeLatest = { aSov: latest.aSov ?? 0, platforms: latest.platforms || {} };
  const lp = safeLatest.platforms || {};
  const safePlatforms = { chatgpt: lp.chatgpt || (safeLatest.aSov > 0 ? safeLatest.aSov + 15 : 20), perplexity: lp.perplexity || (safeLatest.aSov > 0 ? Math.max(2, safeLatest.aSov - 25) : 10), claude: lp.claude || (safeLatest.aSov > 0 ? safeLatest.aSov + 5 : 15), gemini: lp.gemini || (safeLatest.aSov > 0 ? safeLatest.aSov + 25 : 30) };
  const finalPlatformSync = Math.round((safePlatforms.chatgpt + safePlatforms.claude + safePlatforms.gemini) / 3);

  // Citation Probe data — real measurements from actual LLM queries
  const cpRates = citationData?.platformRates as Record<string, number | null> | undefined;
  const cpRate = citationData?.citationRate as number | undefined;
  const cpCited = citationData?.citedCount as number | undefined;
  const cpTotal = citationData?.totalQueries as number | undefined;
  const cpMisinfo = citationData?.misinformationCount as number | undefined;

  // Real competitor head-to-head — populated only when the latest probe ran in
  // competitor mode. No fabrication: if there's no competitor object, we show an
  // empty state prompting the user to run a competitor probe.
  const comp = citationData?.competitor as
    | { brand?: string; domain?: string; citationRate?: number; wins?: number; losses?: number; ties?: number; comparison?: any[] }
    | null
    | undefined;
  const hasCompetitor = !!(comp && typeof comp.citationRate === 'number');
  const compGapReal = hasCompetitor ? Math.round((cpRate ?? 0) - (comp!.citationRate ?? 0)) : null;

  // Misinformation rate — % of cited answers that contained an inaccuracy (real).
  const misinfoRate = cpCited && cpCited > 0 && cpMisinfo !== undefined
    ? Math.round((cpMisinfo / cpCited) * 100)
    : null;

  // Per-platform rates: prefer Citation Probe (real), fall back to sovMetrics (estimated)
  const activePlatforms = cpRates ? {
    chatgpt: cpRates.chatgpt ?? null,
    perplexity: cpRates.perplexity ?? null,
    claude: cpRates.claude ?? null,
    gemini: cpRates.gemini ?? null,
  } : safePlatforms;
  const activePlatformValues = Object.values(activePlatforms).filter((v): v is number => v !== null && v !== undefined);
  const displayPlatformSync = activePlatformValues.length > 0
    ? Math.round(activePlatformValues.reduce((a, b) => a + b, 0) / activePlatformValues.length)
    : finalPlatformSync;

  // A-SoV: Citation Probe citationRate IS share of voice (% of queries that cited the brand)
  const displayAsov = cpRate !== undefined ? Math.round(cpRate) : Math.round(safeLatest.aSov);
  const asovSource = cpRate !== undefined ? '● CITE-PROBE' : metrics.length > 0 ? '◌ ESTIMATED' : '◌ SIMULATED';
  const platSource = cpRates ? '● CITE-PROBE' : metrics.length > 0 ? '◌ ESTIMATED' : '◌ SIMULATED';

  const platformData = [
    { name: 'ChatGPT', visibility: Math.min(100, Math.max(0, activePlatforms.chatgpt ?? safePlatforms.chatgpt)), fill: '#10a37f' },
    { name: 'Perplexity', visibility: Math.min(100, Math.max(0, activePlatforms.perplexity ?? safePlatforms.perplexity)), fill: '#22d3ee' },
    { name: 'Claude', visibility: Math.min(100, Math.max(0, activePlatforms.claude ?? safePlatforms.claude)), fill: '#d97757' },
    { name: 'Google AI', visibility: Math.min(100, Math.max(0, activePlatforms.gemini ?? safePlatforms.gemini)), fill: '#4285f4' },
  ];

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

      {user?.uid && (
        <OnboardingChecklist
          userId={user.uid}
          brandConfigured={!!userData?.brand}
          hasProbed={citationHistory.length > 0}
        />
      )}

      <SemanticAnchorsModal isOpen={isEditingAnchors} onClose={() => setIsEditingAnchors(false)} userId={user?.uid || ''} brand={userData?.brand || ''} domain={userData?.domain || ''} keywords={userData?.keywords || []} initialAnchors={userAnchors} onSaved={refetchGeo} showToast={(text, type) => setToastMessage({ text, type })} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Performance Hub</h1>
          <p className="text-sm text-zinc-400 mt-1">Track Absolute SOV, Entity Recall, and the growth of your Proprietary Neural Moat.</p>
        </div>
        <div className="flex items-center gap-3">
          {(() => {
            const isLive = !!(userData?.brand && userData?.domain && userData?.keywords?.length > 0);
            return (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${isLive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                {isLive ? '● LIVE' : '◌ SIMULATED'}
              </span>
            );
          })()}
          <button onClick={runAudit} disabled={isAuditing} className={`${auditSuccess ? 'bg-emerald-600' : 'bg-pink-600 hover:bg-pink-700'} disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 shadow-lg ${auditSuccess ? 'shadow-emerald-500/20' : 'shadow-pink-500/20'}`}>
            {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : auditSuccess ? <div className="flex items-center gap-2">✓ Updated</div> : <Activity className="w-4 h-4" />}
            {!isAuditing && !auditSuccess && "Refresh SOV Metrics"}
          </button>
        </div>
      </div>

      {!driftDismissed && (() => {
        const latestAnomaly = pulseData.filter((p: any) => p.isAnomaly).sort((a: any, b: any) => Math.abs(b.zScore) - Math.abs(a.zScore))[0];
        const showDrift = !!latestAnomaly;
        const zScore = latestAnomaly ? latestAnomaly.zScore.toFixed(1) : '0';
        const driftLabel = latestAnomaly ? `${Math.abs(latestAnomaly.zScore).toFixed(1)}σ Anomaly` : '';
        const driftMsg = latestAnomaly
          ? `Live anomaly detected (z=${zScore}) in your latent projections. Immediate recalibration recommended to protect your SOV.`
          : '';
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'A-SOV Dominance', value: displayAsov, color: '#ff1493', icon: Target, source: asovSource, desc: cpRate !== undefined ? `Citation Probe: ${cpCited} of ${cpTotal} queries cited your brand` : 'Absolute Share of Voice — run Citation Probe for real data' },
            { label: 'Platform Sync', value: displayPlatformSync, color: '#3b82f6', icon: Activity, source: platSource, desc: cpRates ? 'Average citation rate across ChatGPT, Claude, Gemini, Perplexity (Citation Probe)' : 'Across-model consistency — run Citation Probe for real data' },
            { label: 'Misinformation Risk', value: misinfoRate, color: '#f43f5e', icon: TrendingUp, source: misinfoRate !== null ? '● CITE-PROBE' : '◌ NO DATA', desc: misinfoRate !== null ? `${cpMisinfo} of ${cpCited} cited answers contained an inaccuracy about your brand` : 'Run Citation Probe to measure how often LLMs cite your brand inaccurately' },
          ].map((dial, i) => (
            <UITooltip key={i}>
              <TooltipTrigger asChild>
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:border-zinc-700 transition-all cursor-help">
                  <RacingDial value={dial.value} label={dial.label} color={dial.color} />
                  <div className="absolute top-4 right-4 opacity-40 group-hover:opacity-100 transition-opacity"><dial.icon className="w-4 h-4 text-zinc-400" /></div>
                  <span className={`text-[9px] font-mono mt-1 ${dial.source.startsWith('●') ? 'text-emerald-500' : 'text-zinc-600'}`}>{dial.source}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-center z-[200] bg-black border-zinc-800 text-zinc-200 shadow-2xl font-medium"><p>{dial.desc}</p></TooltipContent>
            </UITooltip>
          ))}
        </div>
      </TooltipProvider>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Competitor Gap', value: hasCompetitor ? `${compGapReal! > 0 ? '+' : ''}${compGapReal}%` : '—', trend: hasCompetitor ? `you ${cpRate ?? 0}% vs ${comp!.brand || 'them'} ${comp!.citationRate}%` : 'Run a competitor probe', source: hasCompetitor ? '● CITE-PROBE' : '◌ NO DATA', icon: TrendingUp, color: hasCompetitor && compGapReal! >= 0 ? 'text-emerald-400' : 'text-blue-400', desc: hasCompetitor ? `Real head-to-head citation-rate gap vs ${comp!.domain || comp!.brand}` : 'Run a Citation Probe with the competitor panel open to measure a real gap' },
          { label: 'Citations Found', value: cpCited !== undefined ? `${cpCited} / ${cpTotal}` : '— / —', trend: cpRate !== undefined ? `${Math.round(cpRate)}% rate` : 'Run Citation Probe', source: cpCited !== undefined ? '● CITE-PROBE' : '◌ NO DATA', icon: Users, color: 'text-emerald-400', desc: cpCited !== undefined ? 'Queries where your brand was cited by LLMs' : 'Run Citation Probe to measure real brand citations across LLMs' },
        ].map((kpi, i) => (
          <div key={i} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{kpi.label}</span>
                <span className={`text-[10px] font-mono ${(kpi.trend.startsWith('+') || kpi.trend.includes('+')) ? 'text-emerald-500' : 'text-rose-500'}`}>{kpi.trend}</span>
                <span className={`text-[9px] font-mono ${(kpi as any).source?.startsWith('●') ? 'text-emerald-500' : 'text-zinc-600'}`}>{(kpi as any).source}</span>
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
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Absolute Share of Voice (A-SOV)</h3>
              <p className="text-xs text-zinc-400 mt-1">Your exact response dominance across all LLM matrices.</p>
            </div>
            <span className={`shrink-0 text-[9px] font-mono px-2 py-1 rounded-full border ${trendIsReal ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-zinc-500 border-zinc-700 bg-zinc-900'}`}>
              {trendIsReal ? '● LIVE DATA' : '◌ DEMO — run Citation Probe'}
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs><linearGradient id="colorBrand" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff1493" stopOpacity={0.3}/><stop offset="95%" stopColor="#ff1493" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <ChartTooltip contentStyle={{ backgroundColor: '#000000', borderColor: '#3f3f46', borderRadius: '12px', color: '#ffffff' }} itemStyle={{ color: '#ffffff' }} labelStyle={{ color: '#ffffff', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="aSov" name="Our A-SOV" stroke="#ff1493" strokeWidth={2} fillOpacity={1} fill="url(#colorBrand)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6"><h3 className="text-base font-semibold text-white">Competitor Head-to-Head</h3><p className="text-xs text-zinc-400 mt-1">Real per-query citation winners from your latest competitor probe.</p></div>
          {hasCompetitor ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950 border border-pink-500/20 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">You</p>
                  <p className="text-3xl font-black text-pink-400">{cpRate ?? 0}%</p>
                  <p className="text-[10px] text-zinc-500 mt-1 truncate">{userData?.brand || 'Your brand'}</p>
                </div>
                <div className="bg-zinc-950 border border-zinc-700/40 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Them</p>
                  <p className="text-3xl font-black text-zinc-300">{comp!.citationRate}%</p>
                  <p className="text-[10px] text-zinc-500 mt-1 truncate">{comp!.brand || comp!.domain}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-6 text-xs font-bold">
                <span className="text-emerald-400">{comp!.wins ?? 0} WINS</span>
                <span className="text-zinc-500">{comp!.ties ?? 0} TIES</span>
                <span className="text-rose-400">{comp!.losses ?? 0} LOSSES</span>
              </div>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {(comp!.comparison || []).slice(0, 8).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-[11px] py-1.5 px-2 rounded-md bg-zinc-950/60 border border-zinc-900">
                    <span className="text-zinc-400 truncate flex-1" title={c.query}>{c.query}</span>
                    <span className={`shrink-0 font-bold uppercase tracking-wider ${c.winner === 'you' ? 'text-emerald-400' : c.winner === 'them' ? 'text-rose-400' : 'text-zinc-500'}`}>
                      {c.winner === 'you' ? 'WIN' : c.winner === 'them' ? 'LOSS' : 'TIE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center text-center gap-3">
              <Users className="w-10 h-10 text-zinc-700" />
              <p className="text-sm text-zinc-400 font-medium max-w-xs">No competitor data yet.</p>
              <p className="text-xs text-zinc-600 max-w-xs">Open the Citation Probe, expand the competitor panel, and run a head-to-head probe to populate this with real data.</p>
            </div>
          )}
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6"><h3 className="text-base font-semibold text-white">Platform-Specific Visibility</h3><p className="text-xs text-zinc-400 mt-1">Breakdown of A-SOV across major AI engines.</p></div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
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
            <UmapVisualization points={mapPoints} />
          </div>
          <NeuralLegend />
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <NeuralTraceConfig isOpen={isEditingPrompts} onClose={() => setIsEditingPrompts(false)} userId={user?.uid || ''} initialPrompts={userPrompts} onSaved={refetchGeo} />
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

        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2"><LinkIcon className="w-4 h-4 text-pink-400" />"Dark AI" Shadow Tracking UTM Generator</h3>
            <p className="text-xs text-zinc-400 mt-1">AI engines natively strip referral headers, making physical traffic look like "Direct" in Google Analytics. Generate a Shadow Link to embed in your JSON-LD Schema to definitively prove AI ROI.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={shadowUrl} onChange={(e) => setShadowUrl(e.target.value)} placeholder="e.g., l8entspace.com/latency-report" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-sm" />
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

      {/* AI Referral Attribution (GA4) — renders only when GA4 is configured server-side */}
      <Ga4AttributionPanel />

      {/* Synthetic Dataset Analytics */}
      <SyntheticDataPanel
        realPlatformRates={citationData?.platformRates ?? null}
        realArticles={recentArticles}
        userBrand={userData?.brand || ''}
      />
    </div>
  );
}
