import React from 'react';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { blogPosts } from '@/data/blogPosts';

export function BlogPage() {
  const { signInWithGoogle } = useAuth();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 overflow-x-hidden">
      <PublicHeader onLoginClick={signInWithGoogle} />
      
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">GEO Strategy Insights</h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              The latest tactics, research, and case studies on Generative Engine Optimization. Learn how to dominate AI search.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link to={`/blog/${post.slug}`} key={post.slug} className="group cursor-pointer bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors flex flex-col">
                <div className="aspect-[16/9] overflow-hidden border-b border-zinc-800">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 mb-3">
                    <span className="text-pink-400 bg-pink-400/10 px-2 py-1 rounded-md">{post.category}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-200 group-hover:text-white transition-colors leading-snug mb-3">
                    {post.title}
                  </h3>
                  <p className="text-zinc-400 text-sm line-clamp-3 mt-auto">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footerdemo />
    </div>
  );
}
