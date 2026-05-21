'use client'

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { blogPosts } from '@/data/blogPosts';
import { BlogHero } from '@/components/BlogHero';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <Link href="/blog" className="text-pink-400 hover:text-pink-300">Return to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 overflow-x-hidden">
      <PublicHeader />

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
            <div className="w-full min-h-[300px] md:min-h-[400px] flex rounded-2xl overflow-hidden relative bg-[#0B0E14] group shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
              <BlogHero title={post.title} category={post.category} compact={false} />
            </div>
          </div>

          <div id="blog-content-container" className="prose prose-invert prose-zinc max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-pink-400 hover:prose-a:text-pink-300 prose-img:rounded-xl">
            <p className="lead text-xl text-zinc-300 mb-8 font-medium font-sans">
              {post.excerpt}
            </p>

            {post.content ? (
              <div className="markdown-body font-sans text-zinc-300 space-y-4 leading-relaxed">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{post.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="font-sans text-zinc-350 space-y-6">
                <h2>The Shift from SEO to GEO</h2>
                <p>
                  For the last two decades, SEO has been a game of keywords, backlinks, and technical site structure. The goal was simple: rank as high as possible on the SERP (Search Engine Results Page) so users would click your blue link.
                </p>
                <p>
                  But the landscape has fundamentally changed. Generative AI models like ChatGPT, Gemini, and Claude are now providing direct answers to users&apos; questions. They synthesize information from across the web and present it in a conversational format.
                </p>
                <h3>Why Traditional SEO is Failing</h3>
                <p>
                  When a user asks an AI a question, they aren&apos;t looking for a list of links to click. They are looking for the answer. If your content is optimized for clicks rather than citations, you will be left behind.
                </p>
                <ul>
                  <li><strong>Zero-Click Searches:</strong> Users get their answer without ever visiting your site.</li>
                  <li><strong>Contextual Relevance:</strong> AI models prioritize highly specific, factual data over generic, keyword-stuffed copy.</li>
                  <li><strong>Authority Signals:</strong> AI models look for consensus across multiple high-authority platforms, not just your own domain.</li>
                </ul>
                <h2>How to Optimize for Generative Engines</h2>
                <p>
                  To succeed in this new era, you need to shift your focus from ranking links to ranking facts. This is the core of Generative Engine Optimization (GEO).
                </p>
              </div>
            )}

            <div className="bg-zinc-900/50 rounded-xl p-8 my-12 text-center shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
              <h3 className="text-2xl font-bold mb-4 mt-0">Ready to dominate AI search?</h3>
              <p className="text-zinc-400 mb-6">
                Start extracting high-entropy facts and tracking your Share of Voice today.
              </p>
              <Link href="/" className="inline-flex items-center justify-center bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]">
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
