import fs from 'fs';
import path from 'path';
import { blogPosts } from '../src/data/blogPosts';

function generateSitemap() {
  const appUrl = 'https://auspexi.com';
  const today = new Date().toISOString().split('T')[0];

  const staticRoutes = ['', '/blog'];
  const staticUrls = staticRoutes.map(route => `
  <url>
    <loc>${appUrl}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('');

  const blogUrls = blogPosts.map(post => {
    const dateObj = new Date(post.date);
    const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : today;
    return `
  <url>
    <loc>${appUrl}/blog/${post.slug}</loc>
    <lastmod>${formattedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${blogUrls}
</urlset>`;

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
  console.log('Static sitemap generated at public/sitemap.xml');
}

generateSitemap();
