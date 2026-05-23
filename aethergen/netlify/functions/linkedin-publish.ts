import type { Handler } from '@netlify/functions'
import { getServiceClient } from './_lib/supabase'
import { rateLimit, tooMany } from './_shared/supabase'

type PublishBody = { text: string; url?: string; postAs?: 'org'|'member' }

const handler: Handler = async (event) => {
	try {
		const rl = rateLimit(event, 'linkedin-publish', 10, 60); // 10/min per IP
		if (!rl.allowed) return tooMany(rl.retryAfter)
		if (event.httpMethod === 'GET') {
			return {
				statusCode: 200,
				headers: { 'content-type': 'text/html' },
				body: `<html><body><h1>LinkedIn Publish</h1><p>POST JSON { text, url? } to this endpoint to publish to LinkedIn (requires prior connection via /.netlify/functions/linkedin-start).</p></body></html>`
			}
		}
		if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
		const supabase = getServiceClient()
		const { data: acct, error } = await supabase
			.from('social_accounts')
			.select('access_token, account_ref')
			.eq('provider','linkedin')
			.order('updated_at', { ascending: false })
			.limit(1)
			.single()
		if (error || !acct) return { statusCode: 400, body: 'Not connected' }
		const body = event.body ? JSON.parse(event.body) as PublishBody : { text: '' }
		const text = (body.text || '').slice(0, 2900)
		const requestedScope = (process.env.LINKEDIN_SCOPE || '').toLowerCase()
		const envOrgUrn = process.env.LINKEDIN_ORG_URN || ''
		let authorUrn = ''
		// Prefer org posting when requested and allowed
		if (body.postAs === 'org' && envOrgUrn && requestedScope.includes('w_organization_social')) {
			authorUrn = envOrgUrn
		} else {
			authorUrn = acct.account_ref || ''
		}
		if (!authorUrn || !/^urn:li:(person|organization):[A-Za-z0-9\-]+$/.test(authorUrn)) {
			// Final fallback: try OIDC userinfo to recover person URN
			try {
				const ui = await fetch('https://api.linkedin.com/v2/userinfo', { method: 'GET', headers: { 'Authorization': `Bearer ${acct.access_token}` } })
				if (ui.ok) {
					const u = await ui.json() as any
					if (u?.sub) authorUrn = `urn:li:person:${u.sub}`
				}
			} catch {}
			if (!authorUrn || !/^urn:li:(person|organization):[A-Za-z0-9\-]+$/.test(authorUrn)) {
				return { statusCode: 400, body: 'Not connected: invalid author. Reconnect via /.netlify/functions/linkedin-start' }
			}
		}
		const isOrg = authorUrn.includes('organization:')
		const orgScopeRequested = requestedScope.includes('w_organization_social')
		if (isOrg && !orgScopeRequested) {
			return { statusCode: 400, body: 'App not authorized for organization posting. Include w_organization_social in LINKEDIN_SCOPE and reconnect.' }
		}
		const post = {
			author: authorUrn,
			lifecycleState: 'PUBLISHED',
			specificContent: {
				'com.linkedin.ugc.ShareContent': {
					shareCommentary: { text },
					shareMediaCategory: body.url ? 'ARTICLE' : 'NONE',
					media: body.url ? [ { status: 'READY', originalUrl: body.url } ] : undefined
				}
			},
			visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
		}
		const doPost = async (payload: any) => fetch('https://api.linkedin.com/v2/ugcPosts', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${acct.access_token}`,
				'Content-Type': 'application/json',
				'X-Restli-Protocol-Version': '2.0.0'
			},
			body: JSON.stringify(payload)
		})
		let resp = await doPost(post)
		if (!resp.ok) {
			try {
				const bodyText = await resp.text()
				// Retry once on duplicate by tweaking URL (utm) to avoid DUPLICATE_POST
				if (resp.status === 422 && /DUPLICATE_POST/i.test(bodyText)) {
					const u = new URL(url)
					u.searchParams.set('utm_content', `r${Date.now().toString().slice(-6)}`)
					const retry = JSON.parse(JSON.stringify(post))
					if (retry?.specificContent?.['com.linkedin.ugc.ShareContent']?.media?.[0]) {
						retry.specificContent['com.linkedin.ugc.ShareContent'].media[0].originalUrl = u.toString()
					}
					resp = await doPost(retry)
					if (!resp.ok) return { statusCode: resp.status, body: await resp.text() }
					return { statusCode: 200, body: await resp.text() }
				}
				return { statusCode: resp.status, body: bodyText }
			} catch {
				return { statusCode: resp.status, body: 'publish failed' }
			}
		}
		return { statusCode: 200, body: await resp.text() }
	} catch (e: any) {
		return { statusCode: 500, body: e?.message || 'error' }
	}
}

export { handler }


