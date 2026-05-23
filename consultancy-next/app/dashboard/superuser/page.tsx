'use client'

import { useState } from 'react';
import { ShieldAlert, Trash2, Database, Loader2, CheckCircle2, History, TrendingUp, PieChart, Eye, Rocket, Share2, ExternalLink, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { Button } from '@/components/ui/button';
import { blogPosts } from '@/data/blogPosts';

const ADMIN_BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS === 'true';
const BYPASS_UID = 'auspexi-admin-bypass';

export default function SuperuserPage() {
  const { user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isGeoSeeding, setIsGeoSeeding] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const effectiveUid = user?.uid ?? (ADMIN_BYPASS ? BYPASS_UID : null);

  const collectionsToClear = ['sovMetrics', 'audit_logs', 'auditLogs', 'facts', 'competitorScans', 'contentScans', 'latent_space', 'articles', 'knowledge_graph', 'mentions', 'scrapes'];

  const hardReset = async () => {
    if (!effectiveUid || !window.confirm('CRITICAL: This will delete ALL your brand data, audits, and history. Continue?')) return;
    setIsResetting(true);
    setStatus(null);
    try {
      for (const collName of collectionsToClear) {
        try {
          const q = query(collection(db, collName), where('userId', '==', effectiveUid));
          const snapshot = await getDocs(q);
          if (snapshot.empty) continue;
          let processed = 0;
          while (processed < snapshot.size) {
            const batch = writeBatch(db);
            snapshot.docs.slice(processed, processed + 100).forEach(d => batch.delete(d.ref));
            await batch.commit();
            processed += 100;
          }
        } catch (err) { console.error(`Failed to clear ${collName}:`, err); }
      }
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { uid: user.uid, email: user.email, onboardingCompleted: false, brand: '', domain: '', keywords: [], competitors: [], connectedSocials: [], cmsWebhookUrl: '', sentimentPrompts: [], tier: 'Free', role: 'user', createdAt: new Date().toISOString().split('T')[0] });
      }
      localStorage.clear();
      sessionStorage.clear();
      setStatus({ type: 'success', message: 'Hard reset complete. All data purged. Reinitializing platform...' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'multi-collection-reset');
      setStatus({ type: 'error', message: 'Reset encountered critical errors. Check console for details.' });
    } finally {
      setIsResetting(false);
    }
  };

  const seedHistoricalData = async () => {
    if (!effectiveUid) return;
    setIsSeeding(true);
    setStatus(null);
    try {
      const batch = writeBatch(db);
      const now = new Date();
      for (let i = 0; i < 15; i++) {
        const date = new Date();
        date.setDate(now.getDate() - (15 - i));
        const dateStr = date.toISOString().split('T')[0];
        const baseSov = 15 + i * 2;
        const ref = doc(db, 'sovMetrics', `${effectiveUid}_${dateStr}`);
        batch.set(ref, {
          userId: effectiveUid, date: dateStr,
          shortDate: date.toLocaleDateString('en-US', { weekday: 'short' }),
          aSov: baseSov + Math.sin(i) * 5, err: 40 + i * 3, compGap: 5 + i * 1.5,
          compA: 40 - i * 1.5, aiTraffic: 100 + i * 50 + Math.random() * 20,
          platforms: { chatgpt: baseSov + 10, perplexity: baseSov - 5, claude: baseSov + 2, gemini: baseSov + 15 },
          sentiment: [{ prompt: 'Is the brand reliable?', score: 20 + i * 4 }, { prompt: 'Pricing complaints?', score: -40 + i * 2 }]
        });
      }
      const mapRef = doc(db, 'latent_space', `${effectiveUid}_seed`);
      batch.set(mapRef, {
        userId: effectiveUid,
        points: Array.from({ length: 20 }).map((_, i) => ({
          x: Math.random() * 10 - 5, y: Math.random() * 10 - 5, z: Math.random() * 10 - 5,
          type: i % 2 === 0 ? 'Trust' : i % 3 === 0 ? 'Quality' : 'Price', distance: Math.random() * 0.5
        }))
      });
      await batch.commit();
      setStatus({ type: 'success', message: 'Historical baseline seeded successfully.' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sovMetrics');
      setStatus({ type: 'error', message: 'Seeding failed.' });
    } finally {
      setIsSeeding(false);
    }
  };

  const seedGeoData = async () => {
    if (!effectiveUid) return;
    setIsGeoSeeding(true);
    setStatus(null);
    try {
      const now = new Date();
      const platforms = ['chatgpt', 'perplexity', 'claude', 'gemini', 'copilot'];

      // --- 30 days of SOV metrics across 5 AI platforms ---
      const sovBatch = writeBatch(db);
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(now.getDate() - (30 - i));
        const dateStr = date.toISOString().split('T')[0];
        const trend = i / 30;
        const ref = doc(db, 'sovMetrics', `${effectiveUid}_geo_${dateStr}`);
        sovBatch.set(ref, {
          userId: effectiveUid,
          date: dateStr,
          shortDate: date.toLocaleDateString('en-US', { weekday: 'short' }),
          aSov: 10 + trend * 30 + Math.sin(i * 0.8) * 4,
          err: 35 + trend * 20 + Math.cos(i * 0.6) * 3,
          compGap: 18 - trend * 10,
          compA: 45 - trend * 12,
          aiTraffic: 200 + trend * 800 + Math.random() * 50,
          platforms: {
            chatgpt: 8 + trend * 22 + Math.sin(i) * 3,
            perplexity: 12 + trend * 18 + Math.cos(i) * 2,
            claude: 6 + trend * 28 + Math.sin(i * 1.2) * 4,
            gemini: 14 + trend * 15 + Math.cos(i * 0.9) * 3,
            copilot: 5 + trend * 12 + Math.random() * 2,
          },
          sentiment: [
            { prompt: 'Is this brand reliable?', score: 30 + trend * 40 + Math.sin(i) * 5 },
            { prompt: 'Best value for price?', score: 20 + trend * 35 + Math.cos(i) * 4 },
            { prompt: 'Would you recommend?', score: 25 + trend * 45 + Math.sin(i * 1.5) * 6 },
          ]
        });
      }
      await sovBatch.commit();

      // --- 15 brand facts for GEO Fact Vault ---
      const factCategories = ['quality', 'trust', 'pricing', 'features', 'support'];
      const factTemplates = [
        { claim: 'Reduces AI model training time by up to 40% using neural compression', category: 'quality', confidence: 94 },
        { claim: 'Used by 3 of the top 10 Fortune 500 technology companies', category: 'trust', confidence: 88 },
        { claim: 'SOC 2 Type II audit completed Q4 2024, report available on request', category: 'trust', confidence: 99 },
        { claim: 'Starting at $199/month for teams up to 10 users, no per-seat pricing', category: 'pricing', confidence: 97 },
        { claim: 'Integrates with 40+ data sources via native connectors', category: 'features', confidence: 92 },
        { claim: 'Average query response latency under 200ms at p99', category: 'quality', confidence: 91 },
        { claim: 'GDPR and CCPA compliant; data residency options in EU and US', category: 'trust', confidence: 98 },
        { claim: '24/7 support with median first-response time of 4 minutes', category: 'support', confidence: 85 },
        { claim: 'Open API with 200+ documented endpoints and SDKs for Python, JS, Go', category: 'features', confidence: 96 },
        { claim: 'Reduced customer churn by 22% for SaaS clients in case studies', category: 'quality', confidence: 79 },
        { claim: 'Free 14-day trial, no credit card required', category: 'pricing', confidence: 100 },
        { claim: 'Dedicated customer success manager for Business and Enterprise tiers', category: 'support', confidence: 93 },
        { claim: 'On-premise deployment available for Enterprise with full data isolation', category: 'features', confidence: 95 },
        { claim: 'Named a Gartner Cool Vendor in AI/ML Platforms 2024', category: 'trust', confidence: 90 },
        { claim: 'Uptime SLA of 99.9% with automated failover across 3 availability zones', category: 'quality', confidence: 97 },
      ];
      const factBatch = writeBatch(db);
      factTemplates.forEach((fact, i) => {
        const factDate = new Date();
        factDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
        const ref = doc(db, 'facts', `${effectiveUid}_geo_fact_${i}`);
        factBatch.set(ref, {
          userId: effectiveUid,
          ...fact,
          verified: fact.confidence > 89,
          source: ['internal', 'third-party-audit', 'customer-survey', 'press-release'][i % 4],
          createdAt: factDate.toISOString(),
          citationCount: Math.floor(Math.random() * 40) + 5,
          aiPlatformsSeen: platforms.filter(() => Math.random() > 0.4),
        });
      });
      await factBatch.commit();

      // --- 10 content scans ---
      const contentBatch = writeBatch(db);
      const contentItems = [
        { title: 'How GEO Outperforms Traditional SEO in 2025', geoScore: 91, type: 'blog' },
        { title: 'AUSPEXI Platform Overview for Enterprise Teams', geoScore: 87, type: 'landing' },
        { title: 'AI Citation Best Practices: A Technical Guide', geoScore: 83, type: 'guide' },
        { title: 'Case Study: 3x AI Visibility in 90 Days', geoScore: 95, type: 'case-study' },
        { title: 'Latent Space Positioning: What It Means for Brands', geoScore: 78, type: 'blog' },
        { title: 'Competitor Analysis: How We Stack Up in AI Search', geoScore: 72, type: 'blog' },
        { title: 'Pricing Page — AUSPEXI Plans Compared', geoScore: 65, type: 'pricing' },
        { title: 'Integration Docs: Connecting Your CMS', geoScore: 88, type: 'docs' },
        { title: 'Webinar Recap: GEO Strategies for B2B SaaS', geoScore: 81, type: 'content' },
        { title: 'FAQ: Common Questions About AI Visibility', geoScore: 76, type: 'faq' },
      ];
      contentItems.forEach((item, i) => {
        const scanDate = new Date();
        scanDate.setDate(now.getDate() - i * 2);
        const ref = doc(db, 'contentScans', `${effectiveUid}_geo_scan_${i}`);
        contentBatch.set(ref, {
          userId: effectiveUid,
          ...item,
          url: `https://auspexi.com/${item.type}/${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          wordCount: 800 + Math.floor(Math.random() * 2000),
          citationCount: Math.floor(item.geoScore / 10) + Math.floor(Math.random() * 5),
          platformCoverage: platforms.filter(() => Math.random() > 0.3),
          scannedAt: scanDate.toISOString(),
          recommendations: [
            'Add more structured data markup',
            'Include first-person brand claims with citations',
            'Increase entity density for key topics',
          ].slice(0, Math.floor(Math.random() * 3) + 1),
        });
      });
      await contentBatch.commit();

      // --- 5 competitors ---
      const compBatch = writeBatch(db);
      const competitors = [
        { name: 'BrightEdge', domain: 'brightedge.com', sov: 34, categories: { chatgpt: 38, perplexity: 31, claude: 29, gemini: 42 } },
        { name: 'Semrush', domain: 'semrush.com', sov: 28, categories: { chatgpt: 32, perplexity: 25, claude: 22, gemini: 35 } },
        { name: 'Conductor', domain: 'conductor.com', sov: 18, categories: { chatgpt: 20, perplexity: 16, claude: 14, gemini: 22 } },
        { name: 'Clearscope', domain: 'clearscope.io', sov: 12, categories: { chatgpt: 14, perplexity: 11, claude: 10, gemini: 15 } },
        { name: 'MarketMuse', domain: 'marketmuse.com', sov: 9, categories: { chatgpt: 10, perplexity: 8, claude: 7, gemini: 11 } },
      ];
      competitors.forEach((comp, i) => {
        const ref = doc(db, 'competitorScans', `${effectiveUid}_geo_comp_${i}`);
        compBatch.set(ref, {
          userId: effectiveUid,
          ...comp,
          trend: i % 2 === 0 ? 'declining' : 'growing',
          scannedAt: now.toISOString(),
          topKeywords: ['GEO', 'AI visibility', 'content optimization', 'brand authority'].slice(0, 3),
        });
      });
      await compBatch.commit();

      // --- UMAP latent space (40 points, 5 clusters) ---
      const clusterTypes = ['Trust', 'Quality', 'Price', 'Speed', 'Support'];
      const latentRef = doc(db, 'latent_space', `${effectiveUid}_geo_seed`);
      await setDoc(latentRef, {
        userId: effectiveUid,
        generatedAt: now.toISOString(),
        points: Array.from({ length: 40 }).map((_, i) => {
          const clusterIdx = Math.floor(i / 8);
          const clusterType = clusterTypes[clusterIdx] ?? 'Trust';
          const centerX = (clusterIdx - 2) * 3;
          const centerY = Math.sin(clusterIdx) * 3;
          return {
            x: centerX + (Math.random() - 0.5) * 2,
            y: centerY + (Math.random() - 0.5) * 2,
            z: (Math.random() - 0.5) * 4,
            type: clusterType,
            label: `${clusterType}_${i}`,
            distance: Math.random() * 0.6,
            isBrand: i % 8 === 0,
          };
        }),
      });

      setStatus({ type: 'success', message: 'GEO synthetic dataset seeded: 30-day SOV, 15 facts, 10 content scans, 5 competitors, UMAP clusters.' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'geo-seed');
      setStatus({ type: 'error', message: 'GEO seeding failed. Check console for details.' });
    } finally {
      setIsGeoSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldAlert className="w-32 h-32 text-pink-500" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-bold border border-pink-500/20 mb-6 uppercase tracking-widest">
            Superuser Control Center
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Account Debug &amp; Data Generation</h1>
          <p className="text-zinc-400 text-lg mb-8 leading-relaxed">Seed synthetic GEO data or reset account state for testing. These actions write directly to Firestore.</p>

          {ADMIN_BYPASS && !user && (
            <div className="p-3 rounded-xl mb-6 flex items-center gap-3 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-mono">
              Running in ADMIN_BYPASS mode. Writing to uid: <span className="font-bold">{BYPASS_UID}</span>
            </div>
          )}

          {status && (
            <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-medium">{status.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={seedGeoData} disabled={isGeoSeeding || isSeeding || isResetting || !effectiveUid} className="group p-6 bg-zinc-900 border border-emerald-500/20 rounded-2xl text-left hover:border-emerald-500/50 transition-all disabled:opacity-50">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                {isGeoSeeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Seed GEO Data</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">30-day SOV across 5 AI platforms, 15 brand facts, 10 content scans, 5 competitors, UMAP clusters.</p>
            </button>

            <button onClick={seedHistoricalData} disabled={isSeeding || isGeoSeeding || isResetting || !effectiveUid} className="group p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-left hover:border-pink-500/50 transition-all disabled:opacity-50">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 mb-4 group-hover:scale-110 transition-transform">
                {isSeeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <History className="w-5 h-5" />}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Seed Baselines</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Injects 15 days of historical SOV metrics and UMAP clusters.</p>
            </button>

            <button onClick={hardReset} disabled={isResetting || isSeeding || isGeoSeeding || !effectiveUid} className="group p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-left hover:border-rose-500/50 transition-all disabled:opacity-50">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 group-hover:scale-110 transition-transform">
                {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Hard Reset</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Deletes all audits, scans, and facts. Resets onboarding status and clears local storage.</p>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <PieChart className="w-24 h-24 text-pink-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Investor Transparency Mode</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-6 max-w-xl">Use these tools to verify the &ldquo;Money Machine&rdquo; unit economics. These simulate high-growth scenarios used for Investor Pitch Decks and Series A Due Diligence.</p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => window.location.href = '/investors'} variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                <Eye className="w-4 h-4 mr-2" /> View Live Data Room
              </Button>
              <Button onClick={() => setStatus({ type: 'success', message: 'Hyper-Growth projections enabled for current session.' })} variant="outline" className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10">
                <Rocket className="w-4 h-4 mr-2" /> Simulate Scale-Up
              </Button>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
          <h3 className="text-lg font-bold text-white mb-4">Lead Funnel (7-Day Hook)</h3>
          <div className="space-y-4">
            {[['Captured Leads', '1,240', false], ['Sequence Replies', '12%', false], ['Conv. Rate', '8.4%', true]].map(([label, value, green]) => (
              <div key={String(label)} className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-xs text-zinc-500">{label}</span>
                <span className={`text-sm font-bold ${green ? 'text-emerald-500' : 'text-white'}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center">
            <Share2 className="w-5 h-5 text-pink-500" />
          </div>
          <h3 className="text-xl font-bold text-white">Blog Social Preview Manager</h3>
        </div>
        <p className="text-zinc-400 text-sm mb-6">Visit any post&apos;s preview URL and take a screenshot, or use an automated service to fetch these URLs.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
          {blogPosts.map(post => (
            <div key={post.slug} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between group hover:border-pink-500/30 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{post.title}</p>
                <p className="text-[10px] text-zinc-500 font-mono">/og-preview/{post.slug}</p>
              </div>
              <button onClick={() => window.open(`/og-preview/${post.slug}`, '_blank')} className="p-2 text-zinc-500 hover:text-pink-400 hover:bg-zinc-900 rounded-lg transition-all" title="Open Social Preview">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-zinc-500" />
          <h4 className="font-bold text-white uppercase text-xs tracking-widest">Database Node</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Active UID</p>
            <p className="text-xs font-mono text-zinc-300 break-all">{effectiveUid ?? 'Not authenticated'}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Project Root</p>
            <p className="text-xs font-mono text-zinc-300">auspexi-enterprise-01</p>
          </div>
        </div>
      </div>
    </div>
  );
}
