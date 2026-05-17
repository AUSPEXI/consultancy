'use client';

import React from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { BlogHero } from '@/components/BlogHero';
import { useAuth } from '@/contexts/AuthContext';

export function BlogIndexClient({ posts }: { posts: any[] }) {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 overflow-x-hidden">
      <PublicHeader onLoginClick={signInWithGoogle} />
      
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">GEO Strategy Insights</h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              The proprietary engineering behind securing your brand in the Latent Space.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-16">
            {posts.map((post, i) => (
              <Link href={`/blog/${post.slug}`} key={i} className="group cursor-pointer flex flex-col">
                <div className="w-full flex min-h-[240px] rounded-2xl overflow-hidden mb-6 border border-zinc-800 relative bg-[#0B0E14] shadow-2xl group-hover:border-zinc-700 transition-colors">
                  <BlogHero title={post.title} category={post.category} compact={true} />
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-zinc-500 mb-3">
                  <span className="text-pink-400 bg-pink-400/10 px-3 py-1 rounded-md">{post.category}</span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
                <h3 className="text-2xl font-bold text-zinc-200 group-hover:text-white transition-colors leading-tight mb-3">
                  {post.title}
                </h3>
                <p className="text-zinc-400 line-clamp-3 text-sm leading-relaxed">
                  {post.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footerdemo />
    </div>
  );
}
