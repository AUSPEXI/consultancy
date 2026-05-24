import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const BLOG_DIR = join(process.cwd(), 'public', 'blog-html');

async function run() {
  const slug = process.argv[2];
  if (!slug) throw new Error('Usage: node scripts/blog-delete.mjs <slug>');
  const file = join(BLOG_DIR, `${slug}.html`);
  await fs.unlink(file);
  console.log(`Deleted ${file}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


