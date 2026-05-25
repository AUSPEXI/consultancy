import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface GeoRow {
  brand: string;
  ai_engine: string;
  model_version: string;
  is_cited: boolean;
  citation_rank: number;
  sov_score: number;
  sentiment: string;
  content_score: number;
  entity_density_score: number;
  statistical_anchors_score: number;
  inverted_pyramid_score: number;
  entropy_score: number;
  competitor_name: string;
  competitor_sov: number;
  decay_score: number;
  decay_status: string;
  trojan_horse_opportunity: boolean;
  risk_score: number;
  z_score: number;
  drift_detected: boolean;
  ai_traffic: number;
  ai_citations: number;
  platform_chatgpt: number;
  platform_perplexity: number;
  platform_claude: number;
  platform_gemini: number;
  category: string;
  query_intent: string;
  semantic_cluster: string;
  search_query: string;
  rowIndex: number;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuotes = !inQuotes; }
    else if (line[i] === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
    else { current += line[i]; }
  }
  values.push(current.trim());
  return values;
}

let _cache: ReturnType<typeof aggregate> | null = null;

function aggregate(rows: GeoRow[]) {
  const total = rows.length;
  const citedCount = rows.filter(r => r.is_cited).length;

  // SOV by brand (bar chart)
  const brandMap: Record<string, { sov: number; n: number }> = {};
  rows.forEach(r => {
    if (!brandMap[r.brand]) brandMap[r.brand] = { sov: 0, n: 0 };
    brandMap[r.brand].sov += r.sov_score;
    brandMap[r.brand].n++;
  });
  const sovByBrand = Object.entries(brandMap)
    .map(([brand, d]) => ({ brand, sov: Math.round(d.sov / d.n * 10) / 10 }))
    .sort((a, b) => b.sov - a.sov);

  // SOV time series per brand (monthly, 18 months)
  const endDate = new Date('2026-05-24');
  const startDate = new Date('2024-11-24');
  const monthMap: Record<string, Record<string, { sov: number; n: number }>> = {};
  rows.forEach(r => {
    const t = startDate.getTime() + (r.rowIndex / total) * (endDate.getTime() - startDate.getTime());
    const d = new Date(t);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[month]) monthMap[month] = {};
    if (!monthMap[month][r.brand]) monthMap[month][r.brand] = { sov: 0, n: 0 };
    monthMap[month][r.brand].sov += r.sov_score;
    monthMap[month][r.brand].n++;
  });
  const brands = Object.keys(brandMap);
  const sovTimeSeries = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, byBrand]) => {
      const point: Record<string, any> = { month: month.substring(5) + '/' + month.substring(2, 4) };
      brands.forEach(br => {
        point[br] = byBrand[br] ? Math.round(byBrand[br].sov / byBrand[br].n) : null;
      });
      return point;
    });

  // Citation rate by engine
  const engineMap: Record<string, { cited: number; total: number }> = {};
  rows.forEach(r => {
    if (!engineMap[r.ai_engine]) engineMap[r.ai_engine] = { cited: 0, total: 0 };
    engineMap[r.ai_engine].total++;
    if (r.is_cited) engineMap[r.ai_engine].cited++;
  });
  const citationByEngine = Object.entries(engineMap).map(([engine, d]) => ({
    engine,
    rate: Math.round(d.cited / d.total * 100),
    total: d.total,
  })).sort((a, b) => b.rate - a.rate);

  // Platform scores (average across all brands)
  const platforms = ['ChatGPT', 'Perplexity', 'Claude', 'Gemini'];
  const platformTotals = { chatgpt: 0, perplexity: 0, claude: 0, gemini: 0 };
  rows.forEach(r => {
    platformTotals.chatgpt += r.platform_chatgpt;
    platformTotals.perplexity += r.platform_perplexity;
    platformTotals.claude += r.platform_claude;
    platformTotals.gemini += r.platform_gemini;
  });
  const platformScores = [
    { platform: 'ChatGPT', score: Math.round(platformTotals.chatgpt / total) },
    { platform: 'Perplexity', score: Math.round(platformTotals.perplexity / total) },
    { platform: 'Claude', score: Math.round(platformTotals.claude / total) },
    { platform: 'Gemini', score: Math.round(platformTotals.gemini / total) },
  ];

  // Platform scores per brand
  const platformByBrand: Record<string, Record<string, { total: number; n: number }>> = {};
  rows.forEach(r => {
    if (!platformByBrand[r.brand]) {
      platformByBrand[r.brand] = { chatgpt: { total: 0, n: 0 }, perplexity: { total: 0, n: 0 }, claude: { total: 0, n: 0 }, gemini: { total: 0, n: 0 } };
    }
    platformByBrand[r.brand].chatgpt.total += r.platform_chatgpt;
    platformByBrand[r.brand].chatgpt.n++;
    platformByBrand[r.brand].perplexity.total += r.platform_perplexity;
    platformByBrand[r.brand].perplexity.n++;
    platformByBrand[r.brand].claude.total += r.platform_claude;
    platformByBrand[r.brand].claude.n++;
    platformByBrand[r.brand].gemini.total += r.platform_gemini;
    platformByBrand[r.brand].gemini.n++;
  });
  const platformByBrandSummary = Object.entries(platformByBrand).map(([brand, p]) => ({
    brand,
    ChatGPT: Math.round(p.chatgpt.total / p.chatgpt.n),
    Perplexity: Math.round(p.perplexity.total / p.perplexity.n),
    Claude: Math.round(p.claude.total / p.claude.n),
    Gemini: Math.round(p.gemini.total / p.gemini.n),
  }));

  // Competitor summary
  const compMap: Record<string, { sov: number; decay: number; n: number; statuses: Record<string, number>; trojan: number }> = {};
  rows.forEach(r => {
    if (!compMap[r.competitor_name]) compMap[r.competitor_name] = { sov: 0, decay: 0, n: 0, statuses: {}, trojan: 0 };
    compMap[r.competitor_name].sov += r.competitor_sov;
    compMap[r.competitor_name].decay += r.decay_score;
    compMap[r.competitor_name].n++;
    compMap[r.competitor_name].statuses[r.decay_status] = (compMap[r.competitor_name].statuses[r.decay_status] || 0) + 1;
    if (r.trojan_horse_opportunity) compMap[r.competitor_name].trojan++;
  });
  const competitors = Object.entries(compMap).map(([name, d]) => {
    const dominant = Object.entries(d.statuses).sort(([, a], [, b]) => b - a)[0][0];
    return {
      name,
      avg_sov: Math.round(d.sov / d.n * 10) / 10,
      avg_decay: Math.round(d.decay / d.n * 10) / 10,
      decay_status: dominant,
      trojan_pct: Math.round(d.trojan / d.n * 100),
    };
  }).sort((a, b) => b.avg_decay - a.avg_decay);

  // Drift alerts (top 25 by |z_score|)
  const driftAlerts = rows
    .filter(r => r.drift_detected)
    .sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score))
    .slice(0, 25)
    .map(r => ({
      brand: r.brand,
      ai_engine: r.ai_engine,
      z_score: Math.round(r.z_score * 100) / 100,
      risk_score: Math.round(r.risk_score),
      sentiment: r.sentiment,
      category: r.category,
    }));

  // Sentiment distribution
  const sentMap: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
  rows.forEach(r => { sentMap[r.sentiment] = (sentMap[r.sentiment] || 0) + 1; });
  const sentimentDist = Object.entries(sentMap).map(([sentiment, count]) => ({ sentiment, count, pct: Math.round(count / total * 100) }));

  // Content scores by brand
  const csMap: Record<string, { cs: number; ed: number; sa: number; ip: number; en: number; n: number }> = {};
  rows.forEach(r => {
    if (!csMap[r.brand]) csMap[r.brand] = { cs: 0, ed: 0, sa: 0, ip: 0, en: 0, n: 0 };
    csMap[r.brand].cs += r.content_score;
    csMap[r.brand].ed += r.entity_density_score;
    csMap[r.brand].sa += r.statistical_anchors_score;
    csMap[r.brand].ip += r.inverted_pyramid_score;
    csMap[r.brand].en += r.entropy_score;
    csMap[r.brand].n++;
  });
  const contentScores = Object.entries(csMap).map(([brand, d]) => ({
    brand,
    content_score: Math.round(d.cs / d.n),
    entity_density: Math.round(d.ed / d.n),
    statistical_anchors: Math.round(d.sa / d.n),
    inverted_pyramid: Math.round(d.ip / d.n),
    entropy: Math.round(d.en / d.n),
  })).sort((a, b) => b.content_score - a.content_score);

  return {
    stats: {
      total_rows: total,
      brands: brands.length,
      engines: Object.keys(engineMap).length,
      citation_rate: Math.round(citedCount / total * 100 * 10) / 10,
      avg_sov: Math.round(rows.reduce((s, r) => s + r.sov_score, 0) / total * 10) / 10,
      drift_count: rows.filter(r => r.drift_detected).length,
      trojan_count: rows.filter(r => r.trojan_horse_opportunity).length,
    },
    brands,
    sovByBrand,
    sovTimeSeries,
    citationByEngine,
    platformScores,
    platformByBrand: platformByBrandSummary,
    competitors,
    driftAlerts,
    sentimentDist,
    contentScores,
  };
}

