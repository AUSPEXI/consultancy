import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId || !dbAdmin) {
      // Return empty state — no fake data
      return NextResponse.json({
        success: true,
        pulse: [],
        hasRealData: false,
        message: 'Run a Citation Probe to start tracking your AI citation trend.',
      });
    }

    // Fetch last 30 citation tests for this user
    const snap = await dbAdmin
      .collection('citation_tests')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(30)
      .get();

    if (snap.empty) {
      return NextResponse.json({
        success: true,
        pulse: [],
        hasRealData: false,
        message: 'Run a Citation Probe to start tracking your AI citation trend.',
      });
    }

    const pulse = snap.docs
      .map(d => {
        const data = d.data();
        // z-score: deviation from 50% baseline citation rate
        const rate = data.citationRate ?? 0;
        const zScore = parseFloat(((rate - 50) / 25).toFixed(2));
        return {
          date: data.timestamp,
          citationRate: rate,
          citedCount: data.citedCount ?? 0,
          totalQueries: data.totalQueries ?? 0,
          zScore,
          isAnomaly: Math.abs(zScore) > 2,
          mentions: data.citedCount ?? 0,
          citations: data.citedCount ?? 0,
          nodeShift: Math.abs(zScore * 10),
        };
      })
      .reverse(); // chronological order

    return NextResponse.json({ success: true, pulse, hasRealData: true });
  } catch (error: any) {
    console.error('Error in analytics/pulse:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
