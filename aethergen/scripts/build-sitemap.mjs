import fs from 'fs'
import path from 'path'

const SITE = process.env.SITE_URL || 'https://auspexi.com'
const publicDir = path.join(process.cwd(), 'public')
const blogHtmlDir = path.join(publicDir, 'blog-html')
const blogIndexPath = path.join(blogHtmlDir, 'index.json')
const sitemapPath = path.join(publicDir, 'sitemap.xml')

function posixify(p) { return p.split('\\').join('/') }

function loadBlogSlugs() {
  const slugs = new Set()
  // From manifest
  try {
    const raw = fs.readFileSync(blogIndexPath, 'utf-8')
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) arr.forEach(x => {
      const s = x?.slug && String(x.slug)
      if (!s) return
      const p = path.join(blogHtmlDir, `${s}.html`)
      if (fs.existsSync(p)) slugs.add(s)
    })
  } catch (_) {}
  // Fallback: scan directory
  try {
    const files = fs.readdirSync(blogHtmlDir)
    files.forEach(f => {
      if (!f.endsWith('.html')) return
      if (f.endsWith('.bak.html')) return
      if (f === 'index.html') return
      const slug = f.replace(/\.html$/, '')
      if (slug) slugs.add(slug)
    })
  } catch (_) {}
  return Array.from(slugs)
}

function mtimeFor(p) {
  try { return fs.statSync(p).mtime.toISOString().slice(0,10) } catch { return null }
}

function scanPublicHtml() {
  const out = []
  const skipDirs = new Set(['blog-html', 'blog'])
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
      const abs = path.join(dir, e.name)
      const rel = posixify(path.relative(publicDir, abs))
      if (e.isDirectory()) {
        const top = rel.split('/')[0]
        if (skipDirs.has(top)) continue
        walk(abs)
      } else if (e.isFile() && e.name.endsWith('.html')) {
        const top = rel.split('/')[0]
        if (skipDirs.has(top)) continue
        // map index.html to folder path
        let urlPath = '/' + rel
        if (urlPath.endsWith('/index.html')) urlPath = urlPath.replace(/\/index\.html$/, '/')
        else urlPath = urlPath.replace(/\.html$/, '')
        // collapse double slashes
        urlPath = urlPath.replace(/\/+/g, '/').replace(/\/$/, '')
        // skip root index (already in core)
        if (urlPath === '') continue
        out.push({ loc: SITE + urlPath, lastmod: mtimeFor(abs) })
      }
    }
  }
  try { walk(publicDir) } catch {}
  return out
}

function buildUrls() {
  const core = [
    '', 'about', 'technology', 'pricing', 'press', 'resources', 'ai', 'whitepaper', 'blog', 'build', 'context-engineering', 'choose-model'
  ]
  const slugs = loadBlogSlugs()
  const blog = slugs.map(s => `blog/${s}`)
  const all = [...core, ...blog]
  const base = all.map(p => {
    const isBlog = p.startsWith('blog/')
    const slug = p.replace('blog/','')
    const src = isBlog ? path.join(publicDir, 'blog-html', `${slug}.html`) : null
    const lastmod = src ? mtimeFor(src) : null
    const loc = isBlog ? `${SITE}/blog/${slug}` : `${SITE}/${p}`
    return { loc, lastmod }
  })
  // Add other public HTML (docs, etc.)
  const extras = scanPublicHtml()
  // Merge unique by loc
  const seen = new Set()
  const merged = []
  for (const u of [...base, ...extras]) {
    if (seen.has(u.loc)) continue
    seen.add(u.loc)
    merged.push(u)
  }
  return merged
}

function writeSitemap(urls) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
  urls.map(u => `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('') +
  `</urlset>\n`
  fs.writeFileSync(sitemapPath, xml, 'utf-8')
  console.log(`Wrote sitemap with ${urls.length} URLs to ${path.relative(process.cwd(), sitemapPath)}`)
}

const urls = buildUrls()
writeSitemap(urls)


