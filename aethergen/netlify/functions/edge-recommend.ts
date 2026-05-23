import type { Handler } from '@netlify/functions'

const handler: Handler = async (event) => {
	try {
		if (event.httpMethod !== 'GET') {
			return { statusCode: 405, body: 'Method Not Allowed' }
		}
		const vramGB = parseFloat(event.queryStringParameters?.vramGB || '0')
		const int8 = (event.queryStringParameters?.int8 || '').toLowerCase() === 'true'
		const fp16 = (event.queryStringParameters?.fp16 || '').toLowerCase() === 'true'

		const profilesRes = await fetch(`${process.env.URL || ''}/device-profiles.json`)
		if (!profilesRes.ok) throw new Error('profiles fetch failed')
		const profiles = await profilesRes.json()

		const eligible = profiles
			.filter((p: any) => vramGB >= p.minVramGB)
			.sort((a: any, b: any) => b.minVramGB - a.minVramGB)

		let choice = eligible[0] || profiles.sort((a: any, b: any) => a.minVramGB - b.minVramGB)[0]
		if (int8) {
			const int8Opt = eligible.find((p: any) => p.supportsInt8)
			if (int8Opt) choice = int8Opt
		}
		return {
			statusCode: 200,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				input: { vramGB, int8, fp16 },
				recommendation: choice,
			}),
		}
	} catch (e: any) {
		return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'error' }) }
	}
}

export { handler }


