import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const body = JSON.parse(event.body || '{}');
    const claimId = body?.claimId || body?.claim || 'general';
    const message = body?.message || body?.correction || '';
    const vote = body?.vote || null;
    // In production, persist to a queue or email. For now, accept and echo.
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'cache-control': 'no-store'
      },
      body: JSON.stringify({ status: 'success', message: `Feedback received for claim ID: ${claimId}`, vote, contact: 'sales@auspexi.com' })
    };
  } catch (e: any) {
    return { statusCode: 400, body: JSON.stringify({ status: 'error', error: e?.message || 'Invalid payload' }) };
  }
};


