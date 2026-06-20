import React from 'react';
import StoryboardExplorer from './components/StoryboardExplorer';

export default function App() {
  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 font-sans border-ui relative overflow-x-hidden p-1 sm:p-2">
      
      {/* GENEROUS MATTE BACKGROUND GLOWS */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-pink-950/5 via-purple-950/5 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-6">
        
        {/* EDITORIAL BANNER TOP LINE */}
        <header className="border-b border-white/5 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 select-none">
          <div className="max-w-2xl space-y-2">
            <p className="text-[9px] uppercase tracking-widest text-[#ff007f] font-black font-mono">
              Research Dossier // June 2026 • L8EntSpace Lab
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none">
              The Number Anchor Theory
            </h1>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-xl">
              Testing whether search engine LLMs prioritize precise statistics over qualitative descriptions. Replacing <span className="text-emerald-400 italic">"improved significantly"</span> with <span className="text-[#ff007f] font-semibold">"cut closing time 43%"</span> lifted Claude citations from 25% to 100%.
            </p>
          </div>

          <div className="flex items-end gap-4 font-mono">
            <div className="text-left md:text-right leading-none">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#ff007f] tracking-tighter">
                100%
              </div>
              <span className="text-[7.5px] uppercase tracking-widest text-zinc-555 border border-white/5 px-2 py-0.5 rounded bg-black/40 font-bold block mt-1">
                Claude Citations Lift
              </span>
            </div>
          </div>
        </header>

        {/* PRIMARY CINEMATIC EXPERIENCE SANDBOX DECK */}
        <main className="space-y-6">
          <StoryboardExplorer />
        </main>

        {/* HUD FOOTER COMPACT */}
        <footer className="pt-8 pb-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] text-zinc-555 font-mono select-none">
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <span className="text-[#ff007f] font-bold uppercase tracking-widest text-[8.5px]">L8EntSpace</span>
            <span>Benchmarking Engine v2.4</span>
          </div>
          <div>
            <span>Verified June 11, 2026 Snapshot</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
