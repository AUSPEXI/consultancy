import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mic, X, Square, Volume2, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceAgent } from '@/contexts/VoiceAgentContext';

export function FloatingVoiceButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCardDismissed, setIsCardDismissed] = useState(true);
  const location = useLocation();
  const { isConnected, isSpeaking, disconnect } = useVoiceAgent();

  useEffect(() => {
    // Show the button after a short delay
    if (isConnected) {
      setIsVisible(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isConnected]);

  // Use VoiceAgentContext's connect method
  const { connect } = useVoiceAgent();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4"
        >
          {!isConnected && !isCardDismissed && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 max-w-[250px] relative">
              <button 
                onClick={() => setIsCardDismissed(true)}
                className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  AI Agent Online
                </p>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                Have questions about your SOV or Fact-Vault? Talk to Citaticious now.
              </p>
              <button 
                onClick={() => {
                  connect();
                  setIsCardDismissed(true);
                }}
                className="flex items-center justify-center gap-2 w-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors"
              >
                <Mic className="w-4 h-4" />
                Start Voice Analysis
              </button>
            </div>
          )}
          
          {isConnected ? (
            <button 
              onClick={disconnect}
              className="w-14 h-14 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-full flex items-center justify-center shadow-lg shadow-zinc-900/50 transition-transform hover:scale-105 relative"
            >
              {isSpeaking && (
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
              )}
              <Square className="w-5 h-5 fill-current relative z-10" />
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {isCardDismissed && (
                <button
                  onClick={() => setIsCardDismissed(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md transition-colors"
                >
                  Ask AI
                </button>
              )}
              <button 
                onClick={() => setIsCardDismissed(false)}
                className="w-14 h-14 bg-zinc-700 hover:bg-zinc-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-zinc-900/50 transition-transform hover:scale-105"
              >
                <Mic className="w-6 h-6" />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
