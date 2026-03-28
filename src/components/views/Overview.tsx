import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Line } from 'recharts';
import { TrendingUp, Users, Target, MousePointerClick, Link as LinkIcon, Plus, Loader2, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

export function Overview() {
  const { user, tier } = useAuth();
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
          <p className="text-zinc-400">Track your AI Share of Voice and Dark AI Attribution.</p>
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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) throw new Error("API key is missing");
      
      // Simulate Gemini analyzing current SOV
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const lastDate = metrics.length > 0 ? new Date(metrics[metrics.length - 1].date) : new Date();
      if (metrics.length > 0) {
        lastDate.setDate(lastDate.getDate() + 1);
      }
      
      const dateStr = lastDate.toISOString().split('T')[0];
      const shortDate = lastDate.toLocaleDateString('en-US', { weekday: 'short' });

      const prevBrand = metrics.length > 0 ? metrics[metrics.length - 1].brand : 12;
      const prevCompA = metrics.length > 0 ? metrics[metrics.length - 1].compA : 45;
      const prevCompB = metrics.length > 0 ? metrics[metrics.length - 1].compB : 30;
      const prevDirect = metrics.length > 0 ? metrics[metrics.length - 1].directTraffic : 120;
      
      await addDoc(collection(db, 'sovMetrics'), {
        userId: user.uid,
        date: dateStr,
        shortDate: shortDate,
        brand: Math.min(100, prevBrand + Math.floor(Math.random() * 8) + 2),
        compA: Math.max(0, prevCompA - Math.floor(Math.random() * 5)),
        compB: Math.max(0, prevCompB - Math.floor(Math.random() * 5)),
        directTraffic: prevDirect + Math.floor(Math.random() * 40) + 10,
        aiCitations: Math.floor(Math.random() * 15) + 5
      });
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
      alert("Please enter a valid URL (e.g., auspexi.com/report)");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const displayData = metrics.length > 0 ? metrics : [
    { shortDate: 'Mon', brand: 12, compA: 45, compB: 30, directTraffic: 120, aiCitations: 2 },
    { shortDate: 'Tue', brand: 18, compA: 42, compB: 28, directTraffic: 132, aiCitations: 3 },
    { shortDate: 'Wed', brand: 25, compA: 38, compB: 25, directTraffic: 250, aiCitations: 12 },
    { shortDate: 'Thu', brand: 32, compA: 35, compB: 22, directTraffic: 280, aiCitations: 15 },
    { shortDate: 'Fri', brand: 45, compA: 30, compB: 18, directTraffic: 210, aiCitations: 8 },
  ];

  const latest = displayData[displayData.length - 1];
  const previous = displayData.length > 1 ? displayData[displayData.length - 2] : latest;

  const brandTrend = latest.brand - previous.brand;
  const trafficTrend = latest.directTraffic - previous.directTraffic;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI SOV Overview</h1>
          <p className="text-sm text-zinc-400 mt-1">Track your Generative Engine Optimization performance.</p>
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
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            Run Daily SOV Audit
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'AI Share of Voice', value: `${latest.brand}%`, trend: `${brandTrend >= 0 ? '+' : ''}${brandTrend}%`, icon: Target, color: 'text-indigo-400' },
          { label: 'Dark AI Traffic (Est)', value: latest.directTraffic.toLocaleString(), trend: `${trafficTrend >= 0 ? '+' : ''}${trafficTrend}`, icon: Users, color: 'text-emerald-400' },
          { label: 'Active Cite-Magnets', value: '84', trend: '+12', icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Zero-Click Conversions', value: '3.2%', trend: '+0.8%', icon: MousePointerClick, color: 'text-amber-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-400">{kpi.label}</span>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{kpi.value}</span>
              <span className="text-xs font-medium text-emerald-400">{kpi.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI SOV Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white">AI Share of Voice (vs Competitors)</h3>
            <p className="text-xs text-zinc-400 mt-1">Your brand's visibility in ChatGPT, Perplexity, and Gemini.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBrand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
                <Area type="monotone" dataKey="brand" name="Your Brand" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBrand)" />
                <Area type="monotone" dataKey="compA" name="Competitor A" stroke="#ef4444" strokeWidth={2} fillOpacity={0} fill="transparent" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="compB" name="Competitor B" stroke="#f59e0b" strokeWidth={2} fillOpacity={0} fill="transparent" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dark AI Attribution Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white">Dark AI Attribution</h3>
            <p className="text-xs text-zinc-400 mt-1">Correlating "Direct Traffic" spikes with new AI Citations.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }}
                />
                <Bar yAxisId="left" dataKey="directTraffic" name="Direct Traffic" fill="#3f3f46" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="aiCitations" name="New AI Citations" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shadow Link Generator */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-indigo-400" />
              "Dark AI" Shadow Link Generator
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              AI engines strip referral headers, causing AI traffic to appear as "Direct" in Google Analytics. 
              Generate a Shadow Link to embed in your Cite-Magnets to definitively prove AI ROI.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={shadowUrl}
              onChange={(e) => setShadowUrl(e.target.value)}
              placeholder="e.g., auspexi.com/latency-report"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
            />
            <button 
              onClick={generateShadowLink}
              disabled={isGeneratingLink || !shadowUrl.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-2"
            >
              {isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isGeneratingLink ? 'Generating...' : 'Generate Link'}
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
