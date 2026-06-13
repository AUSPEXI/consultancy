'use client';

import { useState, useEffect, useCallback } from 'react';
import { Linkedin, Twitter, MessageSquare, Youtube, Instagram, Copy, CheckCircle2, Loader2, Send, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth-fetch';

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const PLATFORM_META: Record<string, { label: string; Icon: any; color: string }> = {
  linkedin:  { label: 'LinkedIn',        Icon: Linkedin,     color: 'text-zinc-400' },
  twitter:   { label: 'Twitter / X',     Icon: Twitter,      color: 'text-zinc-500' },
  reddit:    { label: 'Reddit',          Icon: MessageSquare,color: 'text-zinc-400' },
  youtube:   { label: 'YouTube Shorts',  Icon: Youtube,      color: 'text-pink-600' },
  tiktok:    { label: 'TikTok',          Icon: TiktokIcon,   color: 'text-pink-500' },
  instagram: { label: 'Instagram',       Icon: Instagram,    color: 'text-pink-400' },
};

interface QueueItem {
  id: string;
  sourceTitle: string;
  sourceUrl: string | null;
  status: 'pending' | 'published' | 'dismissed';
  platforms: Record<string, string>;
  createdAt: string;
}

export default function SocialQueuePage() {
  const { userData } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'published' | 'dismissed'>('pending');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/social-queue');
      const data = await res.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const publish = async (item: QueueItem, platform: string) => {
    const key = `${item.id}:${platform}`;
    if (!userData?.cmsWebhookUrl) {
      alert('No Platform Webhook URL configured. Set one in Settings to enable publishing.');
      return;
    }
    setPublishing(key);
    try {
      const res = await authFetch('/api/social-publish', {
        method: 'POST',
        body: JSON.stringify({
          id: item.id,
          platform,
          content: item.platforms[platform],
          sourceTitle: item.sourceTitle,
          sourceUrl: item.sourceUrl,
          webhookUrl: userData.cmsWebhookUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'published' } : i));
    } catch (err: any) {
      console.error('Publish failed:', err);
      alert(`Publish failed: ${err.message}`);
    } finally {
      setPublishing(null);
    }
  };

  const dismiss = async (id: string) => {
    setDismissing(id);
    try {
      await authFetch('/api/social-queue', { method: 'PATCH', body: JSON.stringify({ id, status: 'dismissed' }) });
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'dismissed' } : i));
    } finally {
      setDismissing(null);
    }
  };

  const visible = items.filter(i => i.status === filter);

  const counts = {
    pending: items.filter(i => i.status === 'pending').length,
    published: items.filter(i => i.status === 'published').length,
    dismissed: items.filter(i => i.status === 'dismissed').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Social Queue</h1>
        <p className="text-zinc-400 text-sm mt-1">Auto-generated posts from published articles. Publish or dismiss each item.</p>
      </div>

      <div className="flex gap-2">
        {(['pending', 'published', 'dismissed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${filter === s ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            {s} {counts[s] > 0 && <span className="ml-1 opacity-70">{counts[s]}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading queue...</span>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 text-zinc-600 text-sm">
          {filter === 'pending' ? 'No pending posts. Publish an article via the inbound webhook to auto-generate posts.' : `No ${filter} posts.`}
        </div>
      ) : (
        <div className="space-y-6">
          {visible.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.sourceTitle}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                {item.status === 'pending' && (
                  <button
                    onClick={() => dismiss(item.id)}
                    disabled={dismissing === item.id}
                    title="Dismiss"
                    className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
                  >
                    {dismissing === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800">
                {Object.entries(item.platforms).map(([platform, text]) => {
                  const meta = PLATFORM_META[platform];
                  if (!meta) return null;
                  const { label, Icon, color } = meta;
                  const copyKey = `${item.id}:${platform}`;
                  const pubKey = `${item.id}:${platform}`;

                  return (
                    <div key={platform} className="bg-zinc-900 flex flex-col">
                      <div className="px-4 py-2.5 flex items-center justify-between border-b border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${color}`} />
                          <span className="text-xs font-medium text-zinc-300">{label}</span>
                        </div>
                        <button onClick={() => copy(copyKey, text)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                          {copied === copyKey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="p-3 flex-1">
                        <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap line-clamp-6">{text}</p>
                      </div>
                      {item.status === 'pending' && (
                        <div className="px-3 pb-3">
                          <button
                            onClick={() => publish(item, platform)}
                            disabled={!!publishing}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-md transition-colors disabled:opacity-40"
                          >
                            {publishing === pubKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Publish
                          </button>
                        </div>
                      )}
                      {item.status === 'published' && (
                        <div className="px-3 pb-3">
                          <div className="w-full flex items-center justify-center gap-1.5 py-1.5 text-emerald-500 text-xs">
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
