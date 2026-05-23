import type { Handler } from '@netlify/functions'

const handler: Handler = async (event) => {
	const clientId = process.env.LINKEDIN_CLIENT_ID || ''
	const redirectUri = `${process.env.URL || ''}/.netlify/functions/linkedin-callback`
	const urlMode = (event.queryStringParameters?.mode || '').toLowerCase()
	let requestedScope = (process.env.LINKEDIN_SCOPE || 'w_member_social').toLowerCase()
	requestedScope = requestedScope.replace('w_organisation_social', 'w_organization_social')
	if (urlMode === 'member') requestedScope = 'w_member_social openid profile'
	if (urlMode === 'org') requestedScope = 'w_member_social w_organization_social openid profile'
	if (!requestedScope.includes('openid')) requestedScope += ' openid'
	if (!requestedScope.includes('profile')) requestedScope += ' profile'
	const scope = encodeURIComponent(requestedScope.trim().replace(/\s+/g,' '))
	const state = Math.random().toString(36).slice(2)
	const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`
	return { statusCode: 302, headers: { Location: authUrl }, body: '' }
}

export { handler }


