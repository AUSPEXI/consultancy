import type { Handler } from '@netlify/functions'
import { getServiceClient } from './_lib/supabase'

const handler: Handler = async (event) => {
	try {
		if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
		const body = event.body ? JSON.parse(event.body) : {}
		const { text, url, scheduledAt } = body
		if (!text || !scheduledAt) return { statusCode: 400, body: 'text and scheduledAt required' }
		const supabase = getServiceClient()
		const { error } = await supabase.from('social_posts').insert({
			provider: 'linkedin',
			text,
			url: url || null,
			scheduled_at: new Date(scheduledAt).toISOString(),
			status: 'queued',
		})
		if (error) return { statusCode: 500, body: error.message }
		return { statusCode: 200, body: JSON.stringify({ ok: true }) }
	} catch (e: any) {
		return { statusCode: 500, body: e?.message || 'error' }
	}
}

export { handler }