export async function GET() {
  try {
    if (_cache) {
      return NextResponse.json(_cache, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      });
    }

    const csvPath = path.join(process.cwd(), 'public', 'data', 'geo_data.csv');
    const text = fs.readFileSync(csvPath, 'utf-8');
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const rows: GeoRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const vals = parseCSVLine(line);
      if (vals.length !== headers.length) continue;
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx]; });

      rows.push({
        brand: obj.brand,
        ai_engine: obj.ai_engine,
        model_version: obj.model_version,
        is_cited: obj.is_cited === 'true',
        citation_rank: parseFloat(obj.citation_rank) || 0,
        sov_score: parseFloat(obj.sov_score) || 0,
        sentiment: obj.sentiment,
        content_score: parseFloat(obj.content_score) || 0,
        entity_density_score: parseFloat(obj.entity_density_score) || 0,
        statistical_anchors_score: parseFloat(obj.statistical_anchors_score) || 0,
        inverted_pyramid_score: parseFloat(obj.inverted_pyramid_score) || 0,
        entropy_score: parseFloat(obj.entropy_score) || 0,
        competitor_name: obj.competitor_name,
        competitor_sov: parseFloat(obj.competitor_sov) || 0,
        decay_score: parseFloat(obj.decay_score) || 0,
        decay_status: obj.decay_status,
        trojan_horse_opportunity: obj.trojan_horse_opportunity === 'true',
        risk_score: parseFloat(obj.risk_score) || 0,
        z_score: parseFloat(obj.z_score) || 0,
        drift_detected: obj.drift_detected === 'true',
        ai_traffic: parseFloat(obj.ai_traffic) || 0,
        ai_citations: parseFloat(obj.ai_citations) || 0,
        platform_chatgpt: parseFloat(obj.platform_chatgpt) || 0,
        platform_perplexity: parseFloat(obj.platform_perplexity) || 0,
        platform_claude: parseFloat(obj.platform_claude) || 0,
        platform_gemini: parseFloat(obj.platform_gemini) || 0,
        category: obj.category,
        query_intent: obj.query_intent,
        semantic_cluster: obj.semantic_cluster,
        search_query: obj.search_query,
        rowIndex: i,
      });
    }

    _cache = aggregate(rows);
    return NextResponse.json(_cache, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (err) {
    console.error('[geo-data]', err);
    return NextResponse.json({ error: 'Failed to load dataset' }, { status: 500 });
  }
}
