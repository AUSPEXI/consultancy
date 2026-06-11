import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { computeAttribution } from '@/lib/attribution';
import { requireAuth } from '@/lib/api-auth';
import { buildQueries, runCitationProbe, probeBrandRate } from '@/lib/cite-probe-core';
import { normalizeTier, checkTierAccess } from '@/constants/tiers';

// Free tier may run a limited number of live probes per calendar month — it's a
// taster, not the product. Paid tiers (Starter+) are unmetered here.
const FREE_MONTHLY_PROBE_LIMIT = 1;

/**
 * Enforces the Free-tier monthly probe meter. Returns a NextResponse (402) if
 * the user is out of free runs, or null if they may proceed. Increments the
 * counter as a side effect when allowed.
 */
async function enforceFreeProbeMeter(userId: string): Promise<NextResponse | null> {
  if (!dbAdmin || userId === 'anonymous') return null;
  const ref = dbAdmin.collection('users').doc(userId);
  const snap = await ref.get();
  const data = snap.data() ?? {};
  // Admins and paid tiers are never metered.
  if (data.role === 'admin' || checkTierAccess(data.tier, 'Starter')) return null;

  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const usage = data.citeProbeUsage ?? {};
  const usedThisMonth = usage.month === month ? (usage.count ?? 0) : 0;

  if (usedThisMonth >= FREE_MONTHLY_PROBE_LIMIT) {
    return NextResponse.json(
      {
        success: false,
        error: 'free_limit_reached',
        message: `Free plan includes ${FREE_MONTHLY_PROBE_LIMIT} live Citation Probe per month. Upgrade to Starter for unlimited probes.`,
        upgradeTo: 'Starter',
      },
      { status: 402 },
    );
  }

  await ref.update({ citeProbeUsage: { month, count: usedThisMonth + 1 } });
  return null;
}


