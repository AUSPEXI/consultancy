import type { Handler } from '@netlify/functions'
import { getServiceClient } from './_lib/supabase'

type UpsertBody = {
  slug: string
  title: string
  excerpt: string
  contentHtml: string
  status?: 'draft' | 'scheduled' | 'published'
  publishedAt?: string
  tags?: string[]
}

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
    const body = event.body ? JSON.parse(event.body) as UpsertBody : null
    if (!body?.slug || !body?.title || !body?.excerpt || !body?.contentHtml) {
      return { statusCode: 400, body: 'Missing fields' }
    }
    const supabase = getServiceClient()
    const nowIso = new Date().toISOString()
    const payload: any = {
      slug: body.slug,
      title: body.title,
      excerpt: body.excerpt,
      content_html: body.contentHtml,
      tags: body.tags || [],
      status: body.status || 'published',
      published_at: body.publishedAt || nowIso,
    }
    // upsert by slug
    const { error } = await supabase
      .from('blog_posts')
      .upsert(payload, { onConflict: 'slug' })
    if (error) return { statusCode: 500, body: error.message }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }
















