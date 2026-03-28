import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { blogPosts } from './BlogPage';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function BlogPostPage() {
  const { slug } = useParams();
  const { signInWithGoogle } = useAuth();
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <Link to="/blog" className="text-indigo-400 hover:text-indigo-300">Return to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 overflow-x-hidden">
      <PublicHeader onLoginClick={signInWithGoogle} />
      
      <main className="pt-32 pb-24">
        <article className="max-w-3xl mx-auto px-6">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to all articles
          </Link>
          
          <div className="mb-12">
            <div className="flex items-center gap-3 text-sm font-medium text-zinc-500 mb-6">
              <span className="text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-md">{post.category}</span>
              <span>•</span>
              <span>{post.date}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-8 leading-tight">
              {post.title}
            </h1>
            <div className="aspect-[21/9] rounded-2xl overflow-hidden border border-zinc-800">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
            </div>
          </div>
          
          <div className="prose prose-invert prose-zinc max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-img:rounded-xl">
            <p className="lead text-xl text-zinc-300 mb-8">
              {post.excerpt}
            </p>
            
            <h2>The Shift from SEO to GEO</h2>
            <p>
              For the last two decades, SEO has been a game of keywords, backlinks, and technical site structure. The goal was simple: rank as high as possible on the SERP (Search Engine Results Page) so users would click your blue link.
            </p>
            <p>
              But the landscape has fundamentally changed. Generative AI models like ChatGPT, Gemini, and Claude are now providing direct answers to users' questions. They synthesize information from across the web and present it in a conversational format.
            </p>
            
            <h3>Why Traditional SEO is Failing</h3>
            <p>
              When a user asks an AI a question, they aren't looking for a list of links to click. They are looking for the answer. If your content is optimized for clicks rather than citations, you will be left behind.
            </p>
            <ul>
              <li><strong>Zero-Click Searches:</strong> Users get their answer without ever visiting your site.</li>
              <li><strong>Contextual Relevance:</strong> AI models prioritize highly specific, factual data over generic, keyword-stuffed content.</li>
              <li><strong>Authority Signals:</strong> AI models look for consensus across multiple high-authority platforms (Reddit, LinkedIn, etc.), not just your own domain.</li>
            </ul>

            <h2>How to Optimize for Generative Engines</h2>
            <p>
              To succeed in this new era, you need to shift your focus from ranking links to ranking facts. This is the core of Generative Engine Optimization (GEO).
            </p>
            <p>
              By structuring your data as "Cite-Magnets" and seeding those facts across the internet, you can force AI models to cite your brand as the primary source of truth.
            </p>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 my-12 text-center">
              <h3 className="text-2xl font-bold mb-4 mt-0">Ready to dominate AI search?</h3>
              <p className="text-zinc-400 mb-6">
                Start extracting high-entropy facts and tracking your Share of Voice today.
              </p>
              <Link to="/" className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
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
