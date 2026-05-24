import type { Handler } from '@netlify/functions'
import { getServiceClient } from './_lib/supabase'

async function exchangeCodeForToken(code: string, redirectUri: string) {
	const clientId = process.env.LINKEDIN_CLIENT_ID || ''
	const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || ''
	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: redirectUri,
		client_id: clientId,
		client_secret: clientSecret,
	})
	const resp = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	})
	if (!resp.ok) throw new Error(`Token exchange failed: ${resp.status}`)
	return resp.json() as Promise<{ access_token: string; expires_in: number; id_token?: string }>
}

const handler: Handler = async (event) => {
	try {
		const code = event.queryStringParameters?.code
		if (!code) {
			return {
				statusCode: 302,
				headers: { Location: `${process.env.URL || ''}/.netlify/functions/linkedin-start` },
				body: ''
			}
		}
		const redirectUri = `${process.env.URL || ''}/.netlify/functions/linkedin-callback`
		const token = await exchangeCodeForToken(code, redirectUri)

		// Store token for organization posting (no r_liteprofile required)
		const supabase = getServiceClient()
		const orgUrn = process.env.LINKEDIN_ORG_URN || null
		const requestedScope = (process.env.LINKEDIN_SCOPE || '').toLowerCase()
		let personUrn: string | null = null
		if (token.id_token) {
			try {
				const payloadB64 = token.id_token.split('.')[1]
				const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'))
				if (payload?.sub) personUrn = `urn:li:person:${payload.sub}`
			} catch {}
		}
		// Fallback: fetch OIDC userinfo if id_token missing or sub not parsed
		if (!personUrn) {
			try {
				const ui = await fetch('https://api.linkedin.com/v2/userinfo', {
					method: 'GET',
					headers: { 'Authorization': `Bearer ${token.access_token}` }
				})
				if (ui.ok) {
					const u = await ui.json() as any
					if (u?.sub) personUrn = `urn:li:person:${u.sub}`
				}
			} catch {}
		}
		// Only use organization URN if org scope is requested; otherwise default to member
		const orgScopeRequested = requestedScope.includes('w_organization_social')
		// If org scope present and org URN configured, prefer org for new connections
		const accountRef = (orgScopeRequested && orgUrn) ? orgUrn : (personUrn || orgUrn)
		const expiresAt = new Date(Date.now() + (token.expires_in || 0) * 1000).toISOString()
		const { error } = await supabase.from('social_accounts').insert({
			provider: 'linkedin',
			account_ref: accountRef,
			owner_email: null,
			access_token: token.access_token,
			refresh_token: null,
			expires_at: expiresAt,
		})
		if (error) throw new Error(`Failed to store token: ${error.message}`)

		return {
			statusCode: 200,
			headers: { 'content-type': 'text/html' },
			body: `<html><body><h1>LinkedIn connected</h1><p>${(accountRef||'').includes('organization:') ? 'Organization' : 'Member'} mode enabled.</p><p>You can close this window.</p></body></html>`
		}
	} catch (e: any) {
		return { statusCode: 500, body: e?.message || 'error' }
	}
}

export { handler }


