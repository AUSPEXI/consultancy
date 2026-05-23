import fs from 'fs'
import path from 'path'

const SITE = process.env.SITE_URL || 'https://auspexi.com'
const publicDir = path.join(process.cwd(), 'public')
const blogHtmlDir = path.join(publicDir, 'blog-html')
const blogOutDir = path.join(publicDir, 'blog')

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function readIndex() {
  const entries = []
  try {
    const raw = fs.readFileSync(path.join(blogHtmlDir, 'index.json'), 'utf-8')
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) arr.forEach(x => x?.slug && entries.push({ slug: String(x.slug), title: x.title || '' }))
  } catch (_) {}
  // Also scan directory for .html files
  try {
    const files = fs.readdirSync(blogHtmlDir)
    files.forEach(f => {
      if (!f.endsWith('.html')) return
      if (f.endsWith('.bak.html')) return
      if (f === 'index.html') return
      const slug = f.replace(/\.html$/, '')
      if (!entries.find(e => e.slug === slug)) entries.push({ slug, title: '' })
    })
  } catch (_) {}
  return entries
}

function extractContent(html) {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const title = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').trim() : (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || 'Article').trim()
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  const description = pMatch ? pMatch[1].replace(/<[^>]*>/g, '').trim().slice(0, 300) : ''
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  const style = styleMatch ? styleMatch[1] : ''
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const body = bodyMatch ? bodyMatch[1] : html
  return { title, description, style, body }
}

function buildDoc({ slug, title, description, style, body, mtimeIso }) {
  const canonical = `${SITE}/blog/${slug}`
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    author: { '@type': 'Person', name: 'Gwylym Pryce-Owen' },
    mainEntityOfPage: canonical,
    datePublished: mtimeIso,
    dateModified: mtimeIso,
    image: `${SITE}/og-image.svg`,
    publisher: { '@type': 'Organization', name: 'Auspexi' },
    license: 'PROPRIETARY',
    creator: { '@type': 'Organization', name: 'Auspexi' },
    description,
    articleBody: stripTags(body).slice(0, 15000)
  }
  const backBar = `\n<div style="position:sticky;top:0;z-index:50;background:#ffffff;border-bottom:1px solid #e5e7eb;">\n  <div style="max-width:960px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;gap:12px;">\n    <a href="/" style="color:#0f172a;text-decoration:none;font-weight:700">Auspexi</a>\n    <button onclick="(function(){try{history.back()}catch(e){} setTimeout(function(){ if(!document.referrer || !/\\/blog/.test(document.referrer)){ location.href='/blog' } },50);})()" style="margin-left:auto;background:#2563eb;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer">← Back to Blog</button>\n  </div>\n</div>`
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8"/>\n<meta name="viewport" content="width=device-width, initial-scale=1"/>\n<title>${escapeHtml(title)}</title>\n<link rel="canonical" href="${canonical}"/>\n<meta name="description" content="${escapeHtml(description)}"/>\n<script type="application/ld+json">${JSON.stringify(ld)}</script>\n<style>${style}</style>\n</head>\n<body>\n${backBar}\n${body}\n</body>\n</html>\n`
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function stripTags(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function run() {
  const index = readIndex()
  if (index.length === 0) {
    console.log('No blog index found, skipping prerender')
    return
  }
  ensureDir(blogOutDir)
  for (const entry of index) {
    const slug = entry.slug
    const src = path.join(blogHtmlDir, `${slug}.html`)
    if (!fs.existsSync(src)) continue
    const mtimeIso = fs.statSync(src).mtime.toISOString()
    const raw = fs.readFileSync(src, 'utf-8')
    const { title, description, style, body } = extractContent(raw)
    const outDir = path.join(blogOutDir, slug)
    ensureDir(outDir)
    const outFile = path.join(outDir, 'index.html')
    const doc = buildDoc({ slug, title, description, style, body, mtimeIso })
    fs.writeFileSync(outFile, doc, 'utf-8')
    console.log(`Prerendered /blog/${slug}`)
  }
}

run()


