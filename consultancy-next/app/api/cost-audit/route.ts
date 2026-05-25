import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
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

    // Daily spend for chart (last 30 days)
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
      dailySpend,
      recentEntries: entries.slice(0, 20),
    });
  } catch (err: any) {
    console.error('cost-audit error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
