import type { Handler } from '@netlify/functions'
import { getServiceClient } from './_lib/supabase'

const handler: Handler = async () => {
	const supabase = getServiceClient()
	const nowIso = new Date().toISOString()
	const { data: due, error } = await supabase
		.from('blog_posts')
		.select('*')
		.eq('status', 'scheduled')
		.lte('scheduled_at', nowIso)
		.limit(10)

	if (error) return { statusCode: 500, body: error.message }
	if (!due || due.length === 0) return { statusCode: 200, body: 'no due posts' }

	for (const row of due) {
		await supabase.from('blog_posts').update({ status: 'published', published_at: nowIso }).eq('id', row.id)
	}
	return { statusCode: 200, body: `published ${due.length}` }
}

export { handler }


