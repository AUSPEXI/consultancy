import { blogPosts } from "@/data/blogPosts";
import { BlogHero } from "@/components/BlogHero";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OGPreview({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
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
