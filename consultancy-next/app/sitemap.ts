import { MetadataRoute } from 'next';
import { blogPosts } from '@/data/blogPosts';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://l8entspace.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,                         lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/about`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/blog`,               lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/lab`,                lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/faq`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/resources`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/roadmap`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/voice-agents`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/investors`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,             lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/acceptable-use`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => {
    // Use the post's real publish date so the sitemap reports honest change
    // signals, rather than every URL claiming it changed on every build.
    const parsed = new Date(post.date);
    const lastModified = isNaN(parsed.getTime()) ? new Date() : parsed;
    return {
      url: `${base}/blog/${post.slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    };
  });

  return [...staticRoutes, ...blogRoutes];
}
