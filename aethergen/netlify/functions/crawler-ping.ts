import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  try {
    const ua = event.headers['user-agent'] || '';
    const ip = (event.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';
    const now = new Date().toISOString();
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'cache-control': 'no-store'
      },
      body: JSON.stringify({ ok: true, ua, ip, now })
    };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message || 'Internal error' }) };
  }
};



