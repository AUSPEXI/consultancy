import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { computeAttribution } from '@/lib/attribution';
import { requireAuth } from '@/lib/api-auth';
import { perplexityBudget } from '@/lib/perplexity-budget';
import { buildQueries, runCitationProbe, probeBrandRate, ENGINE_MODEL_VERSIONS } from '@/lib/cite-probe-core';
import { normalizeTier, checkTierAccess } from '@/constants/tiers';
import { embeddingService } from '@/lib/embeddings';
import { computeQueryGeometry, loadEmbeddedFacts, GEOMETRY_SIM_THRESHOLD } from '@/lib/fact-geometry';

// Mine real questions from Reddit/Quora threads stored by the Brand Monitor.
// Returns up to `max` question-shaped strings, or an empty array if nothing found.
async function buildQueriesFromBrandMonitor(userId: string, max = 5): Promise<string[]> {
  if (!dbAdmin) return [];
  try {
    const snap = await dbAdmin
      .collection('brand_monitor_results')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();
    const questions: string[] = [];
    for (const doc of snap.docs) {
      const threads: any[] = doc.data().threads ?? [];
      for (const t of threads) {
        const summary: string = t.summary ?? t.title ?? '';
        // Extract question-shaped sentences from the summary or use the title directly.
        const sentences = summary.split(/[.!]/);
        for (const s of sentences) {
          const trimmed = s.trim();
          if (trimmed.endsWith('?') && trimmed.length > 20 && trimmed.length < 200) {
            questions.push(trimmed);
          }
        }
        // Thread titles are often questions themselves.
        if (typeof t.title === 'string' && t.title.endsWith('?')) {
          questions.push(t.title.trim());
        }
      }
      if (questions.length >= max) break;
    }
    // Deduplicate and cap.
    return [...new Set(questions)].slice(0, max);
  } catch {
    return [];
  }
}

// Free tier may run a limited number of live probes per calendar month — it's a
// taster, not the product. Paid tiers (Starter+) are unmetered here.
const FREE_MONTHLY_PROBE_LIMIT = 1;

/**
 * Derives a human brand label from a bare domain so saved competitor domains
 * (e.g. "acme-photos.com") render as a readable name ("Acme-photos") in the
 * head-to-head UI. Strips protocol, www, and TLD.
 */
