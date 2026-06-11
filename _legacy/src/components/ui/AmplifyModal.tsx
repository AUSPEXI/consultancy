import React, { useState, useEffect } from 'react';
import { X, Loader2, Copy, CheckCircle2, Linkedin, Twitter, Youtube, MessageSquare, Instagram } from 'lucide-react';
import { logAuditAction } from '@/lib/audit';
import { auth, db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface AmplifyModalProps {
  fact: string;
  onClose: () => void;
}

interface GeneratedContent {
  linkedin: string;
  reddit: string;
  twitter: string;
  youtube: string;
  tiktok: string;
  instagram: string;
}

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export const AmplifyModal: React.FC<AmplifyModalProps> = ({ fact, onClose }) => {
  const { user, userData } = useAuth();
  const [isGenerating, setIsGenerating] = useState(true);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<keyof GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connectedAccounts = userData?.connectedSocials || [];
  const [publishStatus, setPublishStatus] = useState<Record<string, 'publishing' | 'published'>>({});

  const handleConnect = async (platform: string) => {
    if (!user) return;
    try {
       const newSocials = [...connectedAccounts, platform];
       await updateDoc(doc(db, 'users', user.uid), { connectedSocials: newSocials });
    } catch (e) {
       console.error("Failed to update socials", e);
    }
  };

  const handlePublish = async (platform: string, text: string) => {
    setPublishStatus((prev) => ({ ...prev, [platform]: 'publishing' }));
    
    // Wire up to actual webhook if available
    if (userData?.cmsWebhookUrl) {
      try {
        const response = await fetch(userData.cmsWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'SOCIAL_PUBLISH',
            timestamp: new Date().toISOString(),
            payload: {
              platform,
              content: text
            }
          })
        });
        
        if (!response.ok) {
          throw new Error('Webhook rejected the request');
        }
      } catch (err) {
        console.error("Failed to publish via webhook", err);
        alert(`Failed to publish via webhook. Please check your Webhook URL in Settings.`);
        setPublishStatus((prev) => {
          const newState = { ...prev };
          delete newState[platform];
          return newState;
        });
        return;
      }
    } else {
      alert("No Platform Webhook URL configured. Please set one in Settings to enable auto-publishing.");
      setPublishStatus((prev) => {
        const newState = { ...prev };
        delete newState[platform];
        return newState;
      });
      return;
    }

    setTimeout(() => {
      setPublishStatus((prev) => ({ ...prev, [platform]: 'published' }));
      if (auth.currentUser) {
        logAuditAction(auth.currentUser.uid, 'CONTENT_AUTO_PUBLISHED', { platform });
      }
    }, 500);
  };

  useEffect(() => {
    const generateContent = async () => {
      try {
        const response = await fetch('/api/amplify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fact }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate content");
        }

        const result = await response.json();
        setContent(result);
        
        // Log the successful amplification action
        if (auth.currentUser) {
          await logAuditAction(auth.currentUser.uid, 'CONTENT_AMPLIFIED', {
            factPreview: fact.substring(0, 50) + '...',
            platformsGenerated: Object.keys(result)
          });
        }
      } catch (err: any) {
        console.error('Error generating omnichannel content:', err);
        setError(err.message || 'Failed to generate content. Please try again.');
        
        // Log the failure
        if (auth.currentUser) {
          await logAuditAction(auth.currentUser.uid, 'CONTENT_AMPLIFICATION_FAILED', {
            error: err.message,
            factPreview: fact.substring(0, 50) + '...'
          });
        }
      } finally {
        setIsGenerating(false);
      }
    };

    generateContent();
  }, [fact]);

  const handleCopy = (platform: keyof GeneratedContent, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
    
    if (auth.currentUser) {
      logAuditAction(auth.currentUser.uid, 'CONTENT_COPIED', {
        platform
      });
    }
  };

  const platforms: { key: keyof GeneratedContent; label: string; icon: any; color: string }[] = [
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-zinc-400' },
    { key: 'twitter', label: 'Twitter / X', icon: Twitter, color: 'text-zinc-500' },
    { key: 'reddit', label: 'Reddit', icon: MessageSquare, color: 'text-zinc-400' },
    { key: 'youtube', label: 'YouTube Shorts', icon: Youtube, color: 'text-pink-600' },
    { key: 'tiktok', label: 'TikTok', icon: TiktokIcon, color: 'text-pink-500' },
    { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Omnichannel Amplifier
            </h2>
            <p className="text-sm text-zinc-400 mt-1 truncate max-w-xl">
              Seeding: "{fact}"
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              <p className="text-zinc-400 animate-pulse">Generating platform-optimized content...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 text-rose-400">
              <p>{error}</p>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          ) : content ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm font-medium text-zinc-200">{label}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(key, content[key])}
                      className="text-xs flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700 px-2 py-1 rounded"
                    >
                      {copiedPlatform === key ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 flex-1">
                    <textarea
                      readOnly
                      value={content[key]}
                      className="w-full h-48 bg-transparent text-sm text-zinc-300 resize-none focus:outline-none custom-scrollbar"
                    />
                  </div>
                  <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                    {connectedAccounts.includes(key) ? (
                      <button
                        onClick={() => handlePublish(key, content[key])}
                        disabled={publishStatus[key] === 'publishing' || publishStatus[key] === 'published'}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         {publishStatus[key] === 'publishing' ? (
                           <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Publishing...</>
                         ) : publishStatus[key] === 'published' ? (
                           <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/> Published!</>
                         ) : (
                           <>Auto-Publish</>
                         )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(key)}
                        className="px-3 py-1.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-md transition-colors"
                      >
                        Connect Account
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
