import { promises as fs } from 'node:fs';
import { join, basename } from 'node:path';

const BLOG_DIR = join(process.cwd(), 'public', 'blog-html');

function extractTitle(html) {
  const m1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (m1) return m1[1].replace(/<[^>]*>/g, '').trim();
  const m2 = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (m2) return m2[1].replace(/<[^>]*>/g, '').trim();
  return '';
}

function computeReadTime(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  const mins = Math.max(2, Math.round(words / 200));
  return `${mins} min read`;
}

async function run() {
  const files = await fs.readdir(BLOG_DIR);
  const items = [];
  for (const f of files) {
    if (!f.endsWith('.html')) continue;
    const slug = basename(f, '.html');
    const html = await fs.readFile(join(BLOG_DIR, f), 'utf8');
    const title = extractTitle(html) || slug.replace(/-/g, ' ');
    const readTime = computeReadTime(html);
    items.push({ slug, title, readTime });
  }
  items.sort((a, b) => a.title.localeCompare(b.title));
  const out = JSON.stringify(items, null, 2);
  await fs.writeFile(join(BLOG_DIR, 'index.json'), out);
  console.log(`Wrote ${items.length} entries to public/blog-html/index.json`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


