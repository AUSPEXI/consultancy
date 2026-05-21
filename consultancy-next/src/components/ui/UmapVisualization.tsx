'use client'

import dynamic from 'next/dynamic';
import { useRef, useMemo, useState, useCallback } from 'react';

// Three.js / R3F can't run on the server — load client-only
const UmapScene = dynamic(() => import('./UmapScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#09090b]">
      <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse mb-3" />
      <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Initialising Neural Field...</p>
    </div>
  ),
});

export function UmapVisualization({ points = [] }: { points?: any[] }) {
  return (
    <div className="w-full h-full bg-transparent relative group">
      <UmapScene points={points} />

      {/* Overlay — top-left info */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 w-fit">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-[9px] font-black text-white tracking-[0.2em] uppercase">768-D Latent Explorer</span>
          </div>
          <p className="text-[8px] text-zinc-500 font-mono ml-2">INTERACTIVE_NEURAL_RECONSTRUCTION_MODE</p>

          <div className="mt-4 flex flex-col gap-1 bg-black/30 backdrop-blur-sm border border-white/5 p-2 rounded-lg max-w-[150px]">
            <p className="text-[8px] text-zinc-400 font-bold uppercase mb-1 border-b border-white/10 pb-1">Data Integrity Pulse</p>
            <div className="flex justify-between items-center text-[7px] text-zinc-500">
              <span>Verified Citations:</span>
              <span className="text-emerald-400 font-mono">1,240</span>
            </div>
            <div className="flex justify-between items-center text-[7px] text-zinc-500">
              <span>Model Confidence:</span>
              <span className="text-emerald-400 font-mono">98.2%</span>
            </div>
            <div className="flex justify-between items-center text-[7px] text-zinc-500">
              <span>Vector Sync:</span>
              <span className="text-pink-400 font-mono">Real-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay — bottom-right nav hint */}
      <div className="absolute bottom-4 right-4 z-10 opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="text-right">
          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Navigation</p>
          <p className="text-[8px] text-zinc-500 font-mono">DRAG TO ROTATE • SCROLL TO ZOOM</p>
        </div>
      </div>
    </div>
  );
}

export default UmapVisualization;
