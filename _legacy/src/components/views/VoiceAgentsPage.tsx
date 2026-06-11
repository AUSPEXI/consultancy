import React from 'react';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';
import { VoiceAgent } from '@/components/ui/voice-agent';

export function VoiceAgentsPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 flex flex-col overflow-x-hidden">
      <PublicHeader onLoginClick={signInWithGoogle} />
      
      <main className="pt-32 pb-24 flex-1">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 text-zinc-300 text-sm font-medium mb-6 border border-zinc-700">
              <Sparkles className="w-4 h-4" />
              <span>Next-Gen Conversational AI</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">
              Voice Agents that Actually <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">Close Deals</span>
            </h1>
            <p className="text-xl text-zinc-400">
              Deploy ultra-low latency, human-like voice AI to handle your inbound calls, onboard customers, and upsell your services 24/7.
            </p>
          </div>

          <VoiceAgent />
        </div>
      </main>

      <Footerdemo />
    </div>
  );
}
