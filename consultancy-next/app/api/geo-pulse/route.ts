import { NextResponse } from 'next/server';
import { queryByKeyword, avg, dominantSentiment, trendString, GeoRow } from '@/lib/geo-data';

function buildInsights(
  keyword: string,
  rows: GeoRow[],
  avgChatgpt: number,
  avgPerplexity: number,
  avgClaude: number,
  avgGemini: number,
  aggregateSov: number,
): string[] {
  const insights: string[] = [];
  const leader = [
    { name: 'ChatGPT', sov: avgChatgpt },
    { name: 'Perplexity', sov: avgPerplexity },
    { name: 'Claude', sov: avgClaude },
    { name: 'Gemini', sov: avgGemini },
  ].sort((a, b) => b.sov - a.sov)[0];

  insights.push(`${leader.name} shows the highest Share of Voice (${leader.sov.toFixed(0)}%) for "${keyword}" queries — prioritise content formats that engine favours.`);

  const driftRows = rows.filter(r => r.drift_detected);
  if (driftRows.length > 0) {
    const pct = Math.round((driftRows.length / rows.length) * 100);
    insights.push(`${pct}% of signals show active context drift — AI engines are actively re-weighting citations for this topic. Publish fresh statistical anchors within 30 days.`);
  }

  const trojanRows = rows.filter(r => r.trojan_horse_opportunity);
  if (trojanRows.length > 0) {
    insights.push(`${trojanRows.length} Trojan Horse opportunities detected — queries where competitors rank with low confidence scores you can displace with a single authoritative fact-sheet.`);
  }

  const avgEntity = avg(rows.map(r => r.entity_density_score));
  if (avgEntity < 45) {
    insights.push(`Entity density across this keyword cluster is ${avgEntity.toFixed(0)}/100 — AI engines lack specific facts to cite. Adding named entities (people, products, data points) will lift citation frequency.`);
  }

  if (aggregateSov < 30) {
    insights.push(`Aggregate SoV of ${aggregateSov.toFixed(0)}% signals low brand presence across AI engines for this intent. This topic is still open — early authority content can capture it.`);
  } else if (aggregateSov > 60) {
    insights.push(`Strong aggregate SoV of ${aggregateSov.toFixed(0)}% — you are the dominant cited source for this intent. Defend with monthly freshness updates to prevent decay.`);
  }

  return insights.slice(0, 5);
}

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json();
    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const rows = queryByKeyword(keyword.trim(), 300);

    const avgChatgpt    = avg(rows.map(r => r.platform_chatgpt));
    const avgPerplexity = avg(rows.map(r => r.platform_perplexity));
    const avgClaude     = avg(rows.map(r => r.platform_claude));
    const avgGemini     = avg(rows.map(r => r.platform_gemini));
    const aggregateSov  = Math.round(avg(rows.map(r => r.sov_score)));
    const overallTrend  = trendString(rows);
    const sentiment     = dominantSentiment(rows);

    // Per-engine rows for per-engine sentiment
    const engineSentiment = (engine: string) => {
      const engineRows = rows.filter(r => r.ai_engine?.toLowerCase().includes(engine));
      return engineRows.length > 0 ? dominantSentiment(engineRows) : sentiment;
    };

    const models = [
      { name: 'ChatGPT',    sov: Math.round(avgChatgpt),    sentiment: engineSentiment('gpt'),        trend: overallTrend },
      { name: 'Perplexity', sov: Math.round(avgPerplexity), sentiment: engineSentiment('perplexity'),  trend: overallTrend },
      { name: 'Claude',     sov: Math.round(avgClaude),     sentiment: engineSentiment('claude'),      trend: overallTrend },
      { name: 'Gemini',     sov: Math.round(avgGemini),     sentiment: engineSentiment('gemini'),      trend: overallTrend },
    ];

    const insights = buildInsights(keyword.trim(), rows, avgChatgpt, avgPerplexity, avgClaude, avgGemini, aggregateSov);

    return NextResponse.json({
      success: true,
      result: {
        keyword: keyword.trim(),
        models,
        aggregateSov,
        overallSentiment: sentiment,
        totalSignals: rows.length,
        insights,
      },
    });
  } catch (err: any) {
    console.error('geo-pulse error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
