import type { Handler } from '@netlify/functions'

type PageSummary = {
  url: string
  title: string
  summary: string
  tags?: string[]
  contextOnly?: boolean
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function inferTitle(text: string, fallback: string): string {
  const m = text.match(/\b[A-Za-z][^\n]{10,80}/)
  return m ? m[0].slice(0, 90) : fallback
}

function tagger(text: string): string[] {
  const t = text.toLowerCase()
  const tags: string[] = []
  if (/(privacy|hipaa|gdpr|pii|phi)/.test(t)) tags.push('privacy')
  if (/(synthetic|generator|dataset)/.test(t)) tags.push('synthetic-data')
  if (/(model|ablation|benchmark)/.test(t)) tags.push('models')
  if (/(pricing|plans|tiers)/.test(t)) tags.push('pricing')
  if (/(databricks|unity catalog|delta)/.test(t)) tags.push('databricks')
  if (/(marketplace)/.test(t)) tags.push('marketplace')
  if (/(edge|offline|air-?gapped)/.test(t)) tags.push('edge')
  return Array.from(new Set(tags))
}

const handler: Handler = async () => {
  try {
    const base = 'https://auspexi.com'
    const fixedPaths = [
      '/', '/about', '/technology', '/pricing', '/press', '/resources', '/contact',
      '/ai', '/whitepaper', '/resources/llm-indexing', '/resources/llm-benchmarks', '/resources/visibility-score',
      '/terms', '/privacy', '/dpa', '/subprocessors'
    ]

    // Fetch public blog-library manifest for additional context
    const libResp = await fetch(`${base}/blog-library/manifest.json`).catch(() => null as any)
    let libSlugs: string[] = []
    if (libResp && libResp.ok) {
      try {
        const js = await libResp.json()
        const posts = Array.isArray(js) ? js : (js.posts || [])
        libSlugs = posts.map((p: any) => `/blog/${p.slug}`)
      } catch {}
    }

    const urls = Array.from(new Set([...fixedPaths, ...libSlugs]))

    const summaries: PageSummary[] = []
    for (const p of urls) {
      try {
        const resp = await fetch(`${base}${p}`)
        if (!resp.ok) continue
        const html = await resp.text()
        const txt = stripHtml(html)
        const summary = txt.slice(0, 900)
        const title = inferTitle(txt, `Auspexi – ${p}`)
        const tags = tagger(txt)
        const contextOnly = /\/terms$|\/privacy$|\/dpa$|\/subprocessors$/.test(p)
        summaries.push({ url: `${base}${p}`, title, summary, tags, contextOnly })
      } catch {}
    }

    return { statusCode: 200, body: JSON.stringify({ pages: summaries }) }
  } catch (e: any) {
    return { statusCode: 500, body: `site-context error: ${e?.message || 'unknown'}` }
  }
}

export { handler }


