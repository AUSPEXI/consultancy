import { createClient } from '@supabase/supabase-js'

export function getServiceClient() {
	const url = process.env.SUPABASE_URL as string
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE as string
	if (!url || !serviceKey) throw new Error('Supabase env not configured')
	return createClient(url, serviceKey, { auth: { persistSession: false } })
}


