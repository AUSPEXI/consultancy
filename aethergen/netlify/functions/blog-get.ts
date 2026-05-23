import type { Handler } from '@netlify/functions'
import { getServiceClient } from './_lib/supabase'

const handler: Handler = async (event) => {
	const slug = event.queryStringParameters?.slug
	if (!slug) return { statusCode: 400, body: 'slug required' }
	const supabase = getServiceClient()
	const { data, error } = await supabase
		.from('blog_posts')
		.select('*')
		.eq('slug', slug)
		.eq('status','published')
		.limit(1)
		.single()
	if (error) return { statusCode: 404, body: 'not found' }
	return { statusCode: 200, body: JSON.stringify(data) }
}

export { handler }


