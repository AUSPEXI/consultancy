import React, { useState, useEffect } from 'react';
import { X, Loader2, Copy, CheckCircle2, Linkedin, Twitter, Youtube, MessageSquare } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface AmplifyModalProps {
  fact: string;
  onClose: () => void;
}

interface GeneratedContent {
  linkedin: string;
  reddit: string;
  twitter: string;
  youtube: string;
}

export const AmplifyModal: React.FC<AmplifyModalProps> = ({ fact, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(true);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<keyof GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateContent = async () => {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
        if (!apiKey) {
          throw new Error("API key is missing");
        }
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
          You are an expert Generative Engine Optimization (GEO) and social media strategist.
          Take the following core fact and rewrite it into 4 distinct social media posts optimized for maximum engagement and AI citation indexing.
          The goal is to seed this fact across the internet to build authority.
          
          Core Fact: "${fact}"
          
          Generate:
          1. A professional, thought-leadership post for LinkedIn.
          2. A conversational, value-driven post for Reddit (suitable for a relevant subreddit).
          3. A punchy, engaging thread or post for Twitter/X.
          4. A short, hook-driven script for a YouTube Short or TikTok.
          
          Return ONLY a JSON object with the following keys: 'linkedin', 'reddit', 'twitter', 'youtube'.
          The values should be the generated text for each platform.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        const result = JSON.parse(response.text || "{}");
        setContent(result);
      } catch (err) {
        console.error('Error generating omnichannel content:', err);
        setError('Failed to generate content. Please try again.');
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
  };

  const platforms: { key: keyof GeneratedContent; label: string; icon: React.ElementType; color: string }[] = [
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-400' },
    { key: 'twitter', label: 'Twitter / X', icon: Twitter, color: 'text-sky-400' },
    { key: 'reddit', label: 'Reddit', icon: MessageSquare, color: 'text-orange-500' },
    { key: 'youtube', label: 'YouTube Shorts', icon: Youtube, color: 'text-red-500' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
