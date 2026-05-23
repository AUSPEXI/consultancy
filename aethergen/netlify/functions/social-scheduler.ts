// Scheduled publisher stub: wire to Netlify Scheduled Functions (cron)
import type { Handler } from '@netlify/functions'
import { getServiceClient } from './_lib/supabase'

const handler: Handler = async () => {
	const supabase = getServiceClient()
	const nowIso = new Date().toISOString()
	const { data: due, error } = await supabase
		.from('social_posts')
		.select('*')
		.eq('provider', 'linkedin')
		.eq('status', 'queued')
		.lte('scheduled_at', nowIso)
		.limit(10)

	if (error) return { statusCode: 500, body: error.message }
	if (!due || due.length === 0) return { statusCode: 200, body: 'no due posts' }

	for (const row of due) {
		try {
			const res = await fetch(process.env.URL + '/.netlify/functions/linkedin-publish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: row.text, url: row.url || undefined })
			})
			const respText = await res.text()
			await supabase.from('social_posts').update({ status: res.ok ? 'posted' : 'failed', result_json: { status: res.status, body: respText } }).eq('id', row.id)
		} catch (e: any) {
			await supabase.from('social_posts').update({ status: 'failed', result_json: { error: e?.message || 'error' } }).eq('id', row.id)
		}
	}
	return { statusCode: 200, body: `processed ${due.length}` }
}

export { handler }


