import type { Handler } from '@netlify/functions'
import { getServiceClient } from './_lib/supabase'

function convertMarkdownToHtml(input: string): string {
  const s = input || ''
  if (/[<][a-zA-Z]/.test(s)) return s
  const lines = s.replace(/\r\n/g, '\n').split(/\n/)
  const out: string[] = []
  let inList = false
  const para: string[] = []
  const flushPara = () => {
    if (!para.length) return
    let p = para.join(' ').trim()
    if (!p) { para.length = 0; return }
    p = p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    out.push(`<p>${p}</p>`)
    para.length = 0
  }
  for (const line of lines) {
    if (/^\s*$/.test(line)) { flushPara(); if (inList) { out.push('</ul>'); inList = false } continue }
    const h3 = line.match(/^###\s+(.*)$/); if (h3) { flushPara(); if (inList){out.push('</ul>'); inList=false} out.push(`<h3>${h3[1]}</h3>`); continue }
    const h2 = line.match(/^##\s+(.*)$/); if (h2) { flushPara(); if (inList){out.push('</ul>'); inList=false} out.push(`<h2>${h2[1]}</h2>`); continue }
    const h1 = line.match(/^#\s+(.*)$/); if (h1) { flushPara(); if (inList){out.push('</ul>'); inList=false} out.push(`<h1>${h1[1]}</h1>`); continue }
    const li = line.match(/^\s*-\s+(.*)$/)
    if (li) {
      flushPara()
      if (!inList) { out.push('<ul>'); inList = true }
      const text = li[1]
      const item = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      out.push(`<li>${item}</li>`)
      continue
    }
    para.push(line)
  }
  flushPara(); if (inList) out.push('</ul>')
  return out.join('\n')
}

async function loadLibrary(): Promise<any[]> {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL || ''
  const urls = [
    base ? `${base}/blog-library/manifest.json` : '',
    `${base || ''}/public/blog-library/manifest.json`
  ].filter(Boolean)
  for (const u of urls) {
    try {
      const r = await fetch(u)
      if (r.ok) {
        const js = await r.json()
        const posts = Array.isArray(js) ? js : (js.posts || [])
        return posts
      }
    } catch {}
  }
  return []
}

async function loadPost(slug: string): Promise<any | null> {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL || ''
  const r = await fetch(`${base}/blog-library/${slug}.json`).catch(()=>null as any)
  if (r && r.ok) return r.json()
  return null
}

const handler: Handler = async (event) => {
  try {
    const supabase = getServiceClient()
    const action = event.queryStringParameters?.action || 'publishNow'
    const isPost = event.httpMethod === 'POST'
    const body = isPost && event.body ? JSON.parse(event.body) as { slugs?: string[], plan?: { startDate?: string } } : {}

    if (action === 'publishNow') {
      const qp = (event.queryStringParameters?.slugs || '').split(',').map(s=>s.trim()).filter(Boolean)
      const slugs = body.slugs && body.slugs.length ? body.slugs : (qp.length ? qp : ['edge-packaging-checksums','innovation-test-harness','databricks-publishing-playbook','finance-fraud-signals','automotive-quality-edge'])
      if (!slugs.length) return { statusCode: 400, body: 'slugs required' }
      let updated = 0
      for (const slug of slugs) {
        const js = await loadPost(slug)
        if (!js) continue
        const content_html = convertMarkdownToHtml(js.contentHtml || js.bodyMd || js.body || '')
        const now = new Date().toISOString()
        // upsert: update if exists, else insert
        const existing = await supabase.from('blog_posts').select('id').eq('slug', js.slug).limit(1).single().catch(()=>({ data:null, error:null })) as any
        if (existing && existing.data && existing.data.id) {
          const { error: eUp } = await supabase.from('blog_posts').update({
            title: js.title,
            excerpt: js.summary || js.excerpt || '',
            content_html,
            tags: js.tags || [],
            status: 'published',
            published_at: now,
          }).eq('id', existing.data.id)
          if (!eUp) updated++
        } else {
          const { error: eIns } = await supabase.from('blog_posts').insert({
            slug: js.slug,
            title: js.title,
            excerpt: js.summary || js.excerpt || '',
            content_html,
            tags: js.tags || [],
            status: 'published',
            published_at: now,
          })
          if (!eIns) updated++
        }
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true, count: updated }) }
    }

    if (action === 'planTwoWeeks') {
      const manifest = await loadLibrary()
      if (!manifest.length) return { statusCode: 400, body: 'library empty' }
      const startParam = event.queryStringParameters?.start
      const start = body.plan?.startDate ? new Date(body.plan.startDate) : (startParam ? new Date(startParam) : new Date())
      const targets = manifest.slice(0, 15)
      for (let i = 0; i < targets.length; i++) {
        const slug = targets[i].slug
        const js = await loadPost(slug)
        if (!js) continue
        const content_html = convertMarkdownToHtml(js.contentHtml || js.bodyMd || js.body || '')
        const d = new Date(start)
        d.setDate(start.getDate() + i + 1)
        d.setHours(i % 2 === 0 ? 9 : 14, 0, 0, 0)
        await supabase.from('blog_posts').insert({
          slug: js.slug,
          title: js.title,
          excerpt: js.summary || js.excerpt || '',
          content_html,
          tags: js.tags || [],
          status: 'scheduled',
          scheduled_at: d.toISOString(),
        })
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true, scheduled: 15 }) }
    }

    if (action === 'planRemainder') {
      const manifest = await loadLibrary()
      if (!manifest.length) return { statusCode: 400, body: 'library empty' }
      const startParam = event.queryStringParameters?.start
      if (!startParam) return { statusCode: 400, body: 'start required' }
      const start = new Date(startParam)
      const remainder = manifest.slice(15, 23)
      const scheduleOffsets = [16, 16, 17, 18, 18, 19, 20, 21]
      const scheduleHours =      [ 9, 14,  9,  9, 14,  9,  9,  9]
      let scheduled = 0
      for (let i = 0; i < remainder.length && i < scheduleOffsets.length; i++) {
        const slug = remainder[i].slug
        const js = await loadPost(slug)
        if (!js) continue
        const content_html = convertMarkdownToHtml(js.contentHtml || js.bodyMd || js.body || '')
        const d = new Date(start)
        d.setDate(start.getDate() + scheduleOffsets[i])
        d.setHours(scheduleHours[i], 0, 0, 0)
        const { error } = await supabase.from('blog_posts').insert({
          slug: js.slug,
          title: js.title,
          excerpt: js.summary || js.excerpt || '',
          content_html,
          tags: js.tags || [],
          status: 'scheduled',
          scheduled_at: d.toISOString(),
        })
        if (!error) scheduled++
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true, scheduled }) }
    }

    return { statusCode: 400, body: 'unknown action' }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }


