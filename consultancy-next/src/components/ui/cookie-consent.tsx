'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'l8entspace_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = (all: boolean) => {
    localStorage.setItem(CONSENT_KEY, all ? 'all' : 'essential');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-[0_0_0_2px_rgba(255,255,255,0.08),0_0_40px_rgba(0,0,0,0.6)] p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white mb-1">We use cookies</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Essential cookies keep the platform running. Optional cookies help us improve it.
              Read our{' '}
              <Link href="/privacy" className="text-pink-400 hover:text-pink-300 underline underline-offset-2">
                Privacy Policy
              </Link>{' '}
              for details.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => accept(false)}
              className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700 whitespace-nowrap"
            >
              Essential Only
            </button>
            <button
              onClick={() => accept(true)}
              className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-pink-600 hover:bg-pink-500 text-white transition-colors whitespace-nowrap shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
