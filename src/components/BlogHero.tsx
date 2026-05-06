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
    <div className={`relative w-full min-h-full bg-[#0B0E14] overflow-hidden flex items-center justify-center ${compact ? 'p-4' : 'p-8'} ${className}`}>
      {/* Subtle vector grid */}
      <div 
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #EC4899 1px, transparent 1px), linear-gradient(to bottom, #EC4899 1px, transparent 1px)`,
          backgroundSize: compact ? '20px 20px' : '40px 40px'
        }}
      />
      
      {/* Glowing nodes effect */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-pink-500/20 rounded-full blur-[60px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] bg-[#DB2777]/20 rounded-full blur-[80px] mix-blend-screen pointer-events-none" />
      
      {/* Glassmorphism card overlay */}
      <div className={`relative z-10 w-full min-h-full flex ${compact ? 'flex-col md:flex-row items-start md:items-center p-4 gap-4' : 'flex-col sm:flex-row items-center p-6 sm:p-8 gap-6 sm:gap-8'} rounded-xl border border-pink-500/20 bg-zinc-900/60 backdrop-blur-md shadow-[0_0_30px_-5px_rgba(236,72,153,0.15)]`}>
        
        {/* Stylized Logo / Data-Viz Element */}
        <div className={`flex-shrink-0 flex items-center justify-center rounded-full border border-pink-500/30 ${compact ? 'w-12 h-12 md:w-16 md:h-16' : 'w-20 h-20 sm:w-28 sm:h-28'} bg-zinc-900/50 relative overflow-hidden group`}>
           <div className="absolute inset-0 bg-pink-500/10 animate-pulse" style={{ animationDuration: '4s' }} />
           <img src="/auspexi-logo.png" alt="Auspexi" className={`relative z-10 object-contain drop-shadow-[0_0_12px_rgba(236,72,153,0.8)] animate-pulse ${compact ? 'w-8 h-8 md:w-10 md:h-10' : 'w-12 h-12 sm:w-16 sm:h-16'}`} style={{ animationDuration: '4s' }} />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-2">
           {/* Auspexi Brand Mark */}
           <div className="flex items-center gap-2 mb-2 sm:mb-3">
             <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-pink-500/50 flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.4)]">
                 <span className="text-[8px] sm:text-[10px] font-bold text-pink-500 leading-none">A</span>
             </div>
             <span className="text-[9px] sm:text-[11px] uppercase font-mono tracking-widest text-[#F472B6]/80 truncate">Latent Pulse / {category}</span>
           </div>
           
           <h3 className={`font-heading font-bold text-white leading-tight text-balance ${compact ? 'text-base sm:text-lg lg:text-xl' : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl'} drop-shadow-md`}>
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
           {!compact && (
             <div className="mt-4 flex items-center gap-2 opacity-50 font-mono text-[10px]">
               <Hash className="w-3 h-3 text-pink-500" />
               <span className="text-pink-200">SYS_RENDER_OK</span>
               <span className="text-zinc-600 px-2">|</span>
               <span className="text-pink-200">NODE_{Math.floor(Math.random() * 9000) + 1000}</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
