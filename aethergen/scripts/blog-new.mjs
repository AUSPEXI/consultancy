import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const BLOG_DIR = join(process.cwd(), 'public', 'blog-html');

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function run() {
  const rawSlug = process.argv[2] || '';
  const rawTitle = process.argv[3] || 'New Blog Post';
  const slug = slugify(rawSlug || rawTitle);
  if (!slug) throw new Error('Provide slug or title');
  const title = rawTitle;
  const path = join(BLOG_DIR, `${slug}.html`);
  const exists = await fs
    .access(path)
    .then(() => true)
    .catch(() => false);
  if (exists) throw new Error(`File exists: ${path}`);
  const stub = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>${title}</title>\n</head>\n<body>\n  <h1>${title}</h1>\n  <p>Intro paragraph. Replace, then commit.</p>\n</body>\n</html>\n`;
  await fs.writeFile(path, stub, 'utf8');
  console.log(`Created ${path}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


