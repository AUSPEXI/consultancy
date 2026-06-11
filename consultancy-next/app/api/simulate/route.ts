import { NextResponse } from 'next/server';
import { requireTier } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';
import { queryAllEngines, type EngineId } from '@/lib/engine-query';

// Real multi-engine Share-of-Voice probe.
//
// Instead of asking one model to fabricate what four engines "would" say
// (and randomly decide whether the brand is mentioned), this fires the user's
// real query at every live engine we hold an API key for, then deterministically
// detects whether each engine genuinely named the brand. SOV is the share of
// LIVE engines that mentioned it — engines without a configured key are skipped
// and excluded from the denominator, never faked.

const ENGINE_IDS: EngineId[] = ['chatgpt', 'claude', 'gemini', 'perplexity'];

export async function POST(request: Request) {
  const authResult = await requireTier(request, 'Pro');
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { query, brand } = await request.json();
    if (!query?.trim() || !brand?.trim()) {
      return NextResponse.json({ error: 'Missing query or brand' }, { status: 400 });
    }

    const engines = await queryAllEngines(query.trim(), brand.trim());

    const active = ENGINE_IDS.filter((id) => !engines[id].skipped);
    const mentions = active.filter((id) => engines[id].mentionedBrand);
    const sovScore = active.length > 0
      ? Math.round((mentions.length / active.length) * 100)
      : 0;

    if (active.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No AI engines are configured. Set at least one provider API key.' },
        { status: 503 },
      );
    }

    const result = {
      ...engines,
      sovScore,
      activeEngines: active.length,
      mentionCount: mentions.length,
      liveEngines: active,
    };

    // Cost: ~600 output tokens per active engine. Rough blended estimate.
    if (dbAdmin && userId) {
      const perEngine: Record<string, number> = {
        gemini: (600 / 1_000_000) * 0.40,
        chatgpt: (800 / 1_000_000) * 0.60,
        perplexity: 0.005,
        claude: (800 / 1_000_000) * 4.0,
      };
      const cost = active.reduce((sum, id) => sum + (perEngine[id] || 0), 0);
      dbAdmin.collection('cost_audit').add({
        userId,
        feature: 'simulator',
        provider: 'multi-engine',
        engines: active,
        estimatedCostUsd: cost,
        totalCostUsd: cost,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Simulation endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to run simulation' }, { status: 500 });
  }
}
