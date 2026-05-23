import { createClient } from '@supabase/supabase-js';

export function getServiceSupabase() {
  const url = process.env.SUPABASE_URL as string;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function ensureBucket(supabase: ReturnType<typeof createClient>, bucket: string) {
  try {
    const { data: list } = await (supabase as any).storage.listBuckets();
    if (!list?.some((b: any) => b.name === bucket)) {
      await (supabase as any).storage.createBucket(bucket, { public: false });
    }
  } catch {
    // ignore
  }
}

export function ok(body: any, status = 200) {
  const reqId = randomId();
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Vary': 'Origin',
      'X-Request-Id': reqId,
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      'Permissions-Policy': 'interest-cohort=()'
    },
    body: JSON.stringify(body),
  } as const;
}

export function bad(message: string, status = 400) {
  return ok({ error: message }, status);
}

export function parseBody(event: any) {
  try { return event.body ? JSON.parse(event.body) : {}; } catch { return {}; }
}

export function checkCsrf(event: any) {
  const secret = process.env.CSRF_SECRET;
  if (!secret) return true;
  const token = event.headers?.['x-csrf'] || event.headers?.['X-CSRF'] || event.headers?.['x-csrf-token'];
  return token === secret;
}

type RateState = { count: number; windowStart: number };
type RateMap = Record<string, RateState>;

function getClientIp(event: any): string {
  const xf = event.headers?.['x-forwarded-for'] || event.headers?.['X-Forwarded-For'];
  if (typeof xf === 'string' && xf.length > 0) return xf.split(',')[0].trim();
  return event.headers?.['client-ip'] || event.headers?.['x-nf-client-connection-ip'] || 'unknown';
}

export function tooMany(retryAfterSec: number = 60) {
  const res = ok({ error: 'rate_limited', retry_after: retryAfterSec }, 429) as any;
  res.headers['Retry-After'] = String(retryAfterSec);
  return res;
}

export function rateLimit(event: any, key: string, limit: number = 60, windowSec: number = 60): { allowed: boolean; retryAfter?: number } {
  const ip = getClientIp(event);
  const now = Date.now();
  const bucketKey = `${key}:${ip}`;
  const g: any = globalThis as any;
  if (!g.__aegRate) g.__aegRate = {} as RateMap;
  const map: RateMap = g.__aegRate;
  const state = map[bucketKey] || { count: 0, windowStart: now } as RateState;
  if (now - state.windowStart > windowSec * 1000) {
    state.count = 0; state.windowStart = now;
  }
  state.count += 1;
  map[bucketKey] = state;
  if (state.count > limit) {
    const retryMs = windowSec * 1000 - (now - state.windowStart);
    return { allowed: false, retryAfter: Math.max(1, Math.ceil(retryMs / 1000)) };
  }
  return { allowed: true };
}

function randomId() {
  try { return crypto.randomUUID(); } catch { return Math.random().toString(36).slice(2); }
}


