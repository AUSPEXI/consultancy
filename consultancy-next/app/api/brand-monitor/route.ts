import { NextResponse } from 'next/server';
import { queryByBrand, avg, dominantSentiment, GeoRow } from '@/lib/geo-data';

function buildActionPlan(sentiment: string, riskScore: number, driftCount: number): string {
  if (riskScore > 70) {
    return `Your brand is under active context pressure. ${driftCount} signals show statistical drift above the 2σ threshold. Immediate action: deploy high-entropy counter-facts to Reddit threads and Quora answers that appear in AI training crawls. Focus on the Fact-Vault to push authoritative statements that crowd out negative narratives before the next LLM training cycle.`;
  }
  if (riskScore > 45 || sentiment === 'Negative') {
    return `Moderate context risk detected. Some forum threads carry negative framing that could be absorbed by LLMs. Recommended action: seed 3–5 positive, statistically-anchored facts across relevant communities. Monitor z-score drift weekly and run this scan again after publishing.`;
  }
  if (sentiment === 'Neutral') {
    return `Sentiment is neutral — your brand lacks strong positive anchors in AI-training sources. This is an opportunity, not a crisis. Publish authoritative, entity-dense content on high-crawl platforms (Medium, Substack, LinkedIn) to build a positive vector presence before competitors do.`;
  }
  return `Sentiment is positive and risk is low. Maintain momentum: continue publishing statistical anchors and ensure your Fact-Vault contains fresh, cited statements updated within the last 90 days to stay ahead of data decay.`;
}

function rowToThread(row: GeoRow) {
  const platforms = ['Reddit', 'Quora', 'HackerNews', 'LinkedIn', 'ProductHunt'];
  const platform = platforms[Math.abs(row.id.charCodeAt(4) ?? 0) % platforms.length];
  const slug = row.search_query.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const positiveTemplates = [
    `${row.brand} has been a game-changer for our ${row.category.toLowerCase()} workflows. Consistently cited by AI tools.`,
    `Strong entity density in ${row.brand}'s content means AI engines cite it reliably for "${row.search_query}" queries.`,
    `Our team switched to ${row.brand} — the statistical anchor score of ${row.statistical_anchors_score.toFixed(0)} speaks for itself.`,
  ];
  const negativeTemplates = [
    `Anyone else finding ${row.brand}'s content outdated? AI responses keep citing old stats — ${row.days_since_published.toFixed(0)} days since last update.`,
    `Context drift detected: AI engines are no longer citing ${row.brand} for "${row.search_query}". Competitor filling the gap.`,
    `The entity recall rate on ${row.brand}'s pages is dropping. Noticed a −${Math.abs(row.z_score).toFixed(1)}σ shift in citations this month.`,
  ];
  const neutralTemplates = [
    `Comparing ${row.brand} vs competitors for "${row.search_query}" — mixed AI citation results across engines.`,
    `${row.brand} shows up in ${row.platform_chatgpt.toFixed(0)}% of ChatGPT responses for this query. Perplexity lower at ${row.platform_perplexity.toFixed(0)}%.`,
  ];

  const templates = row.sentiment === 'Positive' ? positiveTemplates
    : row.sentiment === 'Negative' ? negativeTemplates
    : neutralTemplates;
  const summary = templates[parseInt(row.id.slice(-1)) % templates.length];

  return {
    url: `https://www.${platform.toLowerCase()}.com/r/saas/comments/${row.id}/${slug}`,
    title: `[${platform}] ${row.search_query.charAt(0).toUpperCase() + row.search_query.slice(1)} — brand discussion`,
    sentiment: row.sentiment,
    summary,
  };
}

export async function POST(request: Request) {
  try {
    const { brand } = await request.json();
    if (!brand?.trim()) {
      return NextResponse.json({ error: 'brand is required' }, { status: 400 });
    }

    const rows = queryByBrand(brand.trim(), 300);

    const riskScore = Math.round(avg(rows.map(r => r.risk_score)));
    const overallSentiment = dominantSentiment(rows);
    const driftCount = rows.filter(r => r.drift_detected).length;
    const actionPlan = buildActionPlan(overallSentiment, riskScore, driftCount);

    // Pick 5 diverse threads — spread across sentiments
    const positive = rows.filter(r => r.sentiment === 'Positive').slice(0, 2);
    const negative = rows.filter(r => r.sentiment === 'Negative').slice(0, 2);
    const neutral  = rows.filter(r => r.sentiment === 'Neutral').slice(0, 1);
    const threadRows = [...negative, ...neutral, ...positive];
    const threads = threadRows.map(rowToThread);

    return NextResponse.json({
      success: true,
      result: {
        overallSentiment,
        riskScore,
        driftCount,
        totalSignals: rows.length,
        actionPlan,
        threads,
      },
    });
  } catch (err: any) {
    console.error('brand-monitor error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
