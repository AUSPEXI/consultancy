import type { Handler } from '@netlify/functions'
import fetch from 'node-fetch'

// Expects LINKEDIN_CLIENT_ID/SECRET/ORG_URN and a long-lived LINKEDIN_ACCESS_TOKEN if available
// Fallback: return a preview payload instead of posting when token missing

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  try {
    const { url, title, summary, hashtags } = JSON.parse(event.body || '{}')
    if (!url || !title) return { statusCode: 400, body: 'Missing url or title' }

    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
    const orgUrn = process.env.LINKEDIN_ORG_URN

    const content = {
      author: orgUrn || 'urn:li:person:me',
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: `${title}\n\n${summary || ''}\n\n${hashtags ? hashtags.map((h:string)=>`#${h}`).join(' ') : ''}\n${url}`.trim() },
          shareMediaCategory: 'ARTICLE',
          media: [
            {
              status: 'READY',
              originalUrl: url,
              title: { text: title }
            }
          ]
        }
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    }

    if (!accessToken) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, preview: true, content }) }
    }

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(content)
    })
    const text = await res.text()
    if (!res.ok) return { statusCode: res.status, body: text }
    return { statusCode: 200, body: JSON.stringify({ ok: true, response: JSON.parse(text) }) }
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Unknown error' }) }
  }
}


