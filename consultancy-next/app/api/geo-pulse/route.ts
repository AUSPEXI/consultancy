import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { dbAdmin } from '@/lib/firebase-admin';

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const queries = buildProbeQueries(keyword.trim(), brand);

    // Query Gemini for each probe question in parallel
    const responses = await Promise.allSettled(
      queries.map(q =>
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: q }] }],
          config: { maxOutputTokens: 512 },
        }).then(r => ({ query: q, text: r.text || '', cited: checkCited(r.text || '', brand, domain) }))
      )
    );

    const results = responses.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { query: queries[i], text: '', cited: false }
    );

    const citedCount = results.filter(r => r.cited).length;
    // SoV = % of probe queries where brand was mentioned
    const sovGemini = Math.round((citedCount / queries.length) * 100);
    const aggregateSov = sovGemini; // expand to other engines in future

    // Store probe result for trend tracking
    if (dbAdmin && userId !== 'anonymous') {
      dbAdmin.collection('geo_pulse_history').add({
        userId, keyword: keyword.trim(), brand, domain,
        sovGemini, aggregateSov, citedCount, totalQueries: queries.length,
        timestamp: new Date().toISOString(),
        queries: results.map(r => ({ query: r.query, cited: r.cited })),
      }).catch(() => {});
    }

    const trend = aggregateSov >= 50 ? 'up' : aggregateSov >= 20 ? 'stable' : 'down';
    const sentiment = aggregateSov >= 50 ? 'positive' : aggregateSov >= 20 ? 'neutral' : 'negative';

    return NextResponse.json({
      success: true,
      result: {
        keyword: keyword.trim(),
        brand,
        models: [
          { name: 'Google AI', sov: sovGemini, sentiment, trend },
          // Other engines return null until we add their keys — shown as "not yet measured"
          { name: 'ChatGPT',    sov: null, sentiment: null, trend: null },
          { name: 'Perplexity', sov: null, sentiment: null, trend: null },
          { name: 'Claude',     sov: null, sentiment: null, trend: null },
        ],
        aggregateSov,
        overallSentiment: sentiment,
        totalSignals: queries.length,
        probedAt: new Date().toISOString(),
        insights: buildInsights(keyword.trim(), brand, sovGemini, aggregateSov),
      },
    });
  } catch (err: any) {
    console.error('geo-pulse error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
