import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

// Real-time per-query rate card (USD) — used for pricing calculator
export const PLATFORM_RATES = {
  gemini:     { label: 'Google Gemini',  model: 'gemini-2.5-flash',        perQuery: 0.000011, color: '#4285f4' },
  chatgpt:    { label: 'ChatGPT',        model: 'gpt-4o-mini',             perQuery: 0.000120, color: '#10a37f' },
  perplexity: { label: 'Perplexity',     model: 'sonar',                   perQuery: 0.005000, color: '#22d3ee' },
  claude:     { label: 'Claude',         model: 'claude-haiku-4-5',        perQuery: 0.000240, color: '#d97757' },
  openai_emb: { label: 'Embeddings',     model: 'text-embedding-3-small',  perQuery: 0.000002, color: '#a855f7' },
};

// Cost per full 7-query probe across all 4 platforms
export const PROBE_COST_PER_RUN =
  (PLATFORM_RATES.gemini.perQuery + PLATFORM_RATES.chatgpt.perQuery +
   PLATFORM_RATES.perplexity.perQuery + PLATFORM_RATES.claude.perQuery) * 7;

export async function POST(request: Request) {
  const { requireAuth } = await import('@/lib/api-auth');
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    if (!dbAdmin) return NextResponse.json({ error: 'Admin DB not available' }, { status: 500 });

    const snap = await dbAdmin
      .collection('cost_audit')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get();

    const entries = snap.docs.map(d => d.data());

    // Aggregate by feature
    const byFeature: Record<string, { calls: number; totalCost: number; inputTokens: number; outputTokens: number }> = {};
    let grandTotal = 0;

    for (const e of entries) {
      const f = e.feature || 'unknown';
      if (!byFeature[f]) byFeature[f] = { calls: 0, totalCost: 0, inputTokens: 0, outputTokens: 0 };
      byFeature[f].calls += 1;
      byFeature[f].totalCost += e.totalCostUsd || 0;
      byFeature[f].inputTokens += e.inputTokens || 0;
      byFeature[f].outputTokens += e.outputTokens || 0;
      grandTotal += e.totalCostUsd || 0;
    }

    const featureBreakdown = Object.entries(byFeature)
      .map(([feature, stats]) => ({
        feature,
        calls: stats.calls,
        totalCost: stats.totalCost,
        avgCostPerCall: stats.calls > 0 ? stats.totalCost / stats.calls : 0,
        inputTokens: stats.inputTokens,
        outputTokens: stats.outputTokens,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    // Aggregate by provider
    const byProvider: Record<string, { calls: number; totalCost: number }> = {};
    for (const e of entries) {
      const p = e.provider || 'unknown';
      if (!byProvider[p]) byProvider[p] = { calls: 0, totalCost: 0 };
      byProvider[p].calls += 1;
      byProvider[p].totalCost += e.totalCostUsd || 0;
    }

    // Daily spend (last 30 days)
    const dailyMap: Record<string, number> = {};
    for (const e of entries) {
      const day = (e.timestamp || '').substring(0, 10);
      if (day) dailyMap[day] = (dailyMap[day] || 0) + (e.totalCostUsd || 0);
    }
    const dailySpend = Object.entries(dailyMap)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    return NextResponse.json({
      success: true,
      totalCalls: entries.length,
      grandTotalCost: grandTotal,
      featureBreakdown,
      providerBreakdown: Object.entries(byProvider).map(([provider, s]) => ({ provider, ...s })),
      dailySpend,
      platformRates: PLATFORM_RATES,
      probeCostPerRun: PROBE_COST_PER_RUN,
      recentEntries: entries.slice(0, 20),
    });
  } catch (err: any) {
    console.error('cost-audit error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
