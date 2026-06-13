/**
 * Backfill existing blog posts through the /api/webhooks/l8entspace inbound webhook.
 *
 * What it does:
 *   - Reads all posts from src/data/blogPosts.ts (via a JSON sidecar — see below)
 *   - POSTs each post to the webhook as type: 'article'
 *   - The webhook writes to `articles` and auto-generates social queue posts via Gemini
 *   - Rate-limited to 1 post every DELAY_MS (default 3 s) to stay within Gemini quotas
 *
 * Usage:
 *   node scripts/backfill-blog-posts.mjs [options]
 *
 * Options:
 *   --url        Base URL of the platform  (default: https://l8entspace.com)
 *   --secret     L8ENTSPACE_WEBHOOK_SECRET  (required, or set env L8ENTSPACE_WEBHOOK_SECRET)
 *   --userId     Firestore UID to write under (required, or set env BACKFILL_USER_ID)
 *   --delay      ms between posts            (default: 3000)
 *   --dry-run    Print what would be sent, don't POST
 *   --from       slug to start from (resume after a failure)
 *
 * Example:
 *   L8ENTSPACE_WEBHOOK_SECRET=xxx BACKFILL_USER_ID=abc123 \
 *     node scripts/backfill-blog-posts.mjs --url https://l8entspace.com
 */

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Parse args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
};
const has = (flag) => args.includes(flag);

const BASE_URL   = get('--url')    || 'https://l8entspace.com';
const SECRET     = get('--secret') || process.env.L8ENTSPACE_WEBHOOK_SECRET;
const USER_ID    = get('--userId') || process.env.BACKFILL_USER_ID;
const DELAY_MS   = parseInt(get('--delay') || '3000', 10);
const DRY_RUN    = has('--dry-run');
const FROM_SLUG  = get('--from');

if (!SECRET) {
  console.error('❌  --secret or env L8ENTSPACE_WEBHOOK_SECRET required');
  process.exit(1);
}
if (!USER_ID) {
  console.error('❌  --userId or env BACKFILL_USER_ID required');
  process.exit(1);
}

// ── Load blog posts ──────────────────────────────────────────────────────────
// blogPosts.ts is TypeScript so we can't require() it directly.
// We extract the data using a lightweight regex parse of the raw source,
// which is safe because the file is structured and author-controlled.
const SRC_PATH = join(__dirname, '..', 'src', 'data', 'blogPosts.ts');
const src = readFileSync(SRC_PATH, 'utf8');

// Pull each post's top-level string fields.  Content is everything in the
// template-literal between `content: \`` and the closing `\``.
function extractPosts(source) {
  const posts = [];
  // Split on object boundaries — each post starts with `{` after a comma/`[`
  // Strategy: find each `slug:` occurrence and extract surrounding fields.
  const slugRe = /slug:\s*"([^"]+)"/g;
  let m;
  while ((m = slugRe.exec(source)) !== null) {
    const start = source.lastIndexOf('{', m.index);
    // Find the matching closing `}` for this post object
    let depth = 0, end = start;
    for (let i = start; i < source.length; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    const chunk = source.slice(start, end + 1);

    const field = (key) => {
      const re = new RegExp(`${key}:\\s*"([^"]*)"`, 's');
      const fm = chunk.match(re);
      return fm ? fm[1] : '';
    };

    // Extract template-literal content (between backticks after `content:`)
    const contentMatch = chunk.match(/content:\s*`([\s\S]*?)`(?:\s*,|\s*\})/);
    const content = contentMatch ? contentMatch[1].trim() : '';

    posts.push({
      slug:     m[1],
      title:    field('title'),
      excerpt:  field('excerpt'),
      date:     field('date'),
      category: field('category'),
      url:      `https://l8entspace.com/blog/${m[1]}`,
      content:  content || field('excerpt'), // fall back to excerpt if content missing
    });
  }
  return posts;
}

const allPosts = extractPosts(src);

if (allPosts.length === 0) {
  console.error('❌  No posts found in blogPosts.ts — check parsing logic');
  process.exit(1);
}

// ── Optional resume from slug ────────────────────────────────────────────────
let posts = allPosts;
if (FROM_SLUG) {
  const idx = posts.findIndex(p => p.slug === FROM_SLUG);
  if (idx === -1) {
    console.error(`❌  --from slug "${FROM_SLUG}" not found`);
    process.exit(1);
  }
  posts = posts.slice(idx);
  console.log(`▶  Resuming from "${FROM_SLUG}" (${posts.length} remaining)\n`);
}

// ── Run ──────────────────────────────────────────────────────────────────────
const WEBHOOK_URL = `${BASE_URL}/api/webhooks/l8entspace`;

console.log(`📋  ${allPosts.length} posts in blogPosts.ts`);
console.log(`🚀  Sending ${posts.length} post(s) to ${WEBHOOK_URL}`);
console.log(`⏱   Delay: ${DELAY_MS}ms between posts`);
if (DRY_RUN) console.log('🔍  DRY RUN — no requests will be made\n');
console.log('');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let ok = 0, fail = 0;

for (let i = 0; i < posts.length; i++) {
  const post = posts[i];
  const label = `[${i + 1}/${posts.length}] ${post.slug}`;

  if (DRY_RUN) {
    console.log(`🔍  ${label}`);
    console.log(`    title:   ${post.title}`);
    console.log(`    url:     ${post.url}`);
    console.log(`    content: ${post.content.slice(0, 80).replace(/\n/g, ' ')}…`);
    console.log('');
    continue;
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-l8entspace-secret': SECRET,
      },
      body: JSON.stringify({
        userId: USER_ID,
        type: 'article',
        title: post.title,
        content: `${post.excerpt}\n\n${post.content}`,
        url: post.url,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (res.ok) {
      console.log(`✅  ${label}`);
      ok++;
    } else {
      console.error(`❌  ${label} → HTTP ${res.status}: ${JSON.stringify(body)}`);
      fail++;
    }
  } catch (err) {
    console.error(`❌  ${label} → ${err.message}`);
    fail++;
  }

  if (i < posts.length - 1) await sleep(DELAY_MS);
}

console.log('');
console.log(`Done. ✅ ${ok} succeeded  ❌ ${fail} failed`);
if (fail > 0) {
  console.log(`\nTo resume from the last failure, find the slug above and run:`);
  console.log(`  node scripts/backfill-blog-posts.mjs --from <slug> …`);
}
