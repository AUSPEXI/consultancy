'use client'

import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { VoiceAgent } from '@/components/ui/voice-agent';
import { VoiceAgentProvider } from '@/contexts/VoiceAgentContext';
import { Sparkles, Mic, Zap, Brain, MessageSquare, Shield } from 'lucide-react';

const features = [
  { icon: Zap, title: "Ultra-Low Latency", description: "Sub-500ms response times powered by Gemini Live API for natural, real-time conversation." },
  { icon: Brain, title: "Brand-Aware Intelligence", description: "Citacious pulls from your Fact-Vault and live SOV metrics to give hyper-personalized GEO guidance." },
  { icon: MessageSquare, title: "Knowledge Extraction", description: "Every conversation is analyzed post-call to extract new facts and strengthen your Fact-Vault automatically." },
  { icon: Shield, title: "Echo Cancellation", description: "Advanced audio processing eliminates feedback so the agent only hears you, not itself." },
];

export default function VoiceAgentsPage() {
  return (
    <VoiceAgentProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 flex flex-col overflow-x-hidden">
        <PublicHeader />

        <main className="pt-32 pb-24 flex-1">
          <div className="max-w-7xl mx-auto px-6">

            {/* Hero */}
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-300 text-sm font-medium mb-6 border border-pink-500/20">
                <Sparkles className="w-4 h-4" />
                <span>Gemini Live · Real-Time Voice AI</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">
                Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600">Citacious</span>
              </h1>
              <p className="text-xl text-zinc-400 leading-relaxed">
                Your legendary GEO Quest-Guide. Ask anything about brand visibility, AI search strategy, or your live metrics — and get an instant, intelligent answer.
              </p>
            </div>

            {/* Voice Widget */}
            <VoiceAgent />

            {/* Feature Grid */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => (
                <div key={f.title} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-pink-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="mt-24 bg-gradient-to-br from-pink-900/10 to-purple-900/10 border border-pink-500/20 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono mb-6 border border-zinc-700">
                  <Mic className="w-3 h-3 text-pink-400" />
                  HOW IT WORKS
                </div>
                <h2 className="text-3xl font-bold font-heading mb-4 text-white">Three Steps to Latent Space Mastery</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 text-left">
                  {[
                    { step: "01", title: "Connect", desc: "Click Start Call. Your browser requests mic access and establishes a secure real-time session with Gemini Live." },
                    { step: "02", title: "Ask Anything", desc: "Ask about your GEO strategy, request a live metrics briefing, or get Citacious to navigate you to specific dashboard tools." },
                    { step: "03", title: "Level Up", desc: "Post-call, insights are extracted and fed back into your Fact-Vault, deepening the AI's understanding of your brand." },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="text-3xl font-black text-pink-500/30 font-mono leading-none mt-1">{item.step}</div>
                      <div>
                        <h3 className="font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </main>

        <Footerdemo />
      </div>
    </VoiceAgentProvider>
  );
}
