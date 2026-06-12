import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/api-auth';

// Brand Intelligence aggregator — replaces the old synthetic AetherGen demo
// panel with the user's REAL probe history. Everything here is derived from
// citation_tests documents the user has actually generated:
//
//   trend        — citation rate (overall + per platform) per probe run
//   platforms    — latest rates with delta vs previous probe
//   competitors  — head-to-head history per rival: rate trend, wins/losses,
//                  and "trojan opportunities" (queries THEY get cited on, you don't)
//   driftAlerts  — two-proportion z-test between consecutive probes per platform;
//                  |z| > 1.96 means the change is unlikely to be sampling noise
//
// No synthetic rows. If the user has no probe history the client shows an
// honest empty state instead of fake charts.

const MAX_PROBES = 30;

interface ProbeDoc {
  timestamp?: string;
  citationRate?: number;
  citedCount?: number;
  totalQueries?: number;
  platformRates?: Record<string, number | null>;
  sentimentBreakdown?: { positive?: number; neutral?: number; negative?: number };
  avgPositionPct?: number | null;
  results?: { query: string; cited: boolean }[];
  competitors?: {
    brand: string; domain: string; citationRate: number;
    wins: number; losses: number; ties: number;
    comparison?: { query: string; youCited: boolean; themCited: boolean; winner: string }[];
  }[];
  competitor?: ProbeDoc['competitors'] extends (infer T)[] | undefined ? T | null : never;
}

