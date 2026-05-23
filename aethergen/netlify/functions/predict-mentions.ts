import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  try {
    const predictions = [
      { prompt: 'Best synthetic data tools', likelihood: 0.8, action: 'Optimize content' },
      { prompt: 'Compare synthetic data platforms', likelihood: 0.6, action: 'Publish comparative blog' }
    ];
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' },
      body: JSON.stringify({ predictions })
    };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'Internal error' }) };
  }
};



