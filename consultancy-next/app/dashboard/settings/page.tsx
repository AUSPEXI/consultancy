'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { logAuditAction } from '@/lib/audit';
import { authFetch } from '@/lib/auth-fetch';
import { Chrome, Linkedin, Twitter, MessageCircle, Instagram, Music2, CheckCircle2, Loader2, Sparkles, Network, X, Search } from 'lucide-react';

const L8ENTSPACE_GEO_KEYWORDS = [
  'generative engine optimization',
  'GEO optimization',
  'AI search visibility',
  'AI share of voice',
  'brand citations in AI',
  'LLM citation',
  'AI brand monitoring',
  'AI content optimization',
  'generative AI SEO',
  'AI engine optimization',
];

const L8ENTSPACE_PRIMARY_COMPETITORS = ['brightedge.com', 'semrush.com', 'conductor.com', 'clearscope.io'];
const L8ENTSPACE_WATCHLIST_COMPETITORS = ['marketmuse.com', 'botify.com', 'rankscience.com', 'surfer seo'];

const L8ENTSPACE_SOCIALS: Record<string, string> = {
  linkedin:  'https://linkedin.com/company/l8entspace',
  twitter:   'https://x.com/l8entspace',
  instagram: 'https://instagram.com/l8entspace',
  tiktok:    'https://tiktok.com/@l8entspace',
  reddit:    'u/l8entspace',
};

// Full TEO-structured anchor set for L8EntSpace.
// 2 Ontological (Systemic Anchor) · 2 Epistemological (Signal Point)
// · 2 Teleological (Emergent Trend) · 1 Risk Vector
const L8ENTSPACE_ANCHORS = [
  { label: 'GEO Category Owner',       color: '#ff1493', baseType: 'Systemic Anchor', axisAlignment: 1, description: 'L8EntSpace is the defining brand in the Generative Engine Optimization category — the first mover whose name becomes the category name.' },
  { label: 'AI Visibility Platform',   color: '#ff1493', baseType: 'Systemic Anchor', axisAlignment: 1, description: 'L8EntSpace is the infrastructure layer for tracking and building brand presence across AI-generated responses at scale.' },
  { label: 'Citation Engineering',     color: '#06b6d4', baseType: 'Signal Point',    axisAlignment: 2, description: 'L8EntSpace owns a verifiable, named methodology — the Cite-Magnet framework — with documented techniques for generating AI citations.' },
  { label: 'AI Share of Voice Data',   color: '#06b6d4', baseType: 'Signal Point',    axisAlignment: 2, description: 'L8EntSpace produces real, auditable SOV measurements across ChatGPT, Claude, Gemini, and Perplexity — no other tool does this.' },
  { label: 'AI-Era Brand Authority',   color: '#8b5cf6', baseType: 'Emergent Trend',  axisAlignment: 3, description: 'L8EntSpace is becoming the standard framework for how forward-thinking brands build authority in the AI search era.' },
  { label: 'GEO as Growth Channel',    color: '#8b5cf6', baseType: 'Emergent Trend',  axisAlignment: 3, description: 'Positioning GEO as a measurable, revenue-generating channel alongside traditional SEO — a category L8EntSpace is creating.' },
  { label: 'SEO Legacy Resistance',    color: '#f59e0b', baseType: 'Risk Vector',     axisAlignment: 2, description: 'The primary threat: brands and agencies anchored in traditional SEO frameworks, mischaracterising GEO as an SEO variant.' },
];

