'use client';

import React from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { BlogHero } from '@/components/BlogHero';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export function BlogPostClient({ post }: { post: any }) {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 overflow-x-hidden">
      <PublicHeader onLoginClick={signInWithGoogle} />
      
      <main className="pt-32 pb-24">
        <article className="max-w-3xl mx-auto px-6">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to all articles
          </Link>
          
          <div className="mb-12">
            <div className="flex items-center gap-3 text-sm font-medium text-zinc-500 mb-6">
              <span className="text-pink-400 bg-pink-400/10 px-3 py-1 rounded-md">{post.category}</span>
              <span>•</span>
              <span>{post.date}</span>
            </div>
            <div className="w-full min-h-[300px] md:min-h-[400px] flex rounded-2xl overflow-hidden border border-zinc-800 relative bg-[#0B0E14] group">
              <BlogHero title={post.title} category={post.category} compact={false} />
            </div>
          </div>
          
          <div className="prose prose-invert prose-zinc max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-pink-400 hover:prose-a:text-pink-300 prose-img:rounded-xl">
            <p className="lead text-xl text-zinc-300 mb-8 font-medium">
              {post.excerpt}
            </p>
            
            {post.content ? (
              <div className="markdown-body">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{post.content}</ReactMarkdown>
              </div>
            ) : (
              // Fallback content if needed, though most posts should have content
              <div className="py-12 border-t border-zinc-900 mt-12">
                <p className="text-zinc-500 italic">This post contains proprietary case study data restricted to authenticated users.</p>
              </div>
            )}
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 my-12 text-center">
              <h3 className="text-2xl font-bold mb-4 mt-0">Ready to dominate AI search?</h3>
              <p className="text-zinc-400 mb-6">
                Start extracting high-entropy facts and tracking your Share of Voice today.
              </p>
              <Link href="/" className="inline-flex items-center justify-center bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Start Your Free Trial
              </Link>
            </div>
          </div>
        </article>
      </main>

      <Footerdemo />
    </div>
  );
}
