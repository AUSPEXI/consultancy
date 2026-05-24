import type { Handler } from '@netlify/functions'
import { getServiceClient } from './_lib/supabase'

const handler: Handler = async () => {
	const supabase = getServiceClient()
	const { data, error } = await supabase
		.from('social_accounts')
		.select('id')
		.eq('provider','linkedin')
		.limit(1)
	if (error) return { statusCode: 500, body: JSON.stringify({ configured:false, error: error.message }) }
	const configured = Boolean(data && data.length > 0)
	return {
		statusCode: 200,
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ configured })
	}
}

export { handler }


