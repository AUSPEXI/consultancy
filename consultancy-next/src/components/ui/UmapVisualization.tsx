'use client'

import dynamic from 'next/dynamic';

const UmapScene = dynamic(() => import('./UmapScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#09090b]">
      <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse mb-3" />
      <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Initialising Neural Field...</p>
    </div>
  ),
});

export function UmapVisualization({
  points = [],
  userAnchors = [],
}: {
  points?: any[];
  userAnchors?: { label: string; color: string; baseType: string }[];
}) {
  return (
    <div className="w-full h-full bg-transparent relative group">
      <UmapScene points={points} userAnchors={userAnchors} />

      {/* Top-left status pill */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1">
        <div className="flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
          <span className="text-[9px] font-black text-white tracking-[0.2em] uppercase">TEO Latent Explorer</span>
        </div>
        <p className="text-[8px] text-zinc-600 font-mono ml-2">Ontological · Epistemological · Teleological</p>
      </div>

      {/* Bottom-right nav hint */}
      <div className="absolute bottom-4 right-4 z-10 opacity-30 group-hover:opacity-80 transition-opacity pointer-events-none text-right">
        <p className="text-[8px] text-zinc-400 font-mono uppercase tracking-wider">Drag · Scroll to zoom</p>
      </div>
    </div>
  );
}

export default UmapVisualization;
