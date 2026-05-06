import React from 'react';
import { Hash } from 'lucide-react';

interface BlogHeroProps {
  title: string;
  category: string;
  className?: string;
  compact?: boolean;
}

export function BlogHero({ title, category, className = '', compact = false }: BlogHeroProps) {
  
  return (
    <div className={`relative w-full h-full min-h-full flex flex-col justify-between overflow-hidden bg-[#0B0E14] ${compact ? 'p-4' : 'p-6 md:p-8'} ${className}`}>
      
      {/* Subtle vector grid in the OUTER frame */}
      <div 
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #EC4899 1px, transparent 1px), linear-gradient(to bottom, #EC4899 1px, transparent 1px)`,
          backgroundSize: compact ? '20px 20px' : '40px 40px'
        }}
      />
      
      {/* Glowing nodes effect - behind everything */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-pink-500/20 rounded-full blur-[60px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] bg-[#DB2777]/20 rounded-full blur-[80px] mix-blend-screen pointer-events-none" />
      
      {/* TOP TEXT - In the frame, outside the title box */}
      <div className="relative z-10 w-full flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full border border-pink-500/50 flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.4)] bg-zinc-950">
            <span className="text-[10px] font-bold text-pink-500 leading-none">A</span>
        </div>
        <span className="text-[10px] md:text-xs uppercase font-mono tracking-[0.2em] text-[#F472B6]/90 truncate">Latent Pulse / {category}</span>
      </div>

      {/* BOX WITH TITLE - Centered container */}
      <div className={`relative z-10 w-full flex-1 flex ${compact ? 'flex-col md:flex-row items-start md:items-center p-4 gap-4' : 'flex-col sm:flex-row items-center p-6 md:p-8 gap-6 md:gap-8'} rounded-2xl border border-pink-500/20 bg-zinc-950/60 shadow-[0_0_30px_-5px_rgba(236,72,153,0.15)] backdrop-blur-md`}>
        
        {/* Stylized Logo / Data-Viz Element */}
        <div className={`flex-shrink-0 flex items-center justify-center rounded-full border border-pink-500/30 ${compact ? 'w-16 h-16' : 'w-20 h-20 md:w-28 md:h-28'} bg-zinc-900/50 relative overflow-hidden group mx-auto sm:mx-0`}>
           <div className="absolute inset-0 bg-pink-500/10 animate-pulse" style={{ animationDuration: '4s' }} />
           <img src="/auspexi-logo.png" alt="Auspexi" className={`relative z-10 object-contain drop-shadow-[0_0_12px_rgba(236,72,153,0.8)] animate-pulse ${compact ? 'w-10 h-10' : 'w-12 h-12 md:w-16 md:h-16'}`} style={{ animationDuration: '4s' }} />
        </div>

        {/* Title Content */}
        <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left">
           <h3 className={`font-heading font-bold text-white leading-tight text-balance ${compact ? 'text-lg md:text-xl' : 'text-3xl md:text-4xl lg:text-5xl'} drop-shadow-md`}>
             {/* Highlight important words with pink */}
             {title.split(' ').map((word, i) => {
               const isHighlighted = i % 4 === 1 || word.length > 7 || ['AI', 'GEO', 'LLM', 'Search', 'Brand'].includes(word.replace(/[^a-zA-Z]/g, ''));
               return (
                 <span key={i} className={isHighlighted ? "text-[#EC4899]" : "text-white"}>
                   {word}{' '}
                 </span>
               );
             })}
           </h3>
        </div>
      </div>

      {/* BOTTOM TEXT - In the frame, lowest area */}
      {!compact && (
        <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full opacity-70 font-mono text-xs text-pink-200">
          <span className="flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-pink-500" /> SYS_RENDER_OK
          </span>
          <span className="text-zinc-600">|</span>
          <span className="flex items-center gap-1">
            NODE_1856
          </span>
        </div>
      )}
    </div>
  );
}

