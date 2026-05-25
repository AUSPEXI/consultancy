'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { Chrome, Linkedin, Twitter, MessageCircle, Instagram, Music2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, userData } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [connectedSocials, setConnectedSocials] = useState<string[]>([]);
  const [origin, setOrigin] = useState('');
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

  const handleToggleSocial = async (platform: string) => {
    if (!user) return;
    const isConnected = connectedSocials.includes(platform);
    if (!isConnected) {
      let promptMsg = `Please enter your ${platform} profile URL, ID, or Token to connect:`;
      if (platform === 'linkedin') promptMsg = `Connect LinkedIn for automated seeding.\n\nFor "Amplify" (posting) features, paste your LinkedIn OAuth Access Token.\nFor "Pulse" (monitoring) features, enter your Profile ID or URL.`;
      const result = window.prompt(promptMsg);
      if (!result) return;
    }
    const newSocials = isConnected ? connectedSocials.filter(p => p !== platform) : [...connectedSocials, platform];
    setConnectedSocials(newSocials);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { connectedSocials: newSocials }, { merge: true });
      alert(`Successfully ${isConnected ? 'disconnected' : 'connected'} ${platform}!`);
    } catch (error) {
      console.error(error);
      setConnectedSocials(connectedSocials);
      alert('Failed to update social connections. Please ensure your Firestore rules are updated.');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const competitors = [formData.competitor1, formData.competitor2, formData.competitor3, formData.competitor4, formData.competitor5, formData.competitor6].filter(Boolean);
      const keywords = [formData.keyword1, formData.keyword2, formData.keyword3, formData.keyword4, formData.keyword5, formData.keyword6, formData.keyword7, formData.keyword8, formData.keyword9, formData.keyword10].filter(Boolean);
      await setDoc(userRef, { brand: formData.brand, domain: formData.domain, cmsWebhookUrl: formData.cmsWebhookUrl, competitors, keywords }, { merge: true });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save settings. Please ensure your Firestore Security Rules are configured correctly.');
    } finally {
      setIsSaving(false);
    }
  };

  const socials = [
    { key: 'linkedin', label: 'LinkedIn', sub: 'Professional network post seeding', Icon: Linkedin, bg: 'bg-[#0A66C2]/10', color: 'text-[#0A66C2]' },
    { key: 'twitter', label: 'X / Twitter', sub: 'Real-time narrative seeding', Icon: Twitter, bg: 'bg-white/10', color: 'text-white' },
    { key: 'instagram', label: 'Instagram', sub: 'Visual brand authority', Icon: Instagram, bg: 'bg-pink-500/10', color: 'text-pink-500' },
    { key: 'tiktok', label: 'TikTok', sub: 'Short-form viral seeding', Icon: Music2, bg: 'bg-cyan-500/10', color: 'text-cyan-400' },
    { key: 'reddit', label: 'Reddit', sub: 'Autonomous consensus seeding', Icon: MessageCircle, bg: 'bg-[#FF4500]/10', color: 'text-[#FF4500]' },
    { key: 'webform', label: 'Webform / API', sub: 'Custom endpoint integration', Icon: Chrome, bg: 'bg-zinc-100/10', color: 'text-zinc-100' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Account Settings</h1>
        <p className="text-zinc-400">Manage your brand profile and Auspexi configuration.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Profile &amp; Brand</CardTitle>
          <CardDescription className="text-zinc-400">The core information Auspexi uses to evaluate your AI Share of Voice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Account Email</label>
            <Input disabled value={user?.email || ''} className="bg-zinc-950 border-zinc-800 text-zinc-500" />
            <p className="text-xs text-zinc-500">Contact support to change your account email.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Brand Name</label>
              <Input name="brand" value={formData.brand} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Primary Domain</label>
              <Input name="domain" value={formData.domain} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" placeholder="e.g. acme.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Target Keywords</CardTitle>
          <CardDescription className="text-zinc-400">The primary topics we track for AI citations.</CardDescription>
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

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Competitor Tracking</CardTitle>
          <CardDescription className="text-zinc-400">Identify who you are racing against for LLM consensus.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(num => (
              <div key={num} className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Competitor {num}</label>
                <Input name={`competitor${num}`} value={(formData as any)[`competitor${num}`]} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white text-sm" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Linked Social Accounts</CardTitle>
          <CardDescription className="text-zinc-400">Connect platforms to enable one-click Omnichannel publishing.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socials.map(({ key, label, sub, Icon, bg, color }) => (
              <div key={key} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{label}</h4>
                    <p className="text-xs text-zinc-500">{sub}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className={connectedSocials.includes(key) ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-300' : 'border-zinc-700 text-zinc-300 bg-zinc-800 hover:bg-zinc-700 hover:text-white'} onClick={() => handleToggleSocial(key)}>
                  {connectedSocials.includes(key) ? 'Connected' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Integrations</CardTitle>
          <CardDescription className="text-zinc-400">Connect Auspexi to your existing infrastructure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Sitemap */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Sitemap URL</label>
            <div className="flex gap-2">
              <Input readOnly value="https://auspexi.com/sitemap.xml" className="bg-zinc-950 border-zinc-800 text-zinc-400 font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText('https://auspexi.com/sitemap.xml'); alert('Sitemap URL copied!'); }}>Copy</Button>
            </div>
            <p className="text-xs text-zinc-500">Submit this to Google Search Console, Bing Webmaster Tools, and any AI search engine registration portals. All 31+ pages are indexed here.</p>
          </div>

          {/* Inbound webhook */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Inbound Webhook — Your Server → Auspexi</label>
            <div className="flex gap-2">
              <Input readOnly value={origin ? `${origin}/api/webhooks/auspexi` : ''} className="bg-zinc-950 border-zinc-800 text-zinc-400 font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${origin}/api/webhooks/auspexi`); alert('Inbound Webhook URL copied!'); }}>Copy</Button>
            </div>
            <p className="text-xs text-zinc-500">
              Configure your internal server to POST here when content is published. Include header <code className="text-zinc-300">x-auspexi-secret: YOUR_SECRET</code> and body <code className="text-zinc-300">&#123; userId, type: &quot;article&quot;|&quot;fact&quot;, title, content, url &#125;</code>
            </p>
          </div>

          {/* Outbound webhook */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Outbound Webhook — Auspexi → Your Server</label>
            <Input name="cmsWebhookUrl" value={formData.cmsWebhookUrl} onChange={handleChange} className="bg-zinc-950 border-zinc-800 text-white" placeholder="https://your-internal-server.com/api/auspexi-push" />
            <p className="text-xs text-zinc-500">Auspexi will POST generated articles and schema here. Your server receives <code className="text-zinc-300">&#123; event, timestamp, data: &#123; title, content, schema &#125; &#125;</code></p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving} className="bg-white text-zinc-900 hover:bg-zinc-200">
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
