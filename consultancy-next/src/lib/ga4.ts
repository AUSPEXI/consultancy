// GA4 (Google Analytics 4) integration — multi-tenant OAuth.
// Direct REST calls (no googleapis dependency). Read-only analytics scope.
//
// Refresh tokens are stored server-side only in `ga4_integrations/{userId}` via
// dbAdmin. Firestore rules must deny all client access to that collection.

const OAUTH_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';
const DATA_API = 'https://analyticsdata.googleapis.com/v1beta';

export function ga4Configured(): boolean {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

function redirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/api/integrations/ga4/callback`;
}

// AI engines whose referral traffic we attribute. GA4 reports the referring host
// in `sessionSource`; we match on these substrings.
export const AI_REFERRAL_SOURCES: { key: string; label: string; match: string[] }[] = [
  { key: 'chatgpt',    label: 'ChatGPT',    match: ['chatgpt.com', 'chat.openai.com', 'openai.com'] },
  { key: 'perplexity', label: 'Perplexity', match: ['perplexity.ai'] },
  { key: 'gemini',     label: 'Gemini',     match: ['gemini.google.com', 'bard.google.com'] },
  { key: 'claude',     label: 'Claude',     match: ['claude.ai'] },
  { key: 'copilot',    label: 'Copilot',    match: ['copilot.microsoft.com', 'bing.com/chat'] },
  { key: 'grok',       label: 'Grok',       match: ['grok.com', 'x.ai'] },
];

export function classifyAiSource(source: string): { key: string; label: string } | null {
  const s = (source || '').toLowerCase();
  for (const e of AI_REFERRAL_SOURCES) {
    if (e.match.some(m => s.includes(m))) return { key: e.key, label: e.label };
  }
  return null;
}

// ── OAuth ─────────────────────────────────────────────────────────────────────
export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: OAUTH_SCOPE,
    access_type: 'offline',      // request a refresh token
    prompt: 'consent',           // force refresh-token issuance on re-connect
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

// ── GA4 APIs ──────────────────────────────────────────────────────────────────
export interface Ga4Property { propertyId: string; displayName: string; account: string }

export async function listProperties(accessToken: string): Promise<Ga4Property[]> {
  const res = await fetch(`${ADMIN_API}/accountSummaries?pageSize=200`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`List properties failed: ${await res.text()}`);
  const data = await res.json();
  const props: Ga4Property[] = [];
  for (const acc of data.accountSummaries || []) {
    for (const p of acc.propertySummaries || []) {
      props.push({
        propertyId: (p.property || '').replace('properties/', ''),
        displayName: p.displayName || p.property,
        account: acc.displayName || '',
      });
    }
  }
  return props;
}

export interface AttributionRow { source: string; date: string; sessions: number; keyEvents: number }
export interface AttributionReport {
  totalSessions: number;
  totalKeyEvents: number;
  byEngine: { key: string; label: string; sessions: number; keyEvents: number }[];
  byDate: { date: string; sessions: number }[];
  rangeDays: number;
}

// Pull AI-referral sessions for a property over the last `rangeDays`.
export async function runAttributionReport(accessToken: string, propertyId: string, rangeDays = 30): Promise<AttributionReport> {
  const res = await fetch(`${DATA_API}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: `${rangeDays}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'sessionSource' }, { name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'keyEvents' }],
      limit: 10000,
    }),
  });
  if (!res.ok) throw new Error(`runReport failed: ${await res.text()}`);
  const data = await res.json();

  const byEngineMap = new Map<string, { key: string; label: string; sessions: number; keyEvents: number }>();
  const byDateMap = new Map<string, number>();
  let totalSessions = 0, totalKeyEvents = 0;

  for (const row of data.rows || []) {
    const source = row.dimensionValues?.[0]?.value || '';
    const date = row.dimensionValues?.[1]?.value || '';
    const sessions = Number(row.metricValues?.[0]?.value || 0);
    const keyEvents = Number(row.metricValues?.[1]?.value || 0);

    const ai = classifyAiSource(source);
    if (!ai) continue; // only AI-referral traffic

    totalSessions += sessions;
    totalKeyEvents += keyEvents;

    const e = byEngineMap.get(ai.key) || { key: ai.key, label: ai.label, sessions: 0, keyEvents: 0 };
    e.sessions += sessions; e.keyEvents += keyEvents;
    byEngineMap.set(ai.key, e);

    byDateMap.set(date, (byDateMap.get(date) || 0) + sessions);
  }

  const byDate = [...byDateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sessions]) => ({
      // GA4 returns YYYYMMDD — normalise to YYYY-MM-DD
      date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
      sessions,
    }));

  return {
    totalSessions, totalKeyEvents,
    byEngine: [...byEngineMap.values()].sort((a, b) => b.sessions - a.sessions),
    byDate, rangeDays,
  };
}
