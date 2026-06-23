import { runCitationProbe, probeBrandRate, ENGINE_MODEL_VERSIONS, type ProbeMode } from './cite-probe-core';
import { headToHeadVerdict } from './stats';
import { computeAttribution } from './attribution';

// Shared probe core used by BOTH the synchronous /api/cite-probe route and the
// Netlify background function (for long grounded/both runs that exceed the 26s
// synchronous function limit). Deliberately imports only alias-free modules
// (cite-probe-core, stats, attribution) so it bundles cleanly inside a raw
// Netlify function. Geometry + semantic-judge enrichment stay in the sync route
// only (they pull alias/Next-bound deps); they're non-fatal and omitted here.

function brandFromDomain(domain: string): string {
  const host = String(domain).trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
  const label = host.split('.')[0] || host;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export interface ProbeJobParams {
  brand: string;
  domain: string;
  userId: string;
  queries: string[];
  knownFalses: string[];
  mode: ProbeMode;
  wantBoth: boolean;
  trialsPerQuery: number;
  competitorTargets: { brand: string; domain: string }[];
  queriesSource: string;
}

// Runs the full probe (brand + optional parametric comparison + competitors +
// attribution), persists to citation_tests/cost_audit when a db is given, and
// returns the client-facing probe result object.
export async function runProbeJob(params: ProbeJobParams, dbAdmin: any): Promise<any> {
  const {
    brand, domain, userId, queries: testQueries, knownFalses,
    mode: probeMode, wantBoth, trialsPerQuery, competitorTargets, queriesSource,
  } = params;
  const timestamp = new Date().toISOString();

  const {
    queryResults, platformRates, citationRate, ci95,
    citedCount, misinformationCount, activePlatforms,
    sentimentBreakdown, avgPositionPct, platformTrialStats,
  } = await runCitationProbe({ brand, domain, queries: testQueries, knownFalses, mode: probeMode, trialsPerQuery });

  let parametricPlatformRates: Record<string, number | null> | null = null;
  let parametricCitationRate: number | null = null;
  if (wantBoth) {
    try {
      const pPass = await runCitationProbe({ brand, domain, queries: testQueries, knownFalses, mode: 'parametric', trialsPerQuery: 1 });
      parametricPlatformRates = pPass.platformRates;
      parametricCitationRate = pPass.citationRate;
    } catch (e) {
      console.warn('[cite-probe-job] parametric comparison pass failed (non-fatal):', e);
    }
  }

  const competitors = await Promise.all(
    competitorTargets.map(async ({ brand: cBrand, domain: cDomain }) => {
      const compProbe = await probeBrandRate(testQueries, cBrand, cDomain, undefined, probeMode);
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
        significance: headToHeadVerdict(
          comparison.filter(c => c.youCited).length, comparison.length,
          comparison.filter(c => c.themCited).length, comparison.length,
        ),
        comparison,
      };
    })
  );
  const isCompetitorMode = competitors.length > 0;
  const competitor = isCompetitorMode
    ? [...competitors].sort((a, b) => b.citationRate - a.citationRate)[0]
    : null;

  let attribution = null;
  if (dbAdmin && userId !== 'anonymous') {
    try {
      attribution = await computeAttribution(
        dbAdmin, userId,
        queryResults.map(r => ({ query: r.query, cited: r.cited })),
        citationRate, timestamp,
      );
    } catch (attrErr) {
      console.warn('[cite-probe-job] attribution failed (non-fatal):', attrErr);
    }
  }

  const probeResult = {
    brand, domain, userId, timestamp,
    citationRate, ci95, citedCount, misinformationCount,
    totalQueries: testQueries.length,
    activePlatforms, platformRates,
    platformTrialStats, trialsPerQuery,
    sentimentBreakdown, avgPositionPct,
    results: queryResults,
    geometry: null,
    queriesSource,
    engineVersions: ENGINE_MODEL_VERSIONS,
    attribution,
    mode: isCompetitorMode ? 'competitor' : 'standard',
    pathwayMode: wantBoth ? 'both' : probeMode,
    parametricPlatformRates,
    parametricCitationRate,
    scoring: 'heuristic',
    judgeAgreement: null,
    competitorDomain: competitor?.domain ?? null,
    competitor,
    competitors,
  };

  if (dbAdmin && userId !== 'anonymous') {
    try {
      await dbAdmin.collection('citation_tests').add(probeResult);
      dbAdmin.collection('audit_logs').add({
        userId,
        action: 'Ran Citation Probe (async)',
        details: { citationRate, citedCount, misinformationCount, totalQueries: testQueries.length, activePlatforms, platformRates },
        timestamp: new Date().toISOString(),
      }).catch(() => {});
      const passes = trialsPerQuery + competitors.length + (wantBoth ? 1 : 0);
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
        userId, feature: 'cite-probe-async', timestamp,
        platforms: Object.keys(platformRates).filter(p => platformRates[p] !== null),
        queriesRun: perPassQueries * passes,
        competitorsProbed: competitors.length,
        estimatedCostUsd: cost,
        totalCostUsd: cost,
      }).catch(() => {});
    } catch (err) {
      console.error('[cite-probe-job] Failed to persist citation test:', err);
    }
  }

  return probeResult;
}

// Resolve + cap competitor targets from raw inputs (shared with the sync route).
export function resolveCompetitorTargets(
  competitorDomains: any[], competitorBrand: string, competitorDomain: string, maxCompetitors: number,
): { brand: string; domain: string }[] {
  const targets: { brand: string; domain: string }[] = [];
  if (Array.isArray(competitorDomains) && competitorDomains.length > 0) {
    for (const raw of competitorDomains) {
      const d = String(raw || '').trim();
      if (d) targets.push({ brand: brandFromDomain(d), domain: d });
    }
  } else if (competitorBrand && competitorDomain) {
    targets.push({ brand: competitorBrand, domain: competitorDomain });
  }
  return targets.slice(0, maxCompetitors);
}
