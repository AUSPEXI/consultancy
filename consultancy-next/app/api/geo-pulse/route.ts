import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { dbAdmin } from '@/lib/firebase-admin';

// ── Gemini probe (existing logic, kept intact) ──────────────────────────────
async function probeQuery(query: string, apiKey: string, openaiKey: string): Promise<string> {
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const r = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: query }] }],
        config: { maxOutputTokens: 512 },
      });
      return r.text || '';
    } catch (e: any) {
      const fatal = e.message?.includes('403') || e.message?.includes('suspended') ||
        e.message?.includes('401') || e.message?.includes('ACCOUNT_STATE_INVALID');
      if (!fatal) throw e;
    }
  }
  if (openaiKey) {
    const client = new OpenAI({ apiKey: openaiKey });
    const r = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: query }],
      max_tokens: 512,
    });
    return r.choices[0]?.message?.content || '';
  }
  throw new Error('No LLM provider available');
}

// ── OpenAI (ChatGPT) probe ───────────────────────────────────────────────────
async function probeWithOpenAI(query: string, apiKey: string): Promise<string> {
  try {
    const client = new OpenAI({ apiKey });
    const r = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: query }],
      max_tokens: 512,
    });
    return r.choices[0]?.message?.content || '';
  } catch {
    return '';
  }
}

// ── Perplexity probe ─────────────────────────────────────────────────────────
async function probeWithPerplexity(query: string, apiKey: string): Promise<string> {
  try {
    const client = new OpenAI({ apiKey, baseURL: 'https://api.perplexity.ai' });
    const r = await client.chat.completions.create({
      model: 'sonar',
      messages: [{ role: 'user', content: query }],
      max_tokens: 512,
    });
    return r.choices[0]?.message?.content || '';
  } catch {
    return '';
  }
}

// ── Claude probe ─────────────────────────────────────────────────────────────
async function probeWithClaude(query: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: query }],
      }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return (data.content?.[0]?.text as string) || '';
  } catch {
    return '';
  }
}

// ── Shared helpers (kept intact) ─────────────────────────────────────────────

// 3 intent-diverse queries per keyword — enough to get a real citation signal
// without making this too expensive (3 Gemini calls per probe)
function buildProbeQueries(keyword: string, brand: string): string[] {
  return [
    `What are the best solutions or tools for ${keyword}?`,
    `Which companies or platforms specialise in ${keyword}?`,
    `How can a business improve their ${keyword}?`,
  ];
}

