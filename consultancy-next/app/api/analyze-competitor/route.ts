import { NextResponse } from 'next/server';
import { queryByCompetitor, avg, dominantDecayStatus } from '@/lib/geo-data';

function deriveVulnerabilities(
  decayStatus: string,
  avgDecayScore: number,
  avgContentScore: number,
  avgEntityDensity: number,
  avgStatAnchors: number,
  avgDaysSincePublished: number,
  trojanCount: number,
): string[] {
  const vulns: string[] = [];

  if (avgDaysSincePublished > 300) {
    vulns.push(`Content is ${Math.round(avgDaysSincePublished)}-days stale on average — AI engines are deprioritising citations.`);
  } else if (avgDaysSincePublished > 150) {
    vulns.push(`Publishing cadence is slow (avg ${Math.round(avgDaysSincePublished)} days since last update), creating a content freshness gap.`);
  }

  if (avgEntityDensity < 30) {
    vulns.push(`Entity density score is ${avgEntityDensity.toFixed(0)}/100 — AI models struggle to extract specific, citable facts from their pages.`);
  } else if (avgEntityDensity < 50) {
    vulns.push(`Weak named-entity coverage (${avgEntityDensity.toFixed(0)}/100) — their content lacks the specificity AI engines reward in citation ranking.`);
  }

  if (avgStatAnchors < 40) {
    vulns.push(`Statistical anchor score of ${avgStatAnchors.toFixed(0)}/100 — content relies on opinion rather than verifiable data points, reducing LLM trust.`);
  }

  if (avgContentScore < 45) {
    vulns.push(`Overall content quality at ${avgContentScore.toFixed(0)}/100 — below the threshold where AI engines consistently favour a source.`);
  }

  if (decayStatus === 'stale') {
    vulns.push(`Domain classified as "stale" — AI training corpora may already be dropping or downweighting their citations.`);
  } else if (decayStatus === 'decaying') {
    vulns.push(`Active data decay in progress — their SOV is trending downward across multiple AI platforms.`);
  }

  if (trojanCount > 0) {
    vulns.push(`${trojanCount} "Trojan Horse" openings detected — queries where they rank but with low confidence scores you can displace with authoritative counter-facts.`);
  }

  if (vulns.length === 0) {
    vulns.push(`Competitor appears healthy in AI citations but shows average decay score of ${avgDecayScore.toFixed(0)} — monitor monthly for drift.`);
  }

  return vulns;
}

export async function POST(request: Request) {
  try {
    const { hostname } = await request.json();
    if (!hostname?.trim()) {
      return NextResponse.json({ error: 'hostname is required' }, { status: 400 });
    }

    const rows = queryByCompetitor(hostname.trim(), 200);

    const decayStatus  = dominantDecayStatus(rows);
    const avgDecay     = avg(rows.map(r => r.decay_score));
    const avgContent   = avg(rows.map(r => r.content_score));
    const avgEntity    = avg(rows.map(r => r.entity_density_score));
    const avgAnchors   = avg(rows.map(r => r.statistical_anchors_score));
    const avgDays      = avg(rows.map(r => r.days_since_published));
    const trojanCount  = rows.filter(r => r.trojan_horse_opportunity).length;
    const trojan       = trojanCount > 0 || decayStatus !== 'healthy';
    const competitorName = rows[0]?.competitor_name || hostname.split('.')[0];

    const vulnerabilities = deriveVulnerabilities(
      decayStatus, avgDecay, avgContent, avgEntity, avgAnchors, avgDays, trojanCount
    );

    return NextResponse.json({
      success: true,
      result: {
        name: competitorName,
        decayStatus,
        decayScore: Math.round(avgDecay),
        contentScore: Math.round(avgContent),
        entityDensityScore: Math.round(avgEntity),
        statisticalAnchorsScore: Math.round(avgAnchors),
        avgDaysSincePublished: Math.round(avgDays),
        trojanHorseOpportunity: trojan,
        vulnerabilities,
        totalSignals: rows.length,
      },
    });
  } catch (err: any) {
    console.error('analyze-competitor error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
