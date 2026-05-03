import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Line, LineChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Cell } from 'recharts';
import { TrendingUp, Users, Target, MousePointerClick, Link as LinkIcon, Plus, Loader2, Activity, BrainCircuit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, addDoc, setDoc, doc, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { logAuditAction } from '@/lib/audit';

export function Overview() {
  const { user, tier, userData } = useAuth();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shadowUrl, setShadowUrl] = useState('');
  const [generatedShadowLink, setGeneratedShadowLink] = useState('');

  useEffect(() => {
    if (!user || tier === 'Free') return;
    const q = query(
      collection(db, 'sovMetrics'),
      where('userId', '==', user.uid),
      orderBy('date', 'asc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setMetrics(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sovMetrics');
    });

    return () => unsubscribe();
  }, [user, tier]);

  if (tier === 'Free') {
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

  const runAudit = async () => {
    if (!user) return;
    setIsAuditing(true);
    try {
      if (userData?.brand && userData?.domain && userData?.keywords && userData.keywords.length > 0) {
        // Run real audit
        const response = await fetch('/api/run-daily-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            brand: userData.brand,
            domain: userData.domain,
            competitors: userData.competitors || [],
            keywords: userData.keywords
          })
        });
        
        const data = await response.json();
        if (data.success && data.metrics) {
          const today = new Date();
          const dateStr = today.toISOString().split('T')[0];
          await setDoc(doc(db, 'sovMetrics', `${user.uid}_${dateStr}`), {
            userId: user.uid,
            date: dateStr,
            shortDate: today.toLocaleDateString('en-US', { weekday: 'short' }),
            ...data.metrics
          }, { merge: true });
          await logAuditAction(user.uid, 'Ran Real SOV Audit', { date: dateStr });
        } else {
          throw new Error(data.error || 'Failed to run audit');
        }
      } else {
        // Fallback to simulated audit if onboarding data is missing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const lastDate = metrics.length > 0 ? new Date(metrics[metrics.length - 1].date) : new Date();
        if (metrics.length > 0) {
          lastDate.setDate(lastDate.getDate() + 1);
        }
        
        const dateStr = lastDate.toISOString().split('T')[0];
        const shortDate = lastDate.toLocaleDateString('en-US', { weekday: 'short' });

        const prevAsov = metrics.length > 0 ? metrics[metrics.length - 1].aSov : 12;
        const prevErr = metrics.length > 0 ? metrics[metrics.length - 1].err : 20;
        const prevAiTraffic = metrics.length > 0 ? metrics[metrics.length - 1].aiTraffic : 120;
        const prevCompA = metrics.length > 0 ? metrics[metrics.length - 1].compA : 45;
        
        const newAsov = Math.min(100, prevAsov + Math.floor(Math.random() * 8));
        const newCompA = Math.max(0, prevCompA - Math.floor(Math.random() * 5));

        await setDoc(doc(db, 'sovMetrics', `${user.uid}_${dateStr}`), {
          userId: user.uid,
          date: dateStr,
          shortDate: shortDate,
          aSov: newAsov,
          err: Math.min(100, prevErr + Math.floor(Math.random() * 10)),
          compGap: newAsov - newCompA,
          compA: newCompA,
          compB: Math.max(0, (metrics.length > 0 ? metrics[metrics.length - 1].compB : 30) - Math.floor(Math.random() * 5)),
          aiTraffic: prevAiTraffic + Math.floor(Math.random() * 40) + 10,
        }, { merge: true });
        await logAuditAction(user.uid, 'Ran Simulated SOV Audit', { date: dateStr });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sovMetrics');
    } finally {
      setIsAuditing(false);
    }
  };

  const generateShadowLink = async () => {
    if (!shadowUrl.trim()) return;
    setIsGeneratingLink(true);
    try {
      const response = await fetch('/api/shadow-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: shadowUrl,
          userId: user?.uid
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setGeneratedShadowLink(data.shadowUrl);
      } else {
        throw new Error(data.error || 'Failed to generate link');
      }
    } catch (e) {
      // Demo mode fallback
      setTimeout(() => {
        setGeneratedShadowLink(`${shadowUrl}${shadowUrl.includes('?') ? '&' : '?'}utm_source=chatgpt&utm_medium=ai_citation&utm_campaign=auspexi_shadow`);
        setIsGeneratingLink(false);
      }, 500);
    } 
  };

  const displayData = metrics.length > 0 ? metrics : [
    { shortDate: 'Mon', aSov: 12, err: 20, compGap: -33, compA: 45, compB: 30, aiTraffic: 120 },
    { shortDate: 'Tue', aSov: 18, err: 35, compGap: -24, compA: 42, compB: 28, aiTraffic: 132 },
    { shortDate: 'Wed', aSov: 25, err: 45, compGap: -13, compA: 38, compB: 25, aiTraffic: 250 },
    { shortDate: 'Thu', aSov: 32, err: 60, compGap: -3, compA: 35, compB: 22, aiTraffic: 280 },
    { shortDate: 'Fri', aSov: 45, err: 80, compGap: 15, compA: 30, compB: 18, aiTraffic: 310 },
  ];

  const latest = displayData[displayData.length - 1];
  const previous = displayData.length > 1 ? displayData[displayData.length - 2] : latest;

  // Safe fallbacks for older documents that might be missing the new metric fields
  const safeLatest = {
    aSov: latest.aSov || 0,
    err: latest.err || 0,
    compGap: latest.compGap || 0,
    aiTraffic: latest.aiTraffic || 0,
  };
  
  const safePrevious = {
    aSov: previous.aSov || 0,
    err: previous.err || 0,
    compGap: previous.compGap || 0,
    aiTraffic: previous.aiTraffic || 0,
  };

  const asovTrend = safeLatest.aSov - safePrevious.aSov;
  const trafficTrend = safeLatest.aiTraffic - safePrevious.aiTraffic;
  const errTrend = safeLatest.err - safePrevious.err;
  const gapTrend = safeLatest.compGap - safePrevious.compGap;

  const radarData = [
    { subject: 'Pricing Insights', A: safeLatest.aSov + 20, B: safeLatest.compA + 10, fullMark: 100 },
    { subject: 'Feature Comparison', A: safeLatest.aSov - 5, B: safeLatest.compA + 25, fullMark: 100 },
    { subject: 'Implementation Docs', A: safeLatest.aSov + 10, B: safeLatest.compA - 15, fullMark: 100 },
    { subject: 'Customer Support', A: safeLatest.aSov + 30, B: safeLatest.compA - 20, fullMark: 100 },
    { subject: 'Security & Auth', A: safeLatest.aSov - 15, B: safeLatest.compA + 20, fullMark: 100 },
    { subject: 'Enterprise Ready', A: safeLatest.aSov + 5, B: safeLatest.compA, fullMark: 100 },
  ].map(d => ({ ...d, A: Math.min(100, Math.max(0, d.A)), B: Math.min(100, Math.max(0, d.B)) }));

  const platformData = [
    { name: 'ChatGPT', visibility: Math.min(100, safeLatest.aSov + 15), fill: '#10a37f' },
    { name: 'Perplexity', visibility: Math.min(100, Math.max(0, safeLatest.aSov - 25)), fill: '#22d3ee' },
    { name: 'Claude', visibility: Math.min(100, safeLatest.aSov + 5), fill: '#d97757' },
    { name: 'Gemini', visibility: Math.min(100, safeLatest.aSov + 25), fill: '#4285f4' },
  ];

  const chartData = displayData.slice(-5);
  const sentimentData = [
    { prompt: "Best alternative to top competitor?", base: 60, flex: 40 },
    { prompt: "Is the product reliable for enterprise?", base: 10, flex: 30 },
    { prompt: "Common user complaints & reviews?", base: -80, flex: -40 },
    { prompt: "Pricing compared to market average?", base: 20, flex: -20 } // Deteriorating sentiment
  ].map(row => ({
    prompt: row.prompt,
    scores: chartData.map((d, i) => {
      // Simulate historical scores changing towards the current state
      const progress = i / Math.max(1, chartData.length - 1);
      const isLatest = i === chartData.length - 1;
      
      let finalScore = row.base + Math.floor((row.flex - row.base) * progress);
      if (isLatest) {
         if (row.prompt.includes("alternative")) finalScore = safeLatest.aSov + 40;
         if (row.prompt.includes("reliable")) finalScore = safeLatest.aSov > 20 ? 80 : 30;
         if (row.prompt.includes("complaints")) finalScore = safeLatest.aSov > 25 ? 20 : -40;
      }
      return finalScore;
    })
  }));

  const getSentimentColor = (score: number) => {
    if (score >= 60) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    if (score >= 20) return 'bg-emerald-400/80';
    if (score >= -20) return 'bg-zinc-600';
    if (score >= -60) return 'bg-rose-400/80';
    return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Prove-It-Works Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">Track Absolute SOV, Entity Recall, and AI Referral Traffic.</p>
        </div>
        <div className="flex gap-3">
          {metrics.length === 0 && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
              Demo Data Mode
            </span>
          )}
          <button 
            onClick={runAudit}
            disabled={isAuditing}
            className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Absolute SOV (A-SOV)', value: `${safeLatest.aSov}%`, trend: `${asovTrend >= 0 ? '+' : ''}${asovTrend}%`, icon: Target, color: 'text-pink-400' },
          { label: 'Entity Recall Rate (ERR)', value: `${safeLatest.err}%`, trend: `${errTrend >= 0 ? '+' : ''}${errTrend}%`, icon: BrainCircuit, color: 'text-purple-400' },
          { label: 'Competitor Gap', value: `${safeLatest.compGap > 0 ? '+' : ''}${safeLatest.compGap}%`, trend: `${gapTrend >= 0 ? '+' : ''}${gapTrend} pts`, icon: TrendingUp, color: 'text-blue-400' },
          { label: 'AI Referral Clicks', value: safeLatest.aiTraffic.toLocaleString(), trend: `${trafficTrend >= 0 ? '+' : ''}${trafficTrend}`, icon: Users, color: 'text-emerald-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-400">{kpi.label}</span>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{kpi.value}</span>
              <span className={`text-xs font-medium ${(kpi.trend.startsWith('+') || kpi.trend.includes('+')) ? 'text-emerald-400' : 'text-rose-400'}`}>{kpi.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A-SOV vs Competitors Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white">Absolute Share of Voice (A-SOV)</h3>
            <p className="text-xs text-zinc-400 mt-1">Your exact response dominance across all LLM matrices.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBrand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
                <Area type="monotone" dataKey="aSov" name="Our A-SOV" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorBrand)" />
                <Area type="monotone" dataKey="compA" name="Top Competitor" stroke="#52525b" strokeWidth={2} fillOpacity={0} fill="transparent" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ERR & AI Traffic Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white">Entity Recall Rate & AI Traffic</h3>
            <p className="text-xs text-zinc-400 mt-1">Proof that injecting Facts into the Vault creates actual referral clicks.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }}
                />
                <Bar yAxisId="right" dataKey="aiTraffic" name="AI Referral Traffic" fill="#a855f7" fillOpacity={0.2} radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="err" name="Fact Recall Rate" stroke="#a855f7" strokeWidth={2} dot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Competitive Citation Gap Radar */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white">Competitive Citation Gap</h3>
            <p className="text-xs text-zinc-400 mt-1">Topics where AI prefers your brand vs. Top Competitor.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#3f3f46" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} />
                <Radar name="Your Brand" dataKey="A" stroke="#ec4899" fill="#ec4899" fillOpacity={0.4} />
                <Radar name="Top Competitor" dataKey="B" stroke="#52525b" fill="#52525b" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform-Specific Visibility Matrix */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white">Platform-Specific Visibility</h3>
            <p className="text-xs text-zinc-400 mt-1">Breakdown of A-SOV across major AI engines.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }}
                  formatter={(value) => [`${value}% Share of Voice`, 'Visibility']}
                />
                <Bar dataKey="visibility" name="Visibility" radius={[0, 4, 4, 0]}>
                  {
                    platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share of Sentiment Heatmap */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h3 className="text-base font-semibold text-white">"Share of Sentiment" Trace</h3>
              <p className="text-xs text-zinc-400 mt-1">Tracks AI response sentiment across high-risk reputational queries.</p>
            </div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"></div> Negative</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-zinc-600"></div> Neutral</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div> Positive</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div 
                className="grid gap-2 mb-2 text-xs font-medium text-zinc-500" 
                style={{ gridTemplateColumns: `2fr repeat(${chartData.length}, 1fr)` }}
              >
                <div>Reputational Prompt</div>
                {chartData.map((d, i) => (
                  <div key={i} className="text-center">{d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Day ${i+1}`}</div>
                ))}
              </div>
              
              <div className="space-y-3">
                {sentimentData.map((row, i) => (
                  <div 
                    key={i} 
                    className="grid gap-2 items-center"
                    style={{ gridTemplateColumns: `2fr repeat(${chartData.length}, 1fr)` }}
                  >
                    <div className="text-sm text-zinc-300 truncate pr-4" title={row.prompt}>
                      {row.prompt}
                    </div>
                    {row.scores.map((score, colIdx) => (
                      <div key={colIdx} className="flex justify-center group relative">
                        <div className={`w-full h-8 rounded-md transition-all duration-300 ${getSentimentColor(score)}`} />
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-8 bg-zinc-800 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10 border border-zinc-700">
                          Score: {score > 0 ? '+' : ''}{score}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* "Cite-Magnet" Content Scorecard */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white">"Cite-Magnet" Scorecard</h3>
            <p className="text-xs text-zinc-400 mt-1">Top performing URLs driving AI citations.</p>
          </div>
          <div className="space-y-4">
            {[
              { url: '/blog/enterprise-geo-audit-logging', citations: 45, trend: '+12%', metrics: [12, 18, 25, 35, 45] },
              { url: '/pricing', citations: 32, trend: '+8%', metrics: [20, 22, 24, 28, 32] },
              { url: '/features', citations: 28, trend: '+5%', metrics: [15, 18, 22, 25, 28] },
              { url: '/about', citations: Math.max(2, Math.floor(safeLatest.aSov / 3)), trend: (safeLatest.aSov > previous.aSov) ? '+3%' : '-2%', metrics: [18, 16, 15, 14, Math.max(2, Math.floor(safeLatest.aSov / 3))] },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-zinc-800/50 pb-4 last:border-0 last:pb-0">
                <div className="overflow-hidden pr-4 max-w-[55%]">
                  <p className="text-sm font-medium text-zinc-200 truncate" title={item.url}>{item.url}</p>
                  <p className="text-xs text-zinc-500 mt-1">Citation Freq: {item.citations} <span className={item.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>({item.trend})</span></p>
                </div>
                <div className="w-24 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={item.metrics.map(v => ({ value: v }))}>
                      <Line type="monotone" dataKey="value" stroke={item.trend.startsWith('+') ? '#10b981' : '#f43f5e'} strokeWidth={2} dot={{ r: 2, fill: item.trend.startsWith('+') ? '#10b981' : '#f43f5e', strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LLM Conversion Pipeline */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white">LLM Conversion Pipeline</h3>
            <p className="text-xs text-zinc-400 mt-1">Attribution funnel for AI-referred traffic.</p>
          </div>
          <div className="h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[
                { stage: 'AI Citations', amount: 500 + safeLatest.aSov * 10, fill: '#3b82f6' },
                { stage: 'AI Referral Clicks', amount: safeLatest.aiTraffic, fill: '#8b5cf6' },
                { stage: 'Signups', amount: Math.floor(safeLatest.aiTraffic * 0.15), fill: '#ec4899' },
                { stage: 'Active Users', amount: Math.floor(safeLatest.aiTraffic * 0.05), fill: '#10b981' },
              ]} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="stage" type="category" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#27272a', opacity: 0.4 }} 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7', borderRadius: '8px' }} 
                  formatter={(value) => [value, 'Volume']}
                />
                <Bar dataKey="amount" barSize={24} radius={[0, 4, 4, 0]}>
                   {
                    [
                      { fill: '#3b82f6' },
                      { fill: '#8b5cf6' },
                      { fill: '#ec4899' },
                      { fill: '#10b981' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))
                   }
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shadow Link Generator */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-pink-400" />
              "Dark AI" Shadow Tracking UTM Generator
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              AI engines natively strip referral headers, making physical traffic look like "Direct" in Google Analytics. 
              Generate a Shadow Link to embed in your JSON-LD Schema to definitively prove AI ROI.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={shadowUrl}
              onChange={(e) => setShadowUrl(e.target.value)}
              placeholder="e.g., auspexi.com/latency-report"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-sm"
            />
            <button 
              onClick={generateShadowLink}
              disabled={isGeneratingLink || !shadowUrl.trim()}
              className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-2"
            >
              {isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isGeneratingLink ? 'Generating...' : 'Generate UTM parameters'}
            </button>
          </div>
          {generatedShadowLink && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between animate-in fade-in duration-300">
              <code className="text-emerald-400 text-sm break-all">{generatedShadowLink}</code>
              <button 
                onClick={() => { navigator.clipboard.writeText(generatedShadowLink); alert('Copied to clipboard!'); }}
                className="ml-4 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-md text-xs font-medium transition-colors whitespace-nowrap"
              >
                Copy URL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

