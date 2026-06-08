import type { Metadata } from 'next';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import Link from 'next/link';
import { blogPosts } from '@/data/blogPosts';
import { BlogHero } from '@/components/BlogHero';

export const metadata: Metadata = {
  title: 'GEO Strategy Insights | L8EntSpace Blog',
  description: 'The latest tactics, research and case studies on Generative Engine Optimization. Learn how to dominate AI search across ChatGPT, Gemini, Claude and Perplexity.',
  metadataBase: new URL('https://l8entspace.com'),
  alternates: { canonical: 'https://l8entspace.com/blog' },
  openGraph: {
    title: 'GEO Strategy Insights | L8EntSpace Blog',
    description: 'The latest tactics, research and case studies on Generative Engine Optimization.',
    url: 'https://l8entspace.com/blog',
    type: 'website',
    images: [{ url: '/geo-infographic.png', width: 1200, height: 630, alt: 'L8EntSpace Blog — GEO Strategy Insights' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GEO Strategy Insights | L8EntSpace Blog',
    description: 'The latest tactics, research and case studies on Generative Engine Optimization.',
    images: ['/geo-infographic.png'],
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30">
      <PublicHeader />

      <main className="pt-32 pb-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">GEO Strategy Insights</h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              The latest tactics, research, and case studies on Generative Engine Optimization. Learn how to dominate AI search.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.slug} className="group cursor-pointer bg-zinc-900 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(255,20,147,1)]">
                <div className="w-full h-[220px] flex-shrink-0 overflow-hidden border-b border-zinc-800 relative bg-[#0B0E14]">
                  <BlogHero title={post.title} category={post.category} compact={true} />
                </div>
                <div className="p-6 flex flex-col flex-1 bg-zinc-900">
                  <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 mb-3">
                    <span className="text-pink-400 bg-pink-400/10 px-2 py-1 rounded-md">{post.category}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-200 group-hover:text-white transition-colors leading-snug mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-zinc-400 text-sm line-clamp-2 mt-auto font-sans">
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
