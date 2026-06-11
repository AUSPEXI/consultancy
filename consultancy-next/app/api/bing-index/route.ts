import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';

// Bing indexation checker + IndexNow push.
//
// ChatGPT's web search runs on Bing. A brand that is invisible on Bing is
// invisible to ChatGPT-with-search regardless of how well-optimised its content
// is for AI citation. This route lets users:
//
//   GET  ?domain=example.com  — check whether the domain is indexed on Bing
//   POST { domain, urls[] }   — push one or more URLs to IndexNow (Bing + Yandex)
//
// IndexNow API key: generated once per domain and stored in the user doc.
// Spec: https://www.indexnow.org/documentation

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

// Use SerpAPI Bing engine to check if site:domain returns any results.
async function checkBingIndexation(domain: string): Promise<{
  indexed: boolean;
  estimatedPages: number | null;
  topResult: string | null;
  checkedAt: string;
}> {
  const apiKey = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY || '';
  const checkedAt = new Date().toISOString();

  if (!apiKey) {
    return { indexed: false, estimatedPages: null, topResult: null, checkedAt };
  }

  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const query = `site:${cleanDomain}`;
  const url = `https://serpapi.com/search.json?engine=bing&q=${encodeURIComponent(query)}&api_key=${apiKey}&count=10`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    throw new Error(`SerpAPI Bing returned ${res.status}`);
  }
  const data = await res.json();

  const organic: any[] = data.organic_results ?? [];
  const indexed = organic.length > 0;

  // Bing shows estimated result count in a different field than Google.
  const rawCount =
    data.search_information?.total_results ??
    data.search_information?.organic_results_state ??
    null;
  const estimatedPages = typeof rawCount === 'number' ? rawCount
    : typeof rawCount === 'string' ? parseInt(rawCount.replace(/\D/g, ''), 10) || null
    : null;

  const topResult = organic[0]?.link ?? null;

  return { indexed, estimatedPages, topResult, checkedAt };
}

// Push URLs to IndexNow. Returns the HTTP status from the IndexNow endpoint.
async function pushIndexNow(domain: string, urls: string[], apiKey: string): Promise<{ status: number; message: string }> {
  const host = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const keyLocation = `https://${host}/${apiKey}.txt`;

  const body = {
    host,
    key: apiKey,
    keyLocation,
    urlList: urls.slice(0, 100), // IndexNow cap
  };

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  const message =
    res.status === 200 ? 'URLs submitted successfully'
    : res.status === 202 ? 'Accepted — crawl queued'
    : res.status === 400 ? 'Invalid request (check URL format)'
    : res.status === 403 ? 'Key mismatch — verify key file is reachable at keyLocation'
    : res.status === 422 ? 'URLs must share the host in the key field'
    : `HTTP ${res.status}`;

  return { status: res.status, message };
}

// Generate a random IndexNow API key (32 hex chars).
function generateIndexNowKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const domain = req.nextUrl.searchParams.get('domain')?.trim() || '';
  if (!domain) {
    return NextResponse.json({ error: 'domain query param required' }, { status: 400 });
  }

  try {
    const result = await checkBingIndexation(domain);

    // Persist for history / training set.
    if (dbAdmin) {
      dbAdmin.collection('bing_index_checks').add({ userId, domain, ...result }).catch(() => {});
    }

    return NextResponse.json({ success: true, domain, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const body = await req.json();
  const domain: string = (body.domain ?? '').trim();
  const urls: string[] = Array.isArray(body.urls) ? body.urls.filter((u: any) => typeof u === 'string') : [];

  if (!domain) return NextResponse.json({ error: 'domain is required' }, { status: 400 });
  if (urls.length === 0) return NextResponse.json({ error: 'at least one URL is required' }, { status: 400 });

  try {
    // Load or create IndexNow key for this user/domain.
    let indexNowKey: string;
    if (dbAdmin) {
      const snap = await dbAdmin.collection('users').doc(userId).get();
      const stored = snap.data()?.indexNowKeys ?? {};
      const domainKey = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (stored[domainKey]) {
        indexNowKey = stored[domainKey];
      } else {
        indexNowKey = generateIndexNowKey();
        await dbAdmin.collection('users').doc(userId).update({
          [`indexNowKeys.${domainKey}`]: indexNowKey,
        });
      }
    } else {
      indexNowKey = generateIndexNowKey();
    }

    const result = await pushIndexNow(domain, urls, indexNowKey);

    // Verify the ownership key file is actually live — Bing silently ignores
    // pushes until it is, so surface a definitive ✓/✗ instead of a vague note.
    const host = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const keyLocation = `https://${host}/${indexNowKey}.txt`;
    let keyFileLive = false;
    try {
      const kr = await fetch(keyLocation, { signal: AbortSignal.timeout(8_000) });
      keyFileLive = kr.ok && (await kr.text()).trim() === indexNowKey;
    } catch { /* unreachable = not live */ }

    if (dbAdmin) {
      dbAdmin.collection('indexnow_pushes').add({
        userId, domain, urls, indexNowKey, ...result, timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    return NextResponse.json({
      success: result.status === 200 || result.status === 202,
      ...result,
      urlsSubmitted: urls.length,
      indexNowKey,
      keyLocation,
      keyFileLive,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
