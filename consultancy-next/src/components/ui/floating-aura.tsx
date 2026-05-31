'use client'

import { useState } from 'react';
import { Mic, X, Volume2, Loader2 } from 'lucide-react';
import { VoiceAgentProvider } from '@/contexts/VoiceAgentContext';
import { useVoiceAgent } from '@/contexts/VoiceAgentContext';

function AuraPanel({ onClose }: { onClose: () => void }) {
  const { isConnected, isConnecting, isSpeaking, error, connect, disconnect } = useVoiceAgent();

  return (
    <div className="w-72 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-zinc-500'}`} />
          <span className="text-sm font-semibold text-white">Aura</span>
          <span className="text-xs text-zinc-400">· GEO Guide</span>
        </div>
        <button
          onClick={() => { if (isConnected) disconnect(); onClose(); }}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col items-center gap-4">
        {/* Animated icon */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          {isConnected && isSpeaking && (
            <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-ping" />
          )}
          {isConnected && !isSpeaking && (
            <div className="absolute inset-2 bg-pink-500/10 rounded-full animate-pulse" />
          )}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300 ${
            isConnected ? 'bg-pink-950/60 border border-pink-500/30' : 'bg-zinc-800'
          }`}>
            {isSpeaking
              ? <Volume2 className={`w-6 h-6 ${isConnected ? 'text-pink-400' : 'text-zinc-400'}`} />
              : <Mic className={`w-6 h-6 ${isConnected ? 'text-pink-400' : 'text-zinc-400'}`} />
            }
          </div>
        </div>

        <p className="text-xs text-zinc-400 text-center h-8">
          {isConnected
            ? isSpeaking ? 'Aura is speaking...' : 'Listening...'
            : 'Ask anything about GEO, pricing, or Auspexi.'}
        </p>

        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}

        {isConnected ? (
          <button
            onClick={disconnect}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <X className="w-4 h-4" />
            End Call
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            {isConnecting ? 'Connecting...' : 'Start Call'}
          </button>
        )}
      </div>
    </div>
  );
}

export function FloatingAura() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <VoiceAgentProvider>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {isOpen && <AuraPanel onClose={() => setIsOpen(false)} />}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-900/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            title="Talk to Aura"
          >
            <Mic className="w-6 h-6" />
          </button>
        )}
      </div>
    </VoiceAgentProvider>
  );
}
