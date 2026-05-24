import type { Handler } from '@netlify/functions'
import { getServiceClient } from './_lib/supabase'

function convertMarkdownToHtml(input: string): string {
	const s = input || ''
	if (/[<][a-zA-Z]/.test(s)) return s
	let out = s
		.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
		.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
		.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\n\n+/g, '</p><p>')
	out = `<p>${out}</p>`
	return out
}

type EnqueueBody = {
	slug: string
	title: string
	excerpt: string
	contentHtml: string
	scheduledAt: string
	tags?: string[]
}

const handler: Handler = async (event) => {
	try {
		if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
		const body = event.body ? JSON.parse(event.body) as EnqueueBody : null
		if (!body?.slug || !body?.title || !body?.excerpt || !body?.contentHtml || !body?.scheduledAt) {
			return { statusCode: 400, body: 'Missing fields' }
		}
		const supabase = getServiceClient()
		const { error } = await supabase.from('blog_posts').insert({
			slug: body.slug,
			title: body.title,
			excerpt: body.excerpt,
			content_html: convertMarkdownToHtml(body.contentHtml),
			tags: body.tags || [],
			status: 'scheduled',
			scheduled_at: new Date(body.scheduledAt).toISOString(),
		})
		if (error) return { statusCode: 500, body: error.message }
		return { statusCode: 200, body: JSON.stringify({ ok: true }) }
	} catch (e: any) {
		return { statusCode: 500, body: e?.message || 'error' }
	}
}

export { handler }


