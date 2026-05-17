import { Metadata, ResolvingMetadata } from 'next';
import { getBlogPost } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Props = {
  params: Promise<{ slug: string }>;
};

// --- THIS IS THE KEY FIX FOR SOCIAL MEDIA PREVIEWS ---
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title} | Auspexi Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: 'article',
      url: `https://auspexi.com/blog/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  return (
    <main className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
      <article className="max-w-3xl mx-auto">
        <Link href="/blog" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to blog
        </Link>
        
        <div className="mb-12">
          <div className="flex items-center gap-4 text-sm text-pink-400 mb-6 font-medium">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {post.date}</span>
            <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> {post.category}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight">
            {post.title}
          </h1>
          <p className="text-xl text-zinc-400 leading-relaxed italic">
            {post.excerpt}
          </p>
        </div>

        <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 mb-12 relative">
          {/* Using a standard img for now since we don't have remotePatterns config fully verified in all environments yet, 
              but next/image is preferred if config is correct */}
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="prose prose-invert prose-pink max-w-none">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
