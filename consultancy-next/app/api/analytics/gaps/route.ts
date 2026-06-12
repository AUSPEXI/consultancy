import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { embeddingService } from '@/lib/embeddings';
import { requireAuth } from '@/lib/api-auth';
import { computeQueryGeometry, loadEmbeddedFacts, GEOMETRY_SIM_THRESHOLD } from '@/lib/fact-geometry';

// Content gap recommendation engine.
//
// GET /api/analytics/gaps
//
// Takes the last cite-probe run, finds every UNCITED query that has no vault
// fact within cosine similarity GEOMETRY_SIM_THRESHOLD, and returns them ranked
// by distance to the nearest fact (furthest first = biggest content hole).
// Each recommendation is testable: write the content, re-probe, and the query
// either flips to cited or it doesn't — which is exactly the labelled training
// signal the ML model needs.

const GAP_DISTANCE = 1 - GEOMETRY_SIM_THRESHOLD; // minFactDistance above this = gap

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  if (!dbAdmin) {
    return NextResponse.json({ success: false, error: 'DB not available' }, { status: 503 });
  }

  try {
    const probeSnap = await dbAdmin
      .collection('citation_tests')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(2)
      .get();

    if (probeSnap.empty) {
      return NextResponse.json({ success: true, gaps: [], covered: [], closedGaps: [], reason: 'no_probe_yet' });
    }

    const probeDoc = probeSnap.docs[0];

    // Closed gaps — queries uncited in the PREVIOUS probe that flipped to cited
    // in the latest one. `wasContentGap` marks those that also had no nearby
    // fact at the time (geometry logged on the previous probe), i.e. gaps the
    // user closed by writing content. This is the celebration signal the UI
    // shows, and the labelled outcome the ML training set learns from.
    const prevDoc = probeSnap.docs[1];
    let closedGaps: { query: string; wasContentGap: boolean }[] = [];
    if (prevDoc) {
      const latestResults: { query: string; cited: boolean }[] = probeDoc.data().results ?? [];
      const prevResults: { query: string; cited: boolean; minFactDistance?: number | null }[] = prevDoc.data().results ?? [];
      const citedNow = new Set(latestResults.filter(r => r.cited).map(r => r.query.toLowerCase()));
      closedGaps = prevResults
        .filter(p => !p.cited && citedNow.has(p.query.toLowerCase()))
        .map(p => ({
          query: p.query,
          wasContentGap: typeof p.minFactDistance === 'number' && p.minFactDistance > GAP_DISTANCE,
        }));
    }
    const results: { query: string; cited: boolean; queryEmbedding?: number[]; minFactDistance?: number | null; factDensityNearQuery?: number }[] =
      probeDoc.data().results ?? [];
    const uncited = results.filter(r => r.cited === false);
    if (uncited.length === 0) {
      return NextResponse.json({ success: true, gaps: [], covered: [], closedGaps, reason: 'all_cited' });
    }

    const facts = await loadEmbeddedFacts(dbAdmin, userId);
    if (facts.length === 0) {
      // No embedded facts means EVERYTHING is a gap, but with no geometry to
      // rank by. Surface the uncited queries as-is.
      return NextResponse.json({
        success: true,
        reason: 'no_facts',
        covered: [],
        closedGaps,
        gaps: uncited.map(r => ({
          query: r.query,
          minFactDistance: null,
          factDensityNearQuery: 0,
          nearestFact: null,
          recommendation: `Add facts to your Brand Truth vault and publish content answering "${r.query}". You have no indexed knowledge near this query.`,
        })),
      });
    }

    // Prefer embeddings already logged on the probe (new probes store them);
    // embed on the fly for older probes, cached by probe ID.
    let queryEmbeddings: number[][];
    if (uncited.every(r => Array.isArray(r.queryEmbedding) && r.queryEmbedding.length > 0)) {
      queryEmbeddings = uncited.map(r => r.queryEmbedding!);
    } else {
      const cacheRef = dbAdmin.collection('_embeddings_cache').doc(`gaps_${probeDoc.id}`);
      const cached = (await cacheRef.get().catch(() => null))?.data()?.embeddings as number[][] | undefined;
      if (cached?.length === uncited.length) {
        queryEmbeddings = cached;
      } else {
        queryEmbeddings = await embeddingService.generateEmbeddings(uncited.map(r => r.query));
        cacheRef.set({ embeddings: queryEmbeddings, cachedAt: new Date().toISOString() }).catch(() => {});
      }
    }

    const geometry = computeQueryGeometry(queryEmbeddings, facts);

    const annotated = uncited.map((r, i) => ({
      query: r.query,
      minFactDistance: geometry[i].minFactDistance,
      factDensityNearQuery: geometry[i].factDensityNearQuery,
      nearestFact: geometry[i].nearestFactText ? geometry[i].nearestFactText!.substring(0, 120) : null,
      nearestFactSimilarity: geometry[i].nearestFactSimilarity,
    }));

    // Gap = no fact within the similarity threshold. Covered-but-uncited queries
    // are returned separately — those are a citation problem, not a content one.
    const gaps = annotated
      .filter(a => a.minFactDistance !== null && a.minFactDistance > GAP_DISTANCE)
      .sort((a, b) => (b.minFactDistance ?? 0) - (a.minFactDistance ?? 0))
      .map(a => ({
        ...a,
        recommendation: a.factDensityNearQuery === 0
          ? `You have no content near "${a.query}". Write an article or add vault facts that directly answer it.`
          : `Coverage near "${a.query}" is thin (${a.factDensityNearQuery} related fact${a.factDensityNearQuery === 1 ? '' : 's'}). Strengthen it with a dedicated, citable answer.`,
      }));

    const covered = annotated
      .filter(a => a.minFactDistance !== null && a.minFactDistance <= GAP_DISTANCE)
      .sort((a, b) => (a.minFactDistance ?? 0) - (b.minFactDistance ?? 0));

    return NextResponse.json({
      success: true,
      probeTimestamp: probeDoc.data().timestamp ?? null,
      threshold: GEOMETRY_SIM_THRESHOLD,
      gaps,
      covered,
      closedGaps,
      factCount: facts.length,
    });
  } catch (err: any) {
    console.error('analytics/gaps error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