const SOCIAL_PLATFORMS = [
  {
    key: 'linkedin', label: 'LinkedIn', sub: 'Professional network post seeding',
    Icon: Linkedin, bg: 'bg-[#0A66C2]/10', color: 'text-[#0A66C2]',
    hint: 'For posting (Amplify), paste your LinkedIn OAuth Access Token. For monitoring (Pulse), enter your Profile URL.',
    placeholder: 'https://linkedin.com/company/l8entspace or OAuth token',
  },
  {
    key: 'twitter', label: 'X / Twitter', sub: 'Real-time narrative seeding',
    Icon: Twitter, bg: 'bg-white/10', color: 'text-white',
    hint: 'Enter your X/Twitter profile URL or API Bearer Token for automated posting.',
    placeholder: 'https://x.com/l8entspace or Bearer token',
  },
  {
    key: 'instagram', label: 'Instagram', sub: 'Visual brand authority',
    Icon: Instagram, bg: 'bg-pink-500/10', color: 'text-pink-500',
    hint: 'Enter your Instagram profile URL. Full posting requires a Meta Business Account access token.',
    placeholder: 'https://instagram.com/l8entspace',
  },
  {
    key: 'tiktok', label: 'TikTok', sub: 'Short-form viral seeding',
    Icon: Music2, bg: 'bg-cyan-500/10', color: 'text-cyan-400',
    hint: 'Enter your TikTok profile URL for monitoring, or access token for automated content.',
    placeholder: 'https://tiktok.com/@l8entspace',
  },
  {
    key: 'reddit', label: 'Reddit', sub: 'Consensus seeding in communities',
    Icon: MessageCircle, bg: 'bg-[#FF4500]/10', color: 'text-[#FF4500]',
    hint: 'Enter your Reddit username or subreddit URLs you participate in for GEO monitoring.',
    placeholder: 'u/l8entspace or r/seo,r/marketing',
  },
  {
    key: 'webform', label: 'Webform / API', sub: 'Custom endpoint integration',
    Icon: Chrome, bg: 'bg-zinc-100/10', color: 'text-zinc-100',
    hint: 'Custom API endpoint. L8EntSpace will POST structured brand data here.',
    placeholder: 'https://your-server.com/api/social-push',
  },
];

