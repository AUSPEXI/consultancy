import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { requireTier } from '@/lib/api-auth';
import { refineGeoContent, DEFAULT_GEO_RUBRIC } from '@/lib/grade-revise';

/**
 * Grade-and-revise GEO synthesis.
 *
 * Wraps the synthesis agent in a blind-grader loop: the article is generated,
 * scored against a rubric the generator never sees, and revised on the grader's
 * feedback until it clears `passThreshold` or `maxIterations` is reached.
 *
 * Purely additive — the existing /api/agent/synthesize and /api/content-scorer
 * endpoints are unchanged. Call this when you want the loop done server-side in
 * one request instead of orchestrating generate/score/rewrite in the client.
 */
export async function POST(request: Request) {
  const auth = await requireTier(request, 'Starter');
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const {
      topic,
      facts,
      brandName,
      negativeStatements = [],
      rubric,
      passThreshold,
      maxIterations,
    } = await request.json();

    if (!topic?.trim() || !facts?.trim()) {
      return NextResponse.json({ error: 'topic and facts are required' }, { status: 400 });
    }

    // Reuse the same lab-validated GEO tactics injection as /synthesize.
    // Non-fatal — falls back to the standard generator prompt if unavailable.
    let labLeverSection = '';
    if (dbAdmin) {
      try {
        const snap = await dbAdmin.collection('geo_findings').get();
        const activeFindings = snap.docs
          .map((d) => d.data() as { active?: boolean; headline?: string; recommendation?: string; topEffect?: { diffPp: number } })
          .filter((f) => f.active && f.recommendation)
          .sort((a, b) => Math.abs(b.topEffect?.diffPp || 0) - Math.abs(a.topEffect?.diffPp || 0))
          .slice(0, 3);
        if (activeFindings.length > 0) {
          labLeverSection = `\n\nLAB-VALIDATED GEO TACTICS (apply ALL of these): each is empirically proven to lift citation rate in real A/B experiments.\n${activeFindings.map((f, i) => `${i + 1}. ${f.headline}: ${f.recommendation}`).join('\n')}`;
        }
      } catch { /* non-fatal */ }
    }

    const result = await refineGeoContent({
      userId,
      topic,
      facts,
      brandName,
      negativeStatements,
      rubric: typeof rubric === 'string' && rubric.trim() ? rubric : DEFAULT_GEO_RUBRIC,
      passThreshold,
      maxIterations,
      labLeverSection,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      result: result.finalContent,
      status: result.status,
      score: result.finalScore,
      iterations: result.iterations.map((it) => ({
        iteration: it.iteration,
        score: it.score,
        passed: it.passed,
        feedback: it.feedback,
        subScores: it.subScores,
      })),
    });
  } catch (err: any) {
    console.error('agent/refine error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
