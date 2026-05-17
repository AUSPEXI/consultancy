import { BLOG_POSTS } from '@/lib/blog';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';

export const metadata = {
  title: 'Auspexi Blog | Intelligence for the Latent Space',
  description: 'Deep dives into GEO strategy, semantic auditing, and AI brand protection.',
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Inside the <span className="text-pink-500">Latent Space.</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Latest tactics, research, and insights into Generative Engine Optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
              <article className="h-full flex flex-col p-6 rounded-3xl bg-zinc-900/30 border border-white/5 hover:border-pink-500/20 transition-all">
                <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 mb-8">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4 font-mono uppercase tracking-widest">
                    <span className="text-pink-500">{post.category}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-4 group-hover:text-pink-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-zinc-500 leading-relaxed mb-8">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-white group-hover:gap-4 transition-all">
                  Read Article <ArrowRight className="w-4 h-4" />
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
