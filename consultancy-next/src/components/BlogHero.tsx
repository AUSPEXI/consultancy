import React from 'react';

interface BlogHeroProps {
  title: string;
  category: string;
  compact?: boolean;
}

export function BlogHero({ title, category, compact }: BlogHeroProps) {
  return (
    <div className={`w-full flex flex-col justify-center items-center bg-zinc-900 border border-zinc-850 p-6 text-center ${compact ? 'py-12' : 'py-20 rounded-2xl'}`}>
      <div className="text-xs font-mono uppercase tracking-wider text-pink-400 mb-2">
        {category}
      </div>
      <h2 className={`font-heading font-bold text-white tracking-tight ${compact ? 'text-2xl' : 'text-3xl md:text-4xl max-w-2xl'}`}>
        {title}
      </h2>
      <div className="w-12 h-1 bg-zinc-800 rounded-full mt-4" />
    </div>
  );
}