// Two-proportion z-test on cited counts between two probes of the same query set.
// Returns null when either sample is too small to say anything.
function twoProportionZ(c1: number, n1: number, c2: number, n2: number): number | null {
  if (n1 < 5 || n2 < 5) return null;
  const p1 = c1 / n1, p2 = c2 / n2;
  const pPool = (c1 + c2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return null;
  return (p2 - p1) / se;
}

export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    if (!dbAdmin) {
      return NextResponse.json({ success: true, probeCount: 0 });
    }

    const snap = await dbAdmin.collection('citation_tests')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(MAX_PROBES)
      .get();

    // Oldest → newest for time-series work.
    const probes = snap.docs.map(d => d.data() as ProbeDoc).reverse();

    if (probes.length === 0) {
      return NextResponse.json({ success: true, probeCount: 0 });
    }

    // ── Citation trend ─────────────────────────────────────────────────────
    const trend = probes.map(p => ({
      date: p.timestamp?.slice(0, 10) ?? null,
      timestamp: p.timestamp ?? null,
      citationRate: p.citationRate ?? null,
      platformRates: p.platformRates ?? {},
      totalQueries: p.totalQueries ?? null,
    }));

    // ── Platform deltas (latest vs previous) ──────────────────────────────
    const latest = probes[probes.length - 1];
    const prev = probes.length > 1 ? probes[probes.length - 2] : null;
    const platformKeys = Object.keys(latest.platformRates ?? {});
    const platforms = platformKeys.map(key => {
      const rate = latest.platformRates?.[key] ?? null;
      const prevRate = prev?.platformRates?.[key] ?? null;
      return {
        platform: key,
        rate,
        delta: rate !== null && prevRate !== null ? rate - prevRate : null,
      };
    });

    // ── Drift alerts — real significance, not synthetic z-scores ──────────
    // Compare each consecutive probe pair on raw cited counts. Per-platform
    // counts are reconstructed from rates × query counts (rates are stored
    // rounded; good enough for a screening test, and flagged as such).
    const driftAlerts: {
      from: string | null; to: string | null; platform: string;
      fromRate: number; toRate: number; deltaPp: number; zScore: number;
    }[] = [];
    for (let i = 1; i < probes.length; i++) {
      const a = probes[i - 1], b = probes[i];
      const nA = a.totalQueries ?? a.results?.length ?? 0;
      const nB = b.totalQueries ?? b.results?.length ?? 0;
      for (const key of Object.keys(b.platformRates ?? {})) {
        const rA = a.platformRates?.[key];
        const rB = b.platformRates?.[key];
        if (rA == null || rB == null) continue;
        const z = twoProportionZ(Math.round(rA / 100 * nA), nA, Math.round(rB / 100 * nB), nB);
        if (z !== null && Math.abs(z) > 1.96) {
          driftAlerts.push({
            from: a.timestamp?.slice(0, 10) ?? null,
            to: b.timestamp?.slice(0, 10) ?? null,
            platform: key,
            fromRate: rA, toRate: rB,
            deltaPp: rB - rA,
            zScore: parseFloat(z.toFixed(2)),
          });
        }
      }
    }
    driftAlerts.sort((x, y) => Math.abs(y.zScore) - Math.abs(x.zScore));

    // ── Competitor intelligence ────────────────────────────────────────────
    // Build per-rival history across all probes that ran in competitor mode.
    const rivalHistory = new Map<string, {
      brand: string; domain: string;
      points: { date: string | null; rate: number; wins: number; losses: number }[];
      latestComparison: { query: string; youCited: boolean; themCited: boolean }[] | null;
    }>();
    for (const p of probes) {
      const comps: NonNullable<ProbeDoc['competitors']> =
        Array.isArray(p.competitors) && p.competitors.length > 0
          ? p.competitors
          : (p as any).competitor ? [(p as any).competitor] : [];
      for (const c of comps) {
        if (!c?.domain) continue;
        const entry = rivalHistory.get(c.domain) ?? {
          brand: c.brand, domain: c.domain, points: [], latestComparison: null,
        };
        entry.points.push({
          date: p.timestamp?.slice(0, 10) ?? null,
          rate: c.citationRate ?? 0,
          wins: c.wins ?? 0,
          losses: c.losses ?? 0,
        });
        if (Array.isArray(c.comparison)) entry.latestComparison = c.comparison;
        rivalHistory.set(c.domain, entry);
      }
    }

    const competitors = [...rivalHistory.values()].map(r => {
      const pts = r.points;
      const latestPt = pts[pts.length - 1];
      const firstPt = pts[0];
      const trendDelta = pts.length > 1 ? latestPt.rate - firstPt.rate : 0;
      // Real trojan opportunities: queries the rival is cited on and you aren't.
      const trojanQueries = (r.latestComparison ?? [])
        .filter(c => c.themCited && !c.youCited)
        .map(c => c.query);
      return {
        brand: r.brand,
        domain: r.domain,
        latestRate: latestPt.rate,
        trendDelta,
        trendStatus: pts.length < 2 ? 'single-probe' : trendDelta > 5 ? 'rising' : trendDelta < -5 ? 'declining' : 'stable',
        wins: latestPt.wins,
        losses: latestPt.losses,
        probeCount: pts.length,
        history: pts,
        trojanQueries,
      };
    }).sort((a, b) => b.latestRate - a.latestRate);

    // ── Sentiment / summary ────────────────────────────────────────────────
    const sb = latest.sentimentBreakdown ?? {};
    const firstTs = probes[0].timestamp ? new Date(probes[0].timestamp).getTime() : null;
    const lastTs = latest.timestamp ? new Date(latest.timestamp).getTime() : null;

    return NextResponse.json({
      success: true,
      probeCount: probes.length,
      spanDays: firstTs && lastTs ? Math.round((lastTs - firstTs) / 86400000) : 0,
      summary: {
        citationRate: latest.citationRate ?? null,
        citationDelta: prev && latest.citationRate != null && prev.citationRate != null
          ? latest.citationRate - prev.citationRate : null,
        avgPositionPct: latest.avgPositionPct ?? null,
        sentiment: { positive: sb.positive ?? 0, neutral: sb.neutral ?? 0, negative: sb.negative ?? 0 },
        driftEventCount: driftAlerts.length,
        trojanOpportunityCount: competitors.reduce((s, c) => s + c.trojanQueries.length, 0),
      },
      trend,
      platforms,
      driftAlerts: driftAlerts.slice(0, 25),
      competitors,
    });
  } catch (err: any) {
    console.error('analytics/intel error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
