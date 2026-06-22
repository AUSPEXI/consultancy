import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/api-auth';

// GEO Lab → dashboard feedback loop.
//
// POST: the GEO Lab orchestrator (publish-finding.mjs) pushes a completed
//   experiment's verdict here, authorised by a shared secret. Findings are
//   upserted by lever so re-running an experiment refreshes its recommendation
//   in place rather than duplicating it.
//
// GET: authenticated dashboard clients read back the ACTIVE (statistically
//   significant) findings as evidence-backed content recommendations, plus a
//   count of null results for transparency.

function authorisedPublish(request: Request): boolean {
  const auth = request.headers.get('authorization') || '';
  const secret = process.env.GEO_FINDINGS_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

interface FindingPayload {
  id: string;
  lever: string;
  slug?: string;
  title?: string;
  hypothesis?: string;
  verdict: 'significant' | 'null';
  headline?: string;
  recommendation?: string;
  appliesTo?: string[];
  bestVariant?: string | null;
  topEffect?: { platform: string; treatment: string; diffPp: number; pValue: number } | null;
  // Programme-wide FDR (Benjamini–Hochberg) q-value + metadata from fdr-ledger.mjs.
  qValue?: number | null;
  fdr?: { method: string; alpha: number; programmeSize: number; primaryP: number; qValue: number; survivesFdr: boolean; computedAt: string } | null;
  significant?: unknown[];
  aggregate?: Record<string, unknown>;
  platforms?: string[];
  trialsPerVariant?: number;
  runAt?: string;
  active?: boolean;
  // Temporal/reproducibility metadata (2026-06): collection window, engine
  // versions, and 30-day longitudinal re-test verification from the GEO Lab.
  collectionSpanDays?: number | null;
  modelVersions?: Record<string, string[]>;
  modelDrift?: boolean;
  retestCount?: number;
  lastVerifiedAt?: string | null;
  verificationStatus?: 'unverified' | 'verified' | 'decayed';
}

export async function POST(request: Request) {
  if (!authorisedPublish(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: 'Datastore unavailable' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as FindingPayload;
    if (!body?.lever || !body?.verdict) {
      return NextResponse.json({ error: 'lever and verdict are required' }, { status: 400 });
    }

    const doc = {
      ...body,
      // A finding is only an active recommendation when it's significant.
      active: body.verdict === 'significant' && body.active !== false,
      updatedAt: new Date().toISOString(),
    };

    // Upsert keyed by lever — one living recommendation per lever.
    await dbAdmin.collection('geo_findings').doc(body.lever).set(doc, { merge: true });

    return NextResponse.json({ success: true, lever: body.lever, active: doc.active });
  } catch (err: any) {
    console.error('geo-findings POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    if (!dbAdmin) return NextResponse.json({ success: true, recommendations: [], nullResultCount: 0 });

    const snap = await dbAdmin.collection('geo_findings').get();
    const all = snap.docs.map((d) => d.data() as FindingPayload & { active?: boolean });

    const recommendations = all
      // Decayed findings (re-test showed the effect no longer holds) are
      // excluded from active advice even if an older publish left active=true.
      .filter((f) => f.active && f.verificationStatus !== 'decayed')
      .map((f) => ({
        lever: f.lever,
        headline: f.headline || f.title || f.lever,
        recommendation: f.recommendation || '',
        appliesTo: f.appliesTo || [],
        topEffect: f.topEffect || null,
        // FDR-adjusted q-value across the whole research programme (q<0.05 survives).
        qValue: f.qValue ?? null,
        survivesFdr: f.fdr?.survivesFdr ?? (typeof f.qValue === 'number' ? f.qValue < 0.05 : null),
        platforms: f.platforms || [],
        trialsPerVariant: f.trialsPerVariant ?? null,
        runAt: f.runAt || null,
        // Freshness metadata for UI badges: '✓ re-verified <date>' beats 'tested once'.
        verificationStatus: f.verificationStatus ?? 'unverified',
        lastVerifiedAt: f.lastVerifiedAt ?? null,
        retestCount: f.retestCount ?? 0,
      }))
      // Re-verified findings first, then strongest validated effect.
      .sort((a, b) =>
        (b.verificationStatus === 'verified' ? 1 : 0) - (a.verificationStatus === 'verified' ? 1 : 0)
        || Math.abs(b.topEffect?.diffPp || 0) - Math.abs(a.topEffect?.diffPp || 0));

    const nullResultCount = all.filter((f) => f.verdict === 'null').length;
    const decayedCount = all.filter((f) => f.verificationStatus === 'decayed').length;

    return NextResponse.json({ success: true, recommendations, nullResultCount, decayedCount });
  } catch (err: any) {
    console.error('geo-findings GET error:', err);
    return NextResponse.json({ success: false, error: err.message, recommendations: [], nullResultCount: 0 }, { status: 500 });
  }
}
