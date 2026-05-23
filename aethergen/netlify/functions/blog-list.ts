import type { Handler } from '@netlify/functions'
import { getServiceClient } from './_lib/supabase'
import fs from 'fs'
import path from 'path'

const handler: Handler = async () => {
	try {
		const supabase = getServiceClient()
		const { data, error } = await supabase
			.from('blog_posts')
			.select('slug,title,excerpt,published_at')
			.eq('status','published')
			.order('published_at', { ascending: false })
			.limit(50)
		if (!error && data && data.length > 0) {
			return { statusCode: 200, body: JSON.stringify(data) }
		}
		// Fallback to public manifest over HTTP so it works in Functions runtime
		try {
			const base = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://auspexi.com'
			const r = await fetch(`${base}/blog-library/manifest.json`)
			if (r.ok) {
				const js = await r.json()
				const posts = Array.isArray(js) ? js : (js.posts || [])
				const mapped = posts.map((p: any) => ({ slug: p.slug, title: p.title, excerpt: p.summary || '', published_at: null }))
				return { statusCode: 200, body: JSON.stringify(mapped) }
			}
			return { statusCode: 200, body: JSON.stringify([]) }
		} catch (_) {
			return { statusCode: 200, body: JSON.stringify([]) }
		}
	} catch (e: any) {
		return { statusCode: 500, body: `blog-list catch: ${e?.message || 'error'}` }
	}
}

export { handler }


