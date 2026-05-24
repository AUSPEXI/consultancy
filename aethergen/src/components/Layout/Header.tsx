import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

interface HeaderProps {
  canAccessPlatform?: boolean;
}

const Header: React.FC<HeaderProps> = ({ canAccessPlatform = false }) => {
  const [privacy, setPrivacy] = useState<{ epsilon?: number; synthetic_ratio?: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { epsilon?: number; synthetic_ratio?: number };
      setPrivacy(detail);
    };
    window.addEventListener('aethergen:apply-privacy', handler as EventListener);
    return () => window.removeEventListener('aethergen:apply-privacy', handler as EventListener);
  }, []);

  return (
    <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-slate-100 shadow-md/30 backdrop-blur">
      <div className="w-full pl-3 pr-1 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          {/* Try external logo first; fallback to Shield if it fails */}
          <img
            src="/auspexi.svg"
            alt="Auspexi"
            className="h-12 w-12 sm:h-16 sm:w-16 mr-3"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const sibling = document.createElement('span');
              sibling.className = 'inline-flex';
              sibling.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400"><path fill="currentColor" d="M12 2l7 4v6c0 5-3.4 9.4-7 10c-3.6-.6-7-5-7-10V6l7-4z"/></svg>';
              target.parentElement?.insertBefore(sibling, target.nextSibling);
            }}
          />
          <div className="mr-2">
            <h1 className="text-xl font-extrabold tracking-tight">AethergenAI</h1>
            <p className="text-xs text-blue-200/90 italic">The Edge of Chaos and Order: Modular AI Training Pipeline</p>
            <p className="text-xs text-blue-300/90">Powered by AUSPEXI</p>
          </div>
          {/* Mobile menu toggle */}
          <button
            className="sm:hidden ml-auto px-3 py-2 rounded border border-slate-700/60 bg-slate-800/60 text-slate-100"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle navigation"
          >
            <span className="block w-5 h-0.5 bg-slate-200 mb-1" />
            <span className="block w-5 h-0.5 bg-slate-200 mb-1" />
            <span className="block w-5 h-0.5 bg-slate-200" />
          </button>
        </div>
        
        {/* Desktop/tablet nav */}
        <nav className="hidden sm:flex flex-wrap gap-2 items-center">
          {privacy && (
            <div className="px-3 py-1.5 rounded-md bg-blue-800/60 text-sm border border-blue-700/40">
              ε {privacy.epsilon ?? '—'} • {privacy.synthetic_ratio ?? '—'}%
            </div>
          )}
          
          {/* Show different navigation based on authentication status */}
          {!canAccessPlatform ? (
            // Landing page navigation (for signed-out users)
            <>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'home' } }))}
                className="px-3 py-1.5 rounded-md bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 transition-colors"
              >Home</button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'press' } }))}
                className="px-3 py-1.5 rounded-md bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 transition-colors"
              >🏆 Press</button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'resources' } }))}
                className="px-3 py-1.5 rounded-md bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 transition-colors"
              >Resources</button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'pricing' } }))}
                className="px-3 py-2 rounded-md bg-emerald-700/70 hover:bg-emerald-600/70 border border-emerald-600/50 transition-colors"
              >Pricing</button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'account' } }))}
                className="px-3 py-1.5 rounded-md bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 transition-colors"
              >Account</button>
            </>
          ) : (
            // Platform navigation (for signed-in users)
            <>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'upload' } }))}
                className="px-3 py-1.5 rounded-md bg-blue-700/70 hover:bg-blue-600/70 border border-blue-600/50 transition-colors"
              >📤 Upload</button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'design' } }))}
                className="px-3 py-1.5 rounded-md bg-blue-700/70 hover:bg-blue-600/70 border border-blue-600/50 transition-colors"
              >📋 Design</button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'generate' } }))}
                className="px-3 py-1.5 rounded-md bg-blue-700/70 hover:bg-blue-600/70 border border-blue-600/50 transition-colors"
              >⚙️ Generate</button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'modellab' } }))}
                className="px-3 py-1.5 rounded-md bg-blue-700/70 hover:bg-blue-600/70 border border-blue-600/50 transition-colors"
              >🧠 Model Lab</button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'press' } }))}
                className="px-3 py-1.5 rounded-md bg-blue-700/70 hover:bg-blue-600/70 border border-blue-600/50 transition-colors"
              >🏆 Press</button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'account' } }))}
                className="px-3 py-1.5 rounded-md bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 transition-colors"
              >Account</button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'home' } }))}
                className="px-3 py-1.5 rounded-md bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 transition-colors"
              >Sales</button>
            </>
          )}
          
          {/* Legal links hidden per request; available in footer */}
          <a 
            href="https://auspexi.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center px-3 py-1.5 rounded-md bg-white/90 text-blue-900 hover:bg-white transition-colors font-medium"
          >
            AUSPEXI
          </a>
        </nav>

        {/* Mobile dropdown nav */}
        {menuOpen && (
          <div className="sm:hidden w-full mt-2 grid grid-cols-2 gap-2">
            {!canAccessPlatform ? (
              // Landing page navigation (for signed-out users)
              <>
                <button onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'home' } }))} className="px-3 py-2 rounded-md bg-slate-800/60 border border-slate-700/40 text-sm">Home</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'press' } }))} className="px-3 py-2 rounded-md bg-slate-800/60 border border-slate-700/40 text-sm">🏆 Press</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'resources' } }))} className="px-3 py-2 rounded-md bg-slate-800/60 border border-slate-700/40 text-sm">Resources</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'pricing' } }))} className="px-3 py-2 rounded-md bg-emerald-700/70 border border-emerald-600/50 text-sm">Pricing</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'account' } }))} className="px-3 py-2 rounded-md bg-slate-800/60 border border-slate-700/40 text-sm">Account</button>
              </>
            ) : (
              // Platform navigation (for signed-in users)
              <>
                <button onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'upload' } }))} className="px-3 py-2 rounded-md bg-blue-700/70 border border-blue-600/50 text-sm">📤 Upload</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'design' } }))} className="px-3 py-2 rounded-md bg-blue-700/70 border border-blue-600/50 text-sm">📋 Design</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'generate' } }))} className="px-3 py-2 rounded-md bg-blue-700/70 border border-blue-600/50 text-sm">⚙️ Generate</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'modellab' } }))} className="px-3 py-2 rounded-md bg-blue-700/70 border border-blue-600/50 text-sm">🧠 Model Lab</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'press' } }))} className="px-3 py-2 rounded-md bg-blue-700/70 border border-blue-600/50 text-sm">🏆 Press</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'account' } }))} className="px-3 py-2 rounded-md bg-slate-800/60 border border-slate-700/40 text-sm">Account</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('aeg:navigate', { detail: { tab: 'home' } }))} className="px-3 py-2 rounded-md bg-slate-800/60 border border-slate-700/40 text-sm">Sales</button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;