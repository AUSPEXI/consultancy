import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { blogPosts } from '../../data/blogPosts';
import { BlogHero } from '../BlogHero';

export default function OGPreviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" />;
  }

  return (
    <div className="w-[1200px] h-[630px] bg-[#0B0E14] overflow-hidden flex items-center justify-center border-4 border-[#EC4899]/50">
      <div className="w-full h-full">
         <BlogHero 
           title={post.title} 
           category={post.category} 
           className="h-full"
         />
      </div>
    </div>
  );
}
