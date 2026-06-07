import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/api-auth';

/**
 * Industry citation-rate benchmarks (S7.2).
 *
 * Aggregates anonymised citation rates across users who have OPTED IN
 * (users.benchmarkOptIn === true) and share an industry category. Returns the
 * average latest citation rate for that industry so a user can see whether they
 * are above or below their peers.
 *
 * Privacy: no brand names, no userIds, no per-user rates are ever returned. A
 * benchmark is only emitted when at least MIN_SAMPLE distinct opted-in users
 * contribute, so no single user's rate can be reverse-engineered.
 */

const MIN_SAMPLE = 3;

export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    if (!dbAdmin) return NextResponse.json({ success: true, benchmark: null });

    const { searchParams } = new URL(request.url);
    const industry = (searchParams.get('industry') || '').trim().toLowerCase();
    if (!industry) return NextResponse.json({ success: true, benchmark: null });

    // Opted-in users in this industry.
    const usersSnap = await dbAdmin
      .collection('users')
      .where('benchmarkOptIn', '==', true)
      .get();

    const peerIds = usersSnap.docs
      .filter(d => (d.data().industry || '').trim().toLowerCase() === industry)
      .map(d => d.id);

    if (peerIds.length < MIN_SAMPLE) {
      return NextResponse.json({
        success: true,
        benchmark: null,
        reason: `Not enough opted-in peers in "${industry}" yet (need ${MIN_SAMPLE}). Benchmarks unlock as more brands in your industry opt in.`,
      });
    }

    // Latest citation rate per peer. Firestore 'in' supports up to 30 ids per query.
    const rates: number[] = [];
    for (let i = 0; i < peerIds.length; i += 30) {
      const chunk = peerIds.slice(i, i + 30);
      const snap = await dbAdmin
        .collection('citation_tests')
        .where('userId', 'in', chunk)
        .get();

      // Pick each peer's most recent run.
      const latestByUser = new Map<string, { ts: number; rate: number }>();
      snap.docs.forEach(d => {
        const data = d.data();
        const ts = new Date(data.timestamp || 0).getTime();
        const prev = latestByUser.get(data.userId);
        if (!prev || ts > prev.ts) latestByUser.set(data.userId, { ts, rate: data.citationRate ?? 0 });
      });
      latestByUser.forEach(v => rates.push(v.rate));
    }

    if (rates.length < MIN_SAMPLE) {
      return NextResponse.json({
        success: true,
        benchmark: null,
        reason: 'Not enough peers have run a probe yet.',
      });
    }

    const average = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
    const sorted = [...rates].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return NextResponse.json({
      success: true,
      benchmark: {
        industry,
        averageRate: average,
        medianRate: median,
        sampleSize: rates.length,
      },
    });
  } catch (err: any) {
    console.error('benchmarks error:', err);
    return NextResponse.json({ success: false, error: err.message, benchmark: null }, { status: 500 });
  }
}