function checkCited(response: string, brand: string, domain: string): boolean {
  if (!brand && !domain) return false;
  const lower = response.toLowerCase();
  return Boolean(
    (brand && lower.includes(brand.toLowerCase())) ||
    (domain && lower.includes(domain.toLowerCase().replace(/^https?:\/\//, '')))
  );
}

function buildInsights(keyword: string, brand: string, sovGemini: number, aggregateSov: number): string[] {
  const insights: string[] = [];

  if (!brand) {
    insights.push(`No brand configured — set your brand name in Settings to see citation tracking.`);
    return insights;
  }

  if (aggregateSov === 0) {
    insights.push(`${brand} is not currently cited by Gemini for "${keyword}" queries. Publishing a GEO-optimised article on this topic is the fastest route to changing that.`);
  } else if (aggregateSov < 40) {
    insights.push(`${brand} appears in ${aggregateSov}% of AI responses for "${keyword}" — still below the 40% threshold for reliable citation. Increase entity density and add statistical anchors.`);
  } else if (aggregateSov < 70) {
    insights.push(`${brand} is cited in ${aggregateSov}% of Gemini responses for "${keyword}". Solid presence — defend with monthly freshness updates.`);
  } else {
    insights.push(`${brand} is the dominant cited source for "${keyword}" at ${aggregateSov}% SoV across probed queries. Maintain with fresh statistics every 30 days.`);
  }

  if (aggregateSov < 30) {
    insights.push(`This topic is still open — early authority content can capture the citation slot before a competitor does.`);
  }

  insights.push(`Real-time probe via Gemini. ${new Date().toLocaleDateString('en-GB', { dateStyle: 'medium' })}.`);

  return insights.slice(0, 4);
}

// ── Utility: compute SoV for a set of per-query citation booleans ─────────────
function computeSov(cited: boolean[]): number {
  if (cited.length === 0) return 0;
  return Math.round((cited.filter(Boolean).length / cited.length) * 100);
}

export async function POST(request: Request) {
  try {
    const { keyword, userId = 'anonymous', brand: brandParam = '', domain: domainParam = '' } = await request.json();
    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    // Resolve brand/domain from Firestore if not passed directly
    let brand = brandParam;
    let domain = domainParam;
    if ((!brand || !domain) && userId !== 'anonymous' && dbAdmin) {
      try {
        const userDoc = await dbAdmin.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const ud = userDoc.data()!;
          brand = brand || ud.brand || '';
          domain = domain || ud.domain || '';
        }
      } catch { /* non-blocking */ }
    }

    const geminiKey      = process.env.GEMINI_API_KEY      || '';
    const openaiKey      = process.env.OPENAI_API_KEY      || '';
    const perplexityKey  = process.env.PERPLEXITY_API_KEY  || '';
    const anthropicKey   = process.env.ANTHROPIC_API_KEY   || '';

    if (!geminiKey && !openaiKey && !perplexityKey && !anthropicKey) {
      return NextResponse.json({ error: 'No LLM API key configured' }, { status: 500 });
    }

    const queries = buildProbeQueries(keyword.trim(), brand);

    // ── Per-query: run all 4 platforms in parallel ────────────────────────────
    type PlatformResults = {
      gemini:     boolean[];
      openai:     boolean[];
      perplexity: boolean[];
      claude:     boolean[];
    };

    const platformResults: PlatformResults = {
      gemini:     [],
      openai:     [],
      perplexity: [],
      claude:     [],
    };

    for (const q of queries) {
      const [geminiRes, openaiRes, perplexityRes, claudeRes] = await Promise.allSettled([
        geminiKey     ? probeQuery(q, geminiKey, '')         : Promise.resolve(''),
        openaiKey     ? probeWithOpenAI(q, openaiKey)        : Promise.resolve(''),
        perplexityKey ? probeWithPerplexity(q, perplexityKey): Promise.resolve(''),
        anthropicKey  ? probeWithClaude(q, anthropicKey)     : Promise.resolve(''),
      ]);

      const text = (r: PromiseSettledResult<string>) =>
        r.status === 'fulfilled' ? r.value : '';

      platformResults.gemini.push(checkCited(text(geminiRes), brand, domain));
      platformResults.openai.push(checkCited(text(openaiRes), brand, domain));
      platformResults.perplexity.push(checkCited(text(perplexityRes), brand, domain));
      platformResults.claude.push(checkCited(text(claudeRes), brand, domain));
    }

    // ── Per-platform SoV (null when key not configured) ───────────────────────
    const sovGemini     = geminiKey     ? computeSov(platformResults.gemini)     : null;
    const sovOpenAI     = openaiKey     ? computeSov(platformResults.openai)     : null;
    const sovPerplexity = perplexityKey ? computeSov(platformResults.perplexity) : null;
    const sovClaude     = anthropicKey  ? computeSov(platformResults.claude)     : null;

    // ── Aggregate SoV: average of non-null platform SoVs ─────────────────────
    const nonNullSovs = [sovGemini, sovOpenAI, sovPerplexity, sovClaude].filter(
      (v): v is number => v !== null
    );
    const aggregateSov = nonNullSovs.length > 0
      ? Math.round(nonNullSovs.reduce((a, b) => a + b, 0) / nonNullSovs.length)
      : 0;

    // Store probe result for trend tracking
    if (dbAdmin && userId !== 'anonymous') {
      dbAdmin.collection('geo_pulse_history').add({
        userId, keyword: keyword.trim(), brand, domain,
        sovGemini, sovOpenAI, sovPerplexity, sovClaude,
        aggregateSov,
        citedCount: platformResults.gemini.filter(Boolean).length,
        totalQueries: queries.length,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    const sovToMeta = (sov: number | null) => ({
      trend:     sov === null ? null : sov >= 50 ? 'up'       : sov >= 20 ? 'stable'   : 'down',
      sentiment: sov === null ? null : sov >= 50 ? 'positive' : sov >= 20 ? 'neutral'  : 'negative',
    });

    const trend     = sovToMeta(aggregateSov).trend     ?? 'stable';
    const sentiment = sovToMeta(aggregateSov).sentiment ?? 'neutral';

    return NextResponse.json({
      success: true,
      result: {
        keyword: keyword.trim(),
        brand,
        models: [
          { name: 'Google AI',  sov: sovGemini,     ...sovToMeta(sovGemini)     },
          { name: 'ChatGPT',    sov: sovOpenAI,     ...sovToMeta(sovOpenAI)     },
          { name: 'Perplexity', sov: sovPerplexity, ...sovToMeta(sovPerplexity) },
          { name: 'Claude',     sov: sovClaude,     ...sovToMeta(sovClaude)     },
        ],
        aggregateSov,
        overallSentiment: sentiment,
        totalSignals: queries.length,
        probedAt: new Date().toISOString(),
        insights: buildInsights(keyword.trim(), brand, sovGemini ?? 0, aggregateSov),
      },
    });
  } catch (err: any) {
    console.error('geo-pulse error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
