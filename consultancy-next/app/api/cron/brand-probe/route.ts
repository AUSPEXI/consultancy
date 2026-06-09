import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export const maxDuration = 800;
import {
  buildQueries, runCitationProbe, probeBrandRate, estimateProbeCost,
  ALL_ENGINES, type PlatformKey,
} from '@/lib/cite-probe-core';

// Scheduled daily brand probe. Accumulates REAL citation data for configured
// brands (brand + competitors) so the dashboard's synthetic tabs can be replaced
// with live measurements over time.
//
// Auth: Bearer ${CRON_SECRET} (same pattern as /api/cron/daily-autopilot).
// Budget: hard monthly ceiling read from cost_audit; halts before exceeding it.
// Kill switch: skips users with autoProbeEnabled === false.
// Cost control: Perplexity (the dominant cost) only runs on Mon & Thu.

const MONTHLY_TARGET_USD = Number(process.env.BRAND_PROBE_MONTHLY_TARGET_USD || 20);
const MONTHLY_CEILING_USD = Number(process.env.BRAND_PROBE_MONTHLY_CEILING_USD || 30);
const MAX_COMPETITORS = Number(process.env.BRAND_PROBE_MAX_COMPETITORS || 4);

function authorised(request: Request): boolean {
  const auth = request.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

// Engines to run today. The two per-request-priced engines are throttled because
// they dominate cost and barely move day-to-day:
//   • Perplexity (~$0.005/query) — web-grounded — runs Mon (1) & Thu (4).
//   • Google AI Overviews via SerpAPI (~$0.013/query) — the most expensive and the
//     slowest-moving surface (authority-weighted) — runs Wed (3) only.
function enginesForToday(date = new Date()): Set<PlatformKey> {
  const day = date.getUTCDay();
  const includePerplexity = day === 1 || day === 4;
  const includeGoogleAio = day === 3;
  return new Set<PlatformKey>(
    ALL_ENGINES.filter(e => {
      if (e === 'perplexity') return includePerplexity;
      if (e === 'google_aio') return includeGoogleAio;
      return true;
    })
  );
}

// Sum month-to-date spend from cost_audit. Handles all three field names the
// codebase has written historically: totalCostUsd, estimatedCostUsd, cost.
async function monthToDateSpend(): Promise<number> {
  if (!dbAdmin) return 0;
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const snap = await dbAdmin.collection('cost_audit').where('timestamp', '>=', monthStart).get();
  let total = 0;
  snap.forEach(d => {
    const v = d.data();
    total += Number(v.totalCostUsd ?? v.estimatedCostUsd ?? v.cost ?? 0);
  });
  return total;
}

// Normalise a competitor entry (string | {name|brand, domain}) to {brand, domain}.
function normaliseCompetitor(c: any): { brand: string; domain: string } | null {
  if (!c) return null;
  if (typeof c === 'string') return { brand: c, domain: '' };
  const brand = c.brand || c.name || '';
  if (!brand) return null;
  return { brand, domain: c.domain || '' };
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: 'Firebase Admin not initialised' }, { status: 500 });
  }

  const engines = enginesForToday();
  const startedAt = new Date().toISOString();
  const processed: any[] = [];

  try {
    let spend = await monthToDateSpend();
    if (spend >= MONTHLY_CEILING_USD) {
      return NextResponse.json({
        ok: true, skipped: 'budget',
        reason: `Month-to-date spend $${spend.toFixed(2)} has reached the $${MONTHLY_CEILING_USD} ceiling`,
        startedAt,
      });
    }
    const overTarget = spend >= MONTHLY_TARGET_USD;

    const usersSnap = await dbAdmin.collection('users').where('brand', '!=', '').get();

    for (const userDoc of usersSnap.docs) {
      const ud = userDoc.data();
      const userId = userDoc.id;
      const brand = ud.brand || '';
      const domain = ud.domain || '';
      const keywords: string[] = (ud.keywords || []).filter(Boolean);

      if (ud.autoProbeEnabled === false) { processed.push({ userId, status: 'skipped', reason: 'autoProbeEnabled=false' }); continue; }
      if (!brand || !domain || keywords.length === 0) { processed.push({ userId, status: 'skipped', reason: 'brand/domain/keywords incomplete' }); continue; }

      const queries = buildQueries(brand, domain, keywords);
      const competitors = (ud.competitors || [])
        .map(normaliseCompetitor)
        .filter(Boolean)
        .slice(0, MAX_COMPETITORS) as { brand: string; domain: string }[];

      // Estimate this user's cost: 1 brand pass + N competitor passes.
      const estCost = estimateProbeCost(queries.length, engines, 1 + competitors.length);
      if (spend + estCost > MONTHLY_CEILING_USD) {
        processed.push({ userId, status: 'skipped', reason: `would exceed ceiling (spend $${spend.toFixed(2)} + est $${estCost.toFixed(2)})` });
        continue;
      }

      const knownFalses: string[] = ud.negativeStatements || [];
      const timestamp = new Date().toISOString();

      try {
        const agg = await runCitationProbe({ brand, domain, queries, knownFalses, engines });

        // Competitor head-to-heads (cited-only) for breadth → Competitor Decay tab.
        const competitorResults: any[] = [];
        for (const comp of competitors) {
          const compProbe = await probeBrandRate(queries, comp.brand, comp.domain, engines);
          const compByQuery = new Map(compProbe.perQuery.map(r => [r.query, r.cited]));
          const comparison = agg.queryResults.map(r => {
            const youCited = r.cited;
            const themCited = compByQuery.get(r.query) ?? false;
            const winner = youCited === themCited ? 'tie' : youCited ? 'you' : 'them';
            return { query: r.query, youCited, themCited, winner };
          });
          competitorResults.push({
            brand: comp.brand, domain: comp.domain, citationRate: compProbe.rate,
            wins: comparison.filter(c => c.winner === 'you').length,
            losses: comparison.filter(c => c.winner === 'them').length,
            ties: comparison.filter(c => c.winner === 'tie').length,
            comparison,
          });
        }

        const probeResult = {
          brand, domain, userId, timestamp,
          citationRate: agg.citationRate, citedCount: agg.citedCount,
          misinformationCount: agg.misinformationCount,
          totalQueries: queries.length,
          activePlatforms: agg.activePlatforms, platformRates: agg.platformRates,
          results: agg.queryResults,
          mode: competitorResults.length > 0 ? 'competitor' : 'standard',
          // Backward-compat: dashboard reads `competitor` (singular); keep the first.
          competitor: competitorResults[0] || null,
          competitors: competitorResults,
          source: 'cron-brand-probe',
          engines: [...engines],
        };

        await dbAdmin.collection('citation_tests').add(probeResult);

        const cost = estimateProbeCost(queries.length, engines, 1 + competitors.length);
        await dbAdmin.collection('cost_audit').add({
          userId, feature: 'cron-brand-probe', timestamp,
          platforms: [...engines],
          queriesRun: queries.length * (1 + competitors.length),
          estimatedCostUsd: cost, totalCostUsd: cost,
        });

        spend += cost;
        processed.push({
          userId, status: 'ok', citationRate: agg.citationRate,
          competitors: competitorResults.length, cost: Number(cost.toFixed(4)),
        });
      } catch (err: any) {
        processed.push({ userId, status: 'error', error: err.message });
      }

      if (spend >= MONTHLY_CEILING_USD) {
        processed.push({ status: 'halted', reason: `ceiling reached mid-run at $${spend.toFixed(2)}` });
        break;
      }
    }

    return NextResponse.json({
      ok: true, startedAt, completedAt: new Date().toISOString(),
      engines: [...engines],
      perplexityIncluded: engines.has('perplexity'),
      monthToDateSpend: Number(spend.toFixed(2)),
      target: MONTHLY_TARGET_USD, ceiling: MONTHLY_CEILING_USD,
      overTarget,
      totalProbed: processed.filter(p => p.status === 'ok').length,
      processed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, processed, startedAt }, { status: 500 });
  }
}
