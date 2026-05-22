'use client'

import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { useVoiceAgent } from '@/contexts/VoiceAgentContext';

export function VoiceAgent() {
  const { isConnected, isConnecting, isSpeaking, error, connect, disconnect } = useVoiceAgent();

  return (
    <div className="max-w-2xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-500/5 to-transparent pointer-events-none" />

      <div className="w-32 h-32 mx-auto mb-8 flex items-center justify-center relative">
        {isConnected && isSpeaking && (
          <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-ping" />
        )}
        {isConnected && !isSpeaking && (
          <div className="absolute inset-4 bg-pink-500/10 rounded-full animate-pulse" />
        )}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center relative z-10 transition-colors duration-500 ${isConnected ? 'bg-pink-950/60 border border-pink-500/30' : 'bg-zinc-800'}`}>
          {isSpeaking ? (
            <Volume2 className={`w-10 h-10 ${isConnected ? 'text-pink-400' : 'text-zinc-400'}`} />
          ) : (
            <Mic className={`w-10 h-10 ${isConnected ? 'text-pink-400' : 'text-zinc-400'}`} />
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">
        {isConnected ? "Citacious is Active" : "Talk to Citacious, Your GEO Guide"}
      </h2>
      <p className="text-zinc-400 mb-8 h-12">
        {isConnected
          ? (isSpeaking ? "Citacious is speaking..." : "Listening...")
          : "Click below to start a live voice conversation about GEO and your brand strategy."}
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-left">
          {error}
        </div>
      )}

      {isConnected ? (
        <button
          onClick={disconnect}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-8 py-4 rounded-full font-medium inline-flex items-center gap-2 transition-colors"
        >
          <Square className="w-5 h-5 fill-current" />
          End Call
        </button>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          className="bg-pink-600 hover:bg-pink-500 text-white px-8 py-4 rounded-full font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          {isConnecting ? "Connecting..." : "Start Call"}
        </button>
      )}
    </div>
  );
}