export default function SettingsPage() {
  const { user, userData } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [connectedSocials, setConnectedSocials] = useState<string[]>([]);
  const [socialInputs, setSocialInputs] = useState<Record<string, string>>({});
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [anchors, setAnchors] = useState<any[]>([]);
  const [isGeneratingAnchors, setIsGeneratingAnchors] = useState(false);
  const [isDiscoveringCompetitors, setIsDiscoveringCompetitors] = useState(false);
  const [watchlistCompetitors, setWatchlistCompetitors] = useState<string[]>([]);
  const [watchlistInput, setWatchlistInput] = useState('');
  // S7.2: industry benchmark opt-in
  const [industry, setIndustry] = useState('');
  const [benchmarkOptIn, setBenchmarkOptIn] = useState(false);
  const [formData, setFormData] = useState({
    brand: '', domain: '', cmsWebhookUrl: '',
    keyword1: '', keyword2: '', keyword3: '', keyword4: '', keyword5: '',
    keyword6: '', keyword7: '', keyword8: '', keyword9: '', keyword10: '',
    competitor1: '', competitor2: '', competitor3: '', competitor4: '',
  });

  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    if (userData) {
      setConnectedSocials(userData.connectedSocials || []);
      setAnchors(userData.latentAnchors || []);
      const primary = userData.competitors || [];
      setWatchlistCompetitors(userData.watchlistCompetitors || []);
      setIndustry(userData.industry || '');
      setBenchmarkOptIn(!!userData.benchmarkOptIn);
      setFormData({
        brand: userData.brand || '',
        domain: userData.domain || '',
        cmsWebhookUrl: userData.cmsWebhookUrl || '',
        keyword1: userData.keywords?.[0] || '', keyword2: userData.keywords?.[1] || '',
        keyword3: userData.keywords?.[2] || '', keyword4: userData.keywords?.[3] || '',
        keyword5: userData.keywords?.[4] || '', keyword6: userData.keywords?.[5] || '',
        keyword7: userData.keywords?.[6] || '', keyword8: userData.keywords?.[7] || '',
        keyword9: userData.keywords?.[8] || '', keyword10: userData.keywords?.[9] || '',
        competitor1: primary[0] || '', competitor2: primary[1] || '',
        competitor3: primary[2] || '', competitor4: primary[3] || '',
      });
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Social connections ──────────────────────────────────────────────────────
  const handleConnectSocial = async (platform: string) => {
    if (!user) return;
    const value = socialInputs[platform]?.trim();
    if (!value) return;

    setConnectingPlatform(platform);
    const newSocials = [...connectedSocials.filter(p => p !== platform), platform];
    setConnectedSocials(newSocials);
    try {
      await setDoc(doc(db, 'users', user.uid), { connectedSocials: newSocials }, { merge: true });
      await logAuditAction(user.uid, 'Connected Social Platform', { platform });
      setSocialInputs(prev => ({ ...prev, [platform]: '' }));
    } catch (err) {
      setConnectedSocials(connectedSocials);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnectSocial = async (platform: string) => {
    if (!user) return;
    const newSocials = connectedSocials.filter(p => p !== platform);
    setConnectedSocials(newSocials);
    try {
      await setDoc(doc(db, 'users', user.uid), { connectedSocials: newSocials }, { merge: true });
      await logAuditAction(user.uid, 'Disconnected Social Platform', { platform });
    } catch {
      setConnectedSocials(connectedSocials);
    }
  };

  // ── Semantic anchors ────────────────────────────────────────────────────────
  const generateAnchors = async () => {
    if (!user || !formData.brand) return;
    setIsGeneratingAnchors(true);
    try {
      const res = await authFetch('/api/suggest-anchors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          brand: formData.brand,
          domain: formData.domain,
          domainContext: `Keywords: ${[formData.keyword1, formData.keyword2, formData.keyword3].filter(Boolean).join(', ')}`,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const suggested: any[] = data.anchors || [];
      setAnchors(suggested);
      // Save to user doc via admin-safe route
      await authFetch('/api/save-anchors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, anchors: suggested }),
      });
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: `Anchor generation failed: ${err.message}` });
    } finally {
      setIsGeneratingAnchors(false);
    }
  };

  const applyL8EntSpaceDefaults = async () => {
    setFormData(prev => ({
      ...prev,
      brand: 'L8EntSpace',
      domain: 'l8entspace.com',
      cmsWebhookUrl: origin ? `${origin}/api/notify-article` : prev.cmsWebhookUrl,
      keyword1: L8ENTSPACE_GEO_KEYWORDS[0], keyword2: L8ENTSPACE_GEO_KEYWORDS[1],
      keyword3: L8ENTSPACE_GEO_KEYWORDS[2], keyword4: L8ENTSPACE_GEO_KEYWORDS[3],
      keyword5: L8ENTSPACE_GEO_KEYWORDS[4], keyword6: L8ENTSPACE_GEO_KEYWORDS[5],
      keyword7: L8ENTSPACE_GEO_KEYWORDS[6], keyword8: L8ENTSPACE_GEO_KEYWORDS[7],
      keyword9: L8ENTSPACE_GEO_KEYWORDS[8], keyword10: L8ENTSPACE_GEO_KEYWORDS[9],
      competitor1: L8ENTSPACE_PRIMARY_COMPETITORS[0], competitor2: L8ENTSPACE_PRIMARY_COMPETITORS[1],
      competitor3: L8ENTSPACE_PRIMARY_COMPETITORS[2], competitor4: L8ENTSPACE_PRIMARY_COMPETITORS[3],
    }));
    // Seed the full TEO anchor set
    setAnchors(L8ENTSPACE_ANCHORS);
    setWatchlistCompetitors(L8ENTSPACE_WATCHLIST_COMPETITORS);
    // Auto-connect all known L8EntSpace social accounts
    const socialKeys = Object.keys(L8ENTSPACE_SOCIALS);
    setConnectedSocials(socialKeys);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          connectedSocials: socialKeys,
          latentAnchors: L8ENTSPACE_ANCHORS,
        }, { merge: true });
      } catch {}
    }
    setSaveMsg({ type: 'success', text: 'L8EntSpace defaults applied — TEO anchors, competitors, CMS webhook, and social accounts all set. Hit Save Settings to persist the rest.' });
  };

  // ── AI competitor discovery ─────────────────────────────────────────────────
  const discoverCompetitors = async () => {
    if (!formData.brand) return;
    setIsDiscoveringCompetitors(true);
    try {
      const keywords = [
        formData.keyword1, formData.keyword2, formData.keyword3,
        formData.keyword4, formData.keyword5,
      ].filter(Boolean);
      const res = await authFetch('/api/suggest-competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid, brand: formData.brand, domain: formData.domain, keywords }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const comps: string[] = data.competitors || [];
      const primary = comps.slice(0, 4);
      const watchlist = comps.slice(4);
      setFormData(prev => ({
        ...prev,
        competitor1: primary[0] || prev.competitor1,
        competitor2: primary[1] || prev.competitor2,
        competitor3: primary[2] || prev.competitor3,
        competitor4: primary[3] || prev.competitor4,
      }));
      if (watchlist.length) setWatchlistCompetitors(prev => [...new Set([...prev, ...watchlist])]);
      setSaveMsg({ type: 'success', text: `Discovered ${comps.length} competitors — ${primary.length} primary, ${watchlist.length} added to watchlist. Review below, then hit Save.` });
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: `Discovery failed: ${err.message}` });
    } finally {
      setIsDiscoveringCompetitors(false);
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const userRef = doc(db, 'users', user.uid);
      const competitors = [formData.competitor1, formData.competitor2, formData.competitor3, formData.competitor4].filter(Boolean);
      const keywords = [formData.keyword1, formData.keyword2, formData.keyword3, formData.keyword4, formData.keyword5, formData.keyword6, formData.keyword7, formData.keyword8, formData.keyword9, formData.keyword10].filter(Boolean);
      await setDoc(userRef, {
        brand: formData.brand, domain: formData.domain, cmsWebhookUrl: formData.cmsWebhookUrl,
        competitors,
        watchlistCompetitors: watchlistCompetitors.filter(Boolean),
        keywords,
        industry: industry.trim(),
        benchmarkOptIn,
      }, { merge: true });
      await logAuditAction(user.uid, 'Saved Settings', { brand: formData.brand, domain: formData.domain, keywordCount: keywords.length, competitorCount: competitors.length, watchlistCount: watchlistCompetitors.length });
      setSaveMsg({ type: 'success', text: 'Settings saved. Citacious will pick up your brand data on next message.' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
      setSaveMsg({ type: 'error', text: 'Save failed — check Firestore rules.' });
    } finally {
      setIsSaving(false);
    }
  };

  const ANCHOR_TYPE_COLORS: Record<string, string> = {
    'Systemic Anchor': 'text-pink-400 border-pink-500/30 bg-pink-500/10',
    'Signal Point':    'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    'Emergent Trend':  'text-purple-400 border-purple-500/30 bg-purple-500/10',
    'Risk Vector':     'text-amber-400 border-amber-500/30 bg-amber-500/10',
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Account Settings</h1>
          <p className="text-zinc-400">Configure your brand profile. Everything Citacious and the agent pipeline uses flows from here.</p>
        </div>
        {/* Quick-fill for L8EntSpace account */}
        {userData?.email === 'hopiumcalculator@gmail.com' || userData?.email === 'sales@l8entspace.com' ? (
          <button
            onClick={applyL8EntSpaceDefaults}
            className="text-xs px-3 py-1.5 border border-pink-500/30 text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors whitespace-nowrap"
          >
            Fill L8EntSpace defaults
          </button>
        ) : null}
      </div>

      {saveMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${saveMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {saveMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
          <span className="text-sm">{saveMsg.text}</span>
        </div>
      )}

      {/* Brand profile */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Brand Profile</CardTitle>
          <CardDescription className="text-zinc-400">The core identity that Citacious, the Citation Probe, and all agents use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Account Email</label>
            <Input disabled value={user?.email || ''} className="bg-zinc-950 border-zinc-800 text-zinc-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Brand Name</label>
              <Input name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. L8EntSpace" className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Primary Domain</label>
              <Input name="domain" value={formData.domain} onChange={handleChange} placeholder="l8entspace.com" className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Target Keywords</CardTitle>
          <CardDescription className="text-zinc-400">The primary queries you want your brand cited for in AI responses. Think "what would my customer ask ChatGPT before buying?"</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5,6,7,8,9,10].map(num => (
              <div key={num} className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Keyword {num}</label>
                <Input name={`keyword${num}`} value={(formData as any)[`keyword${num}`]} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white text-sm" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Competitors */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-white">Competitor Tracking</CardTitle>
              <CardDescription className="text-zinc-400 mt-1">Brands racing you for AI citations. Primary competitors get full deep-analysis. Watchlist competitors are tracked for mentions.</CardDescription>
            </div>
            <button
              onClick={discoverCompetitors}
              disabled={isDiscoveringCompetitors || !formData.brand}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap ml-4"
            >
              {isDiscoveringCompetitors ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              AI Discover
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary competitors */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Primary</span>
              <span className="text-xs text-zinc-600">— max 4, full benchmark analysis</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1,2,3,4].map(num => (
                <div key={num} className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Competitor {num}</label>
                  <Input name={`competitor${num}`} value={(formData as any)[`competitor${num}`]} onChange={handleChange} placeholder="competitor.com" className="bg-zinc-950 border-zinc-800 text-white text-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Watchlist */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Watchlist</span>
              <span className="text-xs text-zinc-600">— unlimited, mention tracking only</span>
            </div>
            <div className="flex gap-2 mb-3">
              <Input
                value={watchlistInput}
                onChange={e => setWatchlistInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && watchlistInput.trim()) {
                    setWatchlistCompetitors(prev => [...new Set([...prev, watchlistInput.trim()])]);
                    setWatchlistInput('');
                  }
                }}
                placeholder="competitor.com — press Enter to add"
                className="bg-zinc-950 border-zinc-800 text-white text-sm"
              />
              <button
                onClick={() => {
                  if (watchlistInput.trim()) {
                    setWatchlistCompetitors(prev => [...new Set([...prev, watchlistInput.trim()])]);
                    setWatchlistInput('');
                  }
                }}
                className="px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-sm transition-colors whitespace-nowrap"
              >
                Add
              </button>
            </div>
            {watchlistCompetitors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {watchlistCompetitors.map(c => (
                  <span key={c} className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300">
                    {c}
                    <button onClick={() => setWatchlistCompetitors(prev => prev.filter(x => x !== c))} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-600">No watchlist competitors yet. Add any number of brands to track for AI mention signals.</p>
            )}
          </div>

          <p className="text-xs text-zinc-600">Don&apos;t know your competitors? Click <span className="text-cyan-500">AI Discover</span> — Gemini will identify the brands most likely competing with you for AI citations.</p>
        </CardContent>
      </Card>

      {/* Semantic anchors */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-white">Semantic Anchors</CardTitle>
              <CardDescription className="text-zinc-400 mt-1">The primary concepts AI engines associate with your brand in latent space. These appear in your Latent Space Map and guide Citacious&apos;s strategy.</CardDescription>
            </div>
            <button
              onClick={generateAnchors}
              disabled={isGeneratingAnchors || !formData.brand}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap ml-4"
            >
              {isGeneratingAnchors ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Anchors
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {anchors.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-zinc-700 rounded-xl">
              <Network className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No semantic anchors configured.</p>
              <p className="text-xs text-zinc-600 mt-1">Set your brand name above, then click &ldquo;Generate Anchors&rdquo; to position your brand in the latent space.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {anchors.map((a: any, i: number) => (
                <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${ANCHOR_TYPE_COLORS[a.baseType] || 'text-zinc-400 border-zinc-700 bg-zinc-800'}`}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color || '#ff1493' }} />
                  <span>{a.label}</span>
                  <span className="text-zinc-500 font-normal">· {a.baseType}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social accounts */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Connected Social Accounts</CardTitle>
          <CardDescription className="text-zinc-400">Connect platforms to enable Fact Amplifier one-click publishing. Your credentials are stored only in your browser session — not transmitted to L8EntSpace servers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {SOCIAL_PLATFORMS.map(({ key, label, sub, Icon, bg, color, hint, placeholder }) => {
              const isConnected = connectedSocials.includes(key);
              const isExpanded  = connectingPlatform === key + '_expand';
              return (
                <div key={key} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden transition-all">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-white">{label}</h4>
                          {isConnected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <p className="text-xs text-zinc-500">{sub}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isConnected ? (
                        <button
                          onClick={() => handleDisconnectSocial(key)}
                          className="px-3 py-1.5 text-xs border border-zinc-700 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 rounded-lg transition-colors"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => setConnectingPlatform(isExpanded ? null : key + '_expand')}
                          className="px-3 py-1.5 text-xs border border-zinc-700 text-zinc-300 hover:border-pink-500/40 hover:text-pink-400 rounded-lg transition-colors"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Inline connect form */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-zinc-800/60 pt-3">
                      <p className="text-xs text-zinc-500 mb-2">{hint}</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={socialInputs[key] || ''}
                          onChange={e => setSocialInputs(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                          onKeyDown={e => e.key === 'Enter' && handleConnectSocial(key)}
                        />
                        <button
                          onClick={() => handleConnectSocial(key)}
                          disabled={!socialInputs[key]?.trim()}
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Integrations</CardTitle>
          <CardDescription className="text-zinc-400">Connect L8EntSpace to your internal server and submit your sitemap to search engines.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sitemap */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Sitemap URL</label>
            <div className="flex gap-2">
              <Input readOnly value="https://l8entspace.com/sitemap.xml" className="bg-zinc-950 border-zinc-800 text-zinc-400 font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText('https://l8entspace.com/sitemap.xml')}>Copy</Button>
            </div>
            <p className="text-xs text-zinc-500">Submit to Google Search Console and Bing Webmaster Tools. All 40+ public pages are indexed here — critical for AI crawler discovery.</p>
          </div>

          {/* Inbound webhook */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Inbound Webhook — Your Server → L8EntSpace</label>
            <div className="flex gap-2">
              <Input readOnly value={origin ? `${origin}/api/webhooks/l8entspace` : ''} className="bg-zinc-950 border-zinc-800 text-zinc-400 font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`${origin}/api/webhooks/l8entspace`)}>Copy</Button>
            </div>
            <p className="text-xs text-zinc-500">
              Configure your internal server to POST here when content is published. Header: <code className="text-zinc-300">x-l8entspace-secret</code>. Body: <code className="text-zinc-300">&#123; userId, type: &quot;article&quot;|&quot;fact&quot;, title, content, url &#125;</code>
            </p>
          </div>

          {/* Outbound webhook */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Outbound Webhook — L8EntSpace → Your CMS</label>
            <div className="flex gap-2">
              <Input name="cmsWebhookUrl" value={formData.cmsWebhookUrl} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" placeholder="https://your-internal-server.com/api/l8entspace-push" />
              {origin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, cmsWebhookUrl: `${origin}/api/notify-article` }))}
                  className="shrink-0 text-xs"
                >
                  Use Email Notify
                </Button>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              L8EntSpace posts generated articles and schema to this URL when you click &quot;Publish to Database &amp; CMS&quot;.{' '}
              No CMS yet? Click <strong className="text-zinc-400">Use Email Notify</strong> — we&apos;ll email the article directly to your account address instead.
              Payload: <code className="text-zinc-300">&#123; userId, topic, article, facts, schema, brand, timestamp &#125;</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* S7.2: Industry benchmarks opt-in */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Industry Benchmarks</CardTitle>
          <CardDescription className="text-zinc-400">
            See how your citation rate compares to other brands in your industry. Opt in to contribute your anonymised rate and unlock the benchmark band on your Citation Probe chart.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Industry Category</label>
            <input
              type="text"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              placeholder="e.g. B2B SaaS, E-commerce, Fintech, Healthcare"
              className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40"
            />
          </div>
          <button
            onClick={() => setBenchmarkOptIn(v => !v)}
            className="flex items-center gap-3 text-left"
          >
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${benchmarkOptIn ? 'bg-pink-500' : 'bg-zinc-700'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${benchmarkOptIn ? 'translate-x-6' : 'translate-x-1'}`} />
            </span>
            <span className="text-sm text-zinc-300">
              {benchmarkOptIn ? 'Contributing to industry benchmarks' : 'Not contributing (benchmarks hidden)'}
            </span>
          </button>
          <p className="text-xs text-zinc-600">
            We only ever share aggregated averages across at least 3 opted-in brands — never your brand name, your domain, or your individual rate. You can opt out anytime.
          </p>
        </CardContent>
      </Card>

      {/* pr-20/pr-28 keeps the button clear of the fixed Citacious copilot bubble (bottom-right, z-50) */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-4 flex items-center justify-end gap-3 border-t border-zinc-800 bg-zinc-950/90 pl-4 pr-20 sm:pr-28 py-3 backdrop-blur">
        {saveMsg && (
          <span className={`text-sm ${saveMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {saveMsg.text}
          </span>
        )}
        <Button onClick={handleSave} disabled={isSaving} className="!bg-pink-600 hover:!bg-pink-500 !text-white font-semibold px-8">
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
