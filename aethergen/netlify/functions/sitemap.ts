import type { Handler } from '@netlify/functions'
import { getServiceClient } from './_lib/supabase'

const base = 'https://auspexi.com'

const handler: Handler = async () => {
	const fixed = [
		'', 'about', 'technology', 'pricing', 'press', 'resources', 'contact',
		'ai', 'whitepaper', 'resources/llm-indexing', 'resources/llm-benchmarks', 'resources/visibility-score'
	]
	const supabase = getServiceClient()
	const { data } = await supabase
		.from('blog_posts')
		.select('slug,published_at')
		.eq('status','published')
		.order('published_at', { ascending: false })
	const urls = fixed.map(p => `${base}/${p}`)
	const blogUrls = (data || []).map(p => `${base}/blog/${p.slug}`)
	const all = [...urls, ...blogUrls]
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
		all.map(u => `<url><loc>${u}</loc></url>`).join('') +
		`</urlset>`
	return { statusCode: 200, headers: { 'Content-Type': 'application/xml' }, body }
}

export { handler }