function brandFromDomain(domain: string): string {
  const host = String(domain)
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0];
  const label = host.split('.')[0] || host;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

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

  // Daily Perplexity spend guard — hard-stop probes once over the configured cap.
  const budget = await perplexityBudget(dbAdmin);
  if (budget.over) {
    return NextResponse.json(
      { error: `Daily Perplexity budget reached ($${budget.spentToday.toFixed(2)} of $${budget.cap}). Probes resume tomorrow.` },
      { status: 429 }
    );
  }

  try {
    const {
      brand, domain, queries, keywords = [],
      negativeStatements: clientFalses = [],
      competitorBrand = '', competitorDomain = '',
      competitors: competitorDomains = [],
    } = await request.json();

    if (!brand || !domain) {
      return NextResponse.json({ error: 'brand and domain are required' }, { status: 400 });
    }

    // Free-tier monthly meter (paid tiers + admins pass through).
    const meterBlock = await enforceFreeProbeMeter(userId);
    if (meterBlock) return meterBlock;

    // Load known-false statements + tier + tracking panel (single Firestore read).
    let knownFalses: string[] = clientFalses;
    let userTier = 'Free';
    let trackingPanel: string[] = [];
    if (dbAdmin && userId !== 'anonymous') {
      try {
        const userDoc = await dbAdmin.collection('users').doc(userId).get();
        const ud = userDoc.data() ?? {};
        if (knownFalses.length === 0) knownFalses = ud.negativeStatements || [];
        userTier = ud.tier || 'Free';
        if (Array.isArray(ud.trackingQueries)) trackingPanel = ud.trackingQueries.filter((q: any) => typeof q === 'string');
      } catch (_) {}
    }

    // Query selection, in priority order:
    //   1. Caller-supplied queries → exploratory run (charted separately).
    //   2. The user's pinned tracking panel → the fixed query set probed on every
    //      auto run, so citation-rate deltas across time compare like with like.
    //   3. First auto run: blend real Reddit/Quora questions (from Brand Monitor)
    //      with keyword templates, then PIN the result as the tracking panel.
    let testQueries: string[];
    let queriesSource: 'caller' | 'tracking-panel' | 'tracking-panel-created';
    if (queries?.length > 0) {
      testQueries = queries;
      queriesSource = 'caller';
    } else if (trackingPanel.length > 0) {
      testQueries = trackingPanel;
      queriesSource = 'tracking-panel';
    } else {
      const realQuestions = await buildQueriesFromBrandMonitor(userId);
      const templateQueries = buildQueries(brand, domain, keywords);
      // Blend: real questions first (up to 4), fill remaining slots from templates.
      const combined = [...realQuestions.slice(0, 4), ...templateQueries];
      // Deduplicate by lowercased text; cap at 10.
      const seen = new Set<string>();
      testQueries = combined.filter(q => {
        const k = q.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).slice(0, 10);
      queriesSource = 'tracking-panel-created';
      if (dbAdmin && userId !== 'anonymous') {
        dbAdmin.collection('users').doc(userId).set({ trackingQueries: testQueries }, { merge: true }).catch(() => {});
      }
    }
    const timestamp = new Date().toISOString();

    const {
      queryResults, platformRates, citationRate, ci95,
      citedCount, misinformationCount, activePlatforms,
      sentimentBreakdown, avgPositionPct,
    } = await runCitationProbe({ brand, domain, queries: testQueries, knownFalses });

    // S7.1: competitor comparison — run the SAME queries for each competitor and
    // compute per-query winners so the user gets a concrete head-to-head benchmark.
    // Accepts either a list of competitor domains (preferred — populated from the
    // user's saved competitors, zero extra clicks) or the legacy single brand/domain.
    // Tier-based cap: Business 50 / everyone else 20.
    const normalizedTier = normalizeTier(userTier);
    const MAX_COMPETITORS = normalizedTier === 'Business' ? 50 : 20;
    const competitorTargets: { brand: string; domain: string }[] = [];
    if (Array.isArray(competitorDomains) && competitorDomains.length > 0) {
      for (const raw of competitorDomains) {
        const d = String(raw || '').trim();
        if (d) competitorTargets.push({ brand: brandFromDomain(d), domain: d });
      }
    } else if (competitorBrand && competitorDomain) {
      competitorTargets.push({ brand: competitorBrand, domain: competitorDomain });
    }
    const cappedTargets = competitorTargets.slice(0, MAX_COMPETITORS);

    const competitors = await Promise.all(
      cappedTargets.map(async ({ brand: cBrand, domain: cDomain }) => {
        const compProbe = await probeBrandRate(testQueries, cBrand, cDomain);
        const compByQuery = new Map(compProbe.perQuery.map(r => [r.query, r.cited]));
        const comparison = queryResults.map(r => {
          const youCited = r.cited;
          const themCited = compByQuery.get(r.query) ?? false;
          const winner = youCited === themCited ? 'tie' : youCited ? 'you' : 'them';
          return { query: r.query, youCited, themCited, winner };
        });
        return {
          brand: cBrand,
          domain: cDomain,
          citationRate: compProbe.rate,
          wins: comparison.filter(c => c.winner === 'you').length,
          losses: comparison.filter(c => c.winner === 'them').length,
          ties: comparison.filter(c => c.winner === 'tie').length,
          comparison,
        };
      })
    );
    const isCompetitorMode = competitors.length > 0;
    // Primary competitor = the strongest rival (highest citation rate). Kept as a
    // single `competitor` field for backward compatibility with the Overview
    // head-to-head card, which reads citation_tests[].competitor.
    const competitor = isCompetitorMode
      ? [...competitors].sort((a, b) => b.citationRate - a.citationRate)[0]
      : null;

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

    // Fact-to-query geometry — logged per probe interval so the ML training set
    // (spec §3a) gets real semantic features instead of nulls: how far each
    // probed query sits from the user's nearest vault fact, and how many facts
    // cover it. Stored per result alongside the query embedding. Non-fatal.
    let geometrySummary: { avgMinFactDistance: number | null; gapQueryCount: number; embeddingSpace: string } | null = null;
    let resultsWithGeometry = queryResults;
    if (dbAdmin && userId !== 'anonymous') {
      try {
        const [queryEmbeddings, facts] = await Promise.all([
          embeddingService.generateEmbeddings(queryResults.map(r => r.query)),
          loadEmbeddedFacts(dbAdmin, userId),
        ]);
        const geometry = computeQueryGeometry(queryEmbeddings, facts);
        resultsWithGeometry = queryResults.map((r, i) => ({
          ...r,
          queryEmbedding: queryEmbeddings[i],
          minFactDistance: geometry[i].minFactDistance,
          factDensityNearQuery: geometry[i].factDensityNearQuery,
        }));
        const dists = geometry.map(g => g.minFactDistance).filter((d): d is number => d !== null);
        geometrySummary = {
          avgMinFactDistance: dists.length ? parseFloat((dists.reduce((s, d) => s + d, 0) / dists.length).toFixed(4)) : null,
          gapQueryCount: geometry.filter((g, i) => !queryResults[i].cited && g.minFactDistance !== null && g.minFactDistance > 1 - GEOMETRY_SIM_THRESHOLD).length,
          embeddingSpace: embeddingService.getActiveSpace('auto'),
        };
      } catch (geoErr) {
        console.warn('[cite-probe] geometry logging failed (non-fatal):', geoErr);
      }
    }

    const probeResult = {
      brand, domain, userId, timestamp,
      citationRate, ci95, citedCount, misinformationCount,
      totalQueries: testQueries.length,
      activePlatforms, platformRates,
      sentimentBreakdown, avgPositionPct,
      results: resultsWithGeometry,
      geometry: geometrySummary,
      queriesSource,
      engineVersions: ENGINE_MODEL_VERSIONS,
      attribution,
      mode: isCompetitorMode ? 'competitor' : 'standard',
      competitorDomain: competitor?.domain ?? null,
      competitor,
      competitors,
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
        // Each competitor is a full extra probe pass over the same queries.
        const passes = 1 + competitors.length;
        const perPassQueries = testQueries.length;
        const cost = passes * (
          (platformRates.gemini !== null ? (perPassQueries * 500 / 1_000_000) * 0.40 : 0) +
          (platformRates.chatgpt !== null ? (perPassQueries * 800 / 1_000_000) * 0.60 : 0) +
          (platformRates.perplexity !== null ? perPassQueries * 0.005 : 0) +
          (platformRates.claude !== null ? (perPassQueries * 800 / 1_000_000) * 4.00 : 0) +
          (platformRates.grok != null ? (perPassQueries * 800 / 1_000_000) * 2.00 : 0) +
          (platformRates.deepseek != null ? (perPassQueries * 800 / 1_000_000) * 0.28 : 0) +
          (platformRates.google_aio != null ? perPassQueries * 0.013 : 0)
        );
        dbAdmin.collection('cost_audit').add({
          userId, feature: 'cite-probe-multi', timestamp,
          platforms: Object.keys(platformRates).filter(p => platformRates[p] !== null),
          queriesRun: perPassQueries * passes,
          competitorsProbed: competitors.length,
          estimatedCostUsd: cost,
          totalCostUsd: cost,
        }).catch(() => {});
      } catch (err) {
        console.error('Failed to persist citation test:', err);
      }
    }

    // Strip 768-d query embeddings from the client payload — they're training
    // data, not UI data, and would add ~150KB per response.
    const resultsForClient = resultsWithGeometry.map(({ queryEmbedding: _qe, ...rest }: any) => rest);
    return NextResponse.json({ success: true, ...probeResult, results: resultsForClient });
  } catch (err: any) {
    console.error('cite-probe error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
