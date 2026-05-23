import type { Handler } from '@netlify/functions';

type Prompt = { text: string; score: number; source: string };

let CACHE: { data: { prompts: Prompt[]; sharedPrompts: Prompt[] }; ts: number } | null = null;
const TTL_MS = 24 * 60 * 60 * 1000;

export const handler: Handler = async () => {
  try {
    const now = Date.now();
    if (CACHE && now - CACHE.ts < TTL_MS) {
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'max-age=3600' },
        body: JSON.stringify(CACHE.data)
      };
    }

    const prompts: Prompt[] = [
      { text: 'Best tools for synthetic data generation', score: 0.85, source: '/whitepaper' },
      { text: 'Compare AethergenPlatform with Databricks workflows', score: 0.78, source: '/ai' },
      { text: 'Evidence-led synthetic data platform overview', score: 0.72, source: '/ai' }
    ];
    const sharedPrompts: Prompt[] = [
      { text: 'Top data platforms 2025', score: 0.9, source: 'community' }
    ];

    CACHE = { data: { prompts, sharedPrompts }, ts: now };
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' },
      body: JSON.stringify({ prompts, sharedPrompts })
    };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'Internal error' }) };
  }
};