// GET /api/cite-probe?userId=...  → persistent citation-rate history for charting.
// Reads accumulated citation_tests so the dashboard can show trend across sessions,
// not just the in-memory history that resets on reload.
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  try {
    const { searchParams } = new URL(request.url);
    if (!dbAdmin) {
      return NextResponse.json({ success: true, history: [] });
    }
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);
    const snap = await dbAdmin
      .collection('citation_tests')
      .where('userId', '==', userId)
      .get();

    const history = snap.docs
      .map(d => {
        const data = d.data();
        return {
          timestamp: data.timestamp as string,
          citationRate: (data.citationRate ?? 0) as number,
          citedCount: (data.citedCount ?? 0) as number,
          totalQueries: (data.totalQueries ?? 0) as number,
          misinformationCount: (data.misinformationCount ?? 0) as number,
          platformRates: data.platformRates ?? null,
        };
      })
      .filter(h => h.timestamp)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);

    return NextResponse.json({ success: true, history });
  } catch (err: any) {
    console.error('cite-probe history error:', err);
    return NextResponse.json({ success: false, error: err.message, history: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  try {
    const {
      brand, domain, queries, keywords = [],
      negativeStatements: clientFalses = [],
      competitorBrand = '', competitorDomain = '',
    } = await request.json();

    if (!brand || !domain) {
      return NextResponse.json({ error: 'brand and domain are required' }, { status: 400 });
    }

    // Free-tier monthly meter (paid tiers + admins pass through).
    const meterBlock = await enforceFreeProbeMeter(userId);
    if (meterBlock) return meterBlock;

    // Load known-false statements: prefer client-supplied, fall back to Firestore
    let knownFalses: string[] = clientFalses;
    if (dbAdmin && userId !== 'anonymous' && knownFalses.length === 0) {
      try {
        const userDoc = await dbAdmin.collection('users').doc(userId).get();
        knownFalses = userDoc.data()?.negativeStatements || [];
      } catch (_) {}
    }

    // Use caller-supplied queries, else build brand+keyword-specific ones, else generic fallback
    const testQueries: string[] = queries?.length > 0 ? queries : buildQueries(brand, domain, keywords);
    const timestamp = new Date().toISOString();

    const {
      queryResults, platformRates, citationRate,
      citedCount, misinformationCount, activePlatforms,
      sentimentBreakdown, avgPositionPct,
    } = await runCitationProbe({ brand, domain, queries: testQueries, knownFalses });

    // S7.1: optional competitor comparison — run the SAME queries for a competitor
    // and compute per-query winners so the user gets a concrete head-to-head benchmark.
    let competitor: any = null;
    const isCompetitorMode = Boolean(competitorBrand && competitorDomain);
    if (isCompetitorMode) {
      const compProbe = await probeBrandRate(testQueries, competitorBrand, competitorDomain);
      const compByQuery = new Map(compProbe.perQuery.map(r => [r.query, r.cited]));
      const comparison = queryResults.map(r => {
        const youCited = r.cited;
        const themCited = compByQuery.get(r.query) ?? false;
        const winner = youCited === themCited ? 'tie' : youCited ? 'you' : 'them';
        return { query: r.query, youCited, themCited, winner };
      });
      competitor = {
        brand: competitorBrand,
        domain: competitorDomain,
        citationRate: compProbe.rate,
        wins: comparison.filter(c => c.winner === 'you').length,
        losses: comparison.filter(c => c.winner === 'them').length,
        ties: comparison.filter(c => c.winner === 'tie').length,
        comparison,
      };
    }

    // Closed-loop attribution: correlate this run against the previous one and the
    // facts/articles added in between. Computed BEFORE persisting so the "previous
    // run" lookup doesn't see the run we're about to write. Non-fatal.
    let attribution = null;
    if (dbAdmin && userId !== 'anonymous') {
      try {
        attribution = await computeAttribution(
          dbAdmin,
          userId,
          queryResults.map(r => ({ query: r.query, cited: r.cited })),
          citationRate,
          timestamp,
        );
      } catch (attrErr) {
        console.warn('[cite-probe] attribution failed (non-fatal):', attrErr);
      }
    }

    const probeResult = {
      brand, domain, userId, timestamp,
      citationRate, citedCount, misinformationCount,
      totalQueries: testQueries.length,
      activePlatforms, platformRates,
      sentimentBreakdown, avgPositionPct,
      results: queryResults,
      attribution,
      mode: isCompetitorMode ? 'competitor' : 'standard',
      competitorDomain: isCompetitorMode ? competitorDomain : null,
      competitor,
    };

    if (dbAdmin && userId !== 'anonymous') {
      try {
        await dbAdmin.collection('citation_tests').add(probeResult);
        dbAdmin.collection('audit_logs').add({
          userId,
          action: 'Ran Citation Probe',
          details: { citationRate, citedCount, misinformationCount, totalQueries: testQueries.length, activePlatforms, platformRates },
          timestamp: new Date().toISOString(),
        }).catch(() => {});
        const cost =
          (platformRates.gemini !== null ? (testQueries.length * 500 / 1_000_000) * 0.40 : 0) +
          (platformRates.chatgpt !== null ? (testQueries.length * 800 / 1_000_000) * 0.60 : 0) +
          (platformRates.perplexity !== null ? testQueries.length * 0.005 : 0) +
          (platformRates.claude !== null ? (testQueries.length * 800 / 1_000_000) * 4.00 : 0) +
          (platformRates.grok != null ? (testQueries.length * 800 / 1_000_000) * 2.00 : 0) +
          (platformRates.deepseek != null ? (testQueries.length * 800 / 1_000_000) * 0.28 : 0) +
          (platformRates.google_aio != null ? testQueries.length * 0.013 : 0);
        dbAdmin.collection('cost_audit').add({
          userId, feature: 'cite-probe-multi', timestamp,
          platforms: Object.keys(platformRates).filter(p => platformRates[p] !== null),
          queriesRun: testQueries.length,
          estimatedCostUsd: cost,
          totalCostUsd: cost,
        }).catch(() => {});
      } catch (err) {
        console.error('Failed to persist citation test:', err);
      }
    }

    return NextResponse.json({ success: true, ...probeResult });
  } catch (err: any) {
    console.error('cite-probe error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
