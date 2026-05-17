import { blogPosts } from "@/data/blogPosts";
import { BlogIndexClient } from "@/components/BlogIndexClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Auspexi GEO Strategy",
  description: "The latest insights, research, and tactics for Generative Engine Optimization. Learn how to protect your brand reputation in the AI era.",
};

export default function BlogIndex() {
  return <BlogIndexClient posts={blogPosts} />;
}
