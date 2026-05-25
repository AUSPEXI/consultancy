'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { Chrome, Linkedin, Twitter, MessageCircle, Instagram, Music2, CheckCircle2, Loader2, Sparkles, Network, X } from 'lucide-react';

const AUSPEXI_GEO_KEYWORDS = [
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

const AUSPEXI_COMPETITORS = [
  'brightedge.com', 'semrush.com', 'conductor.com',
  'clearscope.io', 'marketmuse.com', 'botify.com',
];

const AUSPEXI_ANCHORS = [
  { label: 'GEO Authority',        color: '#ec4899', baseType: 'Systemic Anchor' },
  { label: 'Citation Engineering', color: '#ec4899', baseType: 'Systemic Anchor' },
  { label: 'AI Share of Voice',    color: '#06b6d4', baseType: 'Signal Point'    },
  { label: 'Semantic Moat',        color: '#8b5cf6', baseType: 'Emergent Trend'  },
  { label: 'Knowledge Vault',      color: '#06b6d4', baseType: 'Signal Point'    },
];

const SOCIAL_PLATFORMS = [
  {
    key: 'linkedin', label: 'LinkedIn', sub: 'Professional network post seeding',
    Icon: Linkedin, bg: 'bg-[#0A66C2]/10', color: 'text-[#0A66C2]',
    hint: 'For posting (Amplify), paste your LinkedIn OAuth Access Token. For monitoring (Pulse), enter your Profile URL.',
    placeholder: 'https://linkedin.com/company/auspexi or OAuth token',
  },
  {
    key: 'twitter', label: 'X / Twitter', sub: 'Real-time narrative seeding',
    Icon: Twitter, bg: 'bg-white/10', color: 'text-white',
    hint: 'Enter your X/Twitter profile URL or API Bearer Token for automated posting.',
    placeholder: 'https://x.com/auspexi or Bearer token',
  },
  {
    key: 'instagram', label: 'Instagram', sub: 'Visual brand authority',
    Icon: Instagram, bg: 'bg-pink-500/10', color: 'text-pink-500',
    hint: 'Enter your Instagram profile URL. Full posting requires a Meta Business Account access token.',
    placeholder: 'https://instagram.com/auspexi',
  },
  {
    key: 'tiktok', label: 'TikTok', sub: 'Short-form viral seeding',
    Icon: Music2, bg: 'bg-cyan-500/10', color: 'text-cyan-400',
    hint: 'Enter your TikTok profile URL for monitoring, or access token for automated content.',
    placeholder: 'https://tiktok.com/@auspexi',
  },
  {
    key: 'reddit', label: 'Reddit', sub: 'Consensus seeding in communities',
    Icon: MessageCircle, bg: 'bg-[#FF4500]/10', color: 'text-[#FF4500]',
    hint: 'Enter your Reddit username or subreddit URLs you participate in for GEO monitoring.',
    placeholder: 'u/auspexi or r/seo,r/marketing',
  },
  {
    key: 'webform', label: 'Webform / API', sub: 'Custom endpoint integration',
    Icon: Chrome, bg: 'bg-zinc-100/10', color: 'text-zinc-100',
    hint: 'Custom API endpoint. Auspexi will POST structured brand data here.',
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
  const [formData, setFormData] = useState({
    brand: '', domain: '', cmsWebhookUrl: '',
    keyword1: '', keyword2: '', keyword3: '', keyword4: '', keyword5: '',
    keyword6: '', keyword7: '', keyword8: '', keyword9: '', keyword10: '',
    competitor1: '', competitor2: '', competitor3: '', competitor4: '', competitor5: '', competitor6: ''
  });

  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    if (userData) {
      setConnectedSocials(userData.connectedSocials || []);
      setAnchors(userData.latentAnchors || []);
      setFormData({
        brand: userData.brand || '',
        domain: userData.domain || '',
        cmsWebhookUrl: userData.cmsWebhookUrl || '',
        keyword1: userData.keywords?.[0] || '', keyword2: userData.keywords?.[1] || '',
        keyword3: userData.keywords?.[2] || '', keyword4: userData.keywords?.[3] || '',
        keyword5: userData.keywords?.[4] || '', keyword6: userData.keywords?.[5] || '',
        keyword7: userData.keywords?.[6] || '', keyword8: userData.keywords?.[7] || '',
        keyword9: userData.keywords?.[8] || '', keyword10: userData.keywords?.[9] || '',
        competitor1: userData.competitors?.[0] || '', competitor2: userData.competitors?.[1] || '',
        competitor3: userData.competitors?.[2] || '', competitor4: userData.competitors?.[3] || '',
        competitor5: userData.competitors?.[4] || '', competitor6: userData.competitors?.[5] || '',
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
    } catch {
      setConnectedSocials(connectedSocials);
    }
  };

  // ── Semantic anchors ────────────────────────────────────────────────────────
  const generateAnchors = async () => {
    if (!user || !formData.brand) return;
    setIsGeneratingAnchors(true);
    try {
      const res = await fetch('/api/suggest-anchors', {
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
      await fetch('/api/save-anchors', {
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

  const applyAuspexiDefaults = () => {
    setFormData(prev => ({
      ...prev,
      brand: 'Auspexi',
      domain: 'auspexi.com',
      keyword1: AUSPEXI_GEO_KEYWORDS[0], keyword2: AUSPEXI_GEO_KEYWORDS[1],
      keyword3: AUSPEXI_GEO_KEYWORDS[2], keyword4: AUSPEXI_GEO_KEYWORDS[3],
      keyword5: AUSPEXI_GEO_KEYWORDS[4], keyword6: AUSPEXI_GEO_KEYWORDS[5],
      keyword7: AUSPEXI_GEO_KEYWORDS[6], keyword8: AUSPEXI_GEO_KEYWORDS[7],
      keyword9: AUSPEXI_GEO_KEYWORDS[8], keyword10: AUSPEXI_GEO_KEYWORDS[9],
      competitor1: AUSPEXI_COMPETITORS[0], competitor2: AUSPEXI_COMPETITORS[1],
      competitor3: AUSPEXI_COMPETITORS[2], competitor4: AUSPEXI_COMPETITORS[3],
      competitor5: AUSPEXI_COMPETITORS[4], competitor6: AUSPEXI_COMPETITORS[5],
    }));
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const userRef = doc(db, 'users', user.uid);
      const competitors = [formData.competitor1, formData.competitor2, formData.competitor3, formData.competitor4, formData.competitor5, formData.competitor6].filter(Boolean);
      const keywords = [formData.keyword1, formData.keyword2, formData.keyword3, formData.keyword4, formData.keyword5, formData.keyword6, formData.keyword7, formData.keyword8, formData.keyword9, formData.keyword10].filter(Boolean);
      await setDoc(userRef, { brand: formData.brand, domain: formData.domain, cmsWebhookUrl: formData.cmsWebhookUrl, competitors, keywords }, { merge: true });
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
        {/* Quick-fill for Auspexi account */}
        {userData?.email === 'hopiumcalculator@gmail.com' || userData?.email === 'sales@auspexi.com' ? (
          <button
            onClick={applyAuspexiDefaults}
            className="text-xs px-3 py-1.5 border border-pink-500/30 text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors whitespace-nowrap"
          >
            Fill Auspexi defaults
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
              <Input name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. Auspexi" className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Primary Domain</label>
              <Input name="domain" value={formData.domain} onChange={handleChange} placeholder="auspexi.com" className="bg-zinc-950 border-zinc-800 text-white" />
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
          <CardTitle className="text-white">Competitor Tracking</CardTitle>
          <CardDescription className="text-zinc-400">Brands you are racing for AI citations. Enter their domains — the platform monitors their content decay and flags displacement opportunities.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(num => (
              <div key={num} className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Competitor {num}</label>
                <Input name={`competitor${num}`} value={(formData as any)[`competitor${num}`]} onChange={handleChange} placeholder="competitor.com" className="bg-zinc-950 border-zinc-800 text-white text-sm" />
              </div>
            ))}
          </div>
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
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color || '#ec4899' }} />
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
          <CardDescription className="text-zinc-400">Connect platforms to enable Fact Amplifier one-click publishing. Your credentials are stored only in your browser session — not transmitted to Auspexi servers.</CardDescription>
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
          <CardDescription className="text-zinc-400">Connect Auspexi to your internal server and submit your sitemap to search engines.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sitemap */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Sitemap URL</label>
            <div className="flex gap-2">
              <Input readOnly value="https://auspexi.com/sitemap.xml" className="bg-zinc-950 border-zinc-800 text-zinc-400 font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText('https://auspexi.com/sitemap.xml')}>Copy</Button>
            </div>
            <p className="text-xs text-zinc-500">Submit to Google Search Console and Bing Webmaster Tools. All 40+ public pages are indexed here — critical for AI crawler discovery.</p>
          </div>

          {/* Inbound webhook */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Inbound Webhook — Your Server → Auspexi</label>
            <div className="flex gap-2">
              <Input readOnly value={origin ? `${origin}/api/webhooks/auspexi` : ''} className="bg-zinc-950 border-zinc-800 text-zinc-400 font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`${origin}/api/webhooks/auspexi`)}>Copy</Button>
            </div>
            <p className="text-xs text-zinc-500">
              Configure your internal server to POST here when content is published. Header: <code className="text-zinc-300">x-auspexi-secret</code>. Body: <code className="text-zinc-300">&#123; userId, type: &quot;article&quot;|&quot;fact&quot;, title, content, url &#125;</code>
            </p>
          </div>

          {/* Outbound webhook */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Outbound Webhook — Auspexi → Your CMS</label>
            <div className="flex gap-2">
              <Input name="cmsWebhookUrl" value={formData.cmsWebhookUrl} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" placeholder="https://your-internal-server.com/api/auspexi-push" />
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
              Auspexi posts generated articles and schema to this URL when you click &quot;Publish to Database &amp; CMS&quot;.{' '}
              No CMS yet? Click <strong className="text-zinc-400">Use Email Notify</strong> — we&apos;ll email the article directly to your account address instead.
              Payload: <code className="text-zinc-300">&#123; userId, topic, article, facts, schema, brand, timestamp &#125;</code>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving} className="bg-white text-zinc-900 hover:bg-zinc-200 px-8">
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
