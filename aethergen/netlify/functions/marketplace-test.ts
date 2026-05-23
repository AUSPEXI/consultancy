import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const body = JSON.parse(event.body || '{}');

    // Prefer explicit body, but allow fallback to Netlify env vars when useEnv is true or fields missing
    const useEnv = body.useEnv === true || (!body.workspaceUrl && !body.patToken);
    const workspaceUrl: string | undefined = useEnv ? process.env.DATABRICKS_WORKSPACE_URL : body.workspaceUrl;
    const patToken: string | undefined = useEnv ? process.env.DATABRICKS_PAT : body.patToken;

    if (!workspaceUrl || !patToken) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing workspaceUrl or patToken (or Netlify env not set)', source: useEnv ? 'env' : 'body' }) };
    }

    const urlOk = /^https?:\/\/.+/.test(workspaceUrl);
    const tokenOk = typeof patToken === 'string' && patToken.length > 10;

    let apiOk = false;
    let status = 0;
    let endpoint = '/api/2.0/workspace/get-status?path=%2F';
    if (urlOk && tokenOk) {
      try {
        const ac = new AbortController();
        const to = setTimeout(() => ac.abort(), 7000);
        const res = await fetch(`${workspaceUrl.replace(/\/$/, '')}${endpoint}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${patToken}` },
          signal: ac.signal
        } as any);
        clearTimeout(to);
        status = res.status;
        apiOk = res.ok; // 2xx
      } catch (_) {
        apiOk = false;
      }
    }

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store'
      },
      body: JSON.stringify({ ok: urlOk && tokenOk && apiOk, urlOk, tokenOk, apiOk, status, source: useEnv ? 'env' : 'body' })
    };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message || 'Internal error' }) };
  }
};



