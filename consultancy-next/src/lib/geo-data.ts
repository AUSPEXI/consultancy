import fs from 'fs';
import path from 'path';

export interface GeoRow {
  id: string;
  date: string;
  brand: string;
  domain: string;
  page_url: string;
  search_query: string;
  category: string;
  query_intent: string;
  semantic_cluster: string;
  ai_engine: string;
  model_version: string;
  is_cited: boolean;
  citation_rank: number | null;
  competing_citations_count: number;
  sov_score: number;
  sentiment: string;
  trend: string;
  content_score: number;
  entity_density_score: number;
  statistical_anchors_score: number;
  inverted_pyramid_score: number;
  days_since_published: number;
  content_type: string;
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
  user_tier: string;
  social_platform: string;
  platform_chatgpt: number;
  platform_perplexity: number;
  platform_claude: number;
  platform_gemini: number;
}

let _cache: GeoRow[] | null = null;

export function loadGeoData(): GeoRow[] {
  if (_cache) return _cache;
  const csvPath = path.join(process.cwd(), 'src', 'data', 'geo_synthetic_10000.csv');
  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  _cache = lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const vals = line.split(',');
      const o: Record<string, string> = {};
      headers.forEach((h, i) => { o[h] = (vals[i] ?? '').trim(); });
      return {
        id: o.id,
        date: o.date,
        brand: o.brand,
        domain: o.domain,
        page_url: o.page_url,
        search_query: o.search_query,
        category: o.category,
        query_intent: o.query_intent,
        semantic_cluster: o.semantic_cluster,
        ai_engine: o.ai_engine,
        model_version: o.model_version,
        is_cited: o.is_cited === 'true',
        citation_rank: o.citation_rank ? parseFloat(o.citation_rank) : null,
        competing_citations_count: parseFloat(o.competing_citations_count) || 0,
        sov_score: parseFloat(o.sov_score) || 0,
        sentiment: o.sentiment,
        trend: o.trend,
        content_score: parseFloat(o.content_score) || 0,
        entity_density_score: parseFloat(o.entity_density_score) || 0,
        statistical_anchors_score: parseFloat(o.statistical_anchors_score) || 0,
        inverted_pyramid_score: parseFloat(o.inverted_pyramid_score) || 0,
        days_since_published: parseFloat(o.days_since_published) || 0,
        content_type: o.content_type,
        entropy_score: parseFloat(o.entropy_score) || 0,
        competitor_name: o.competitor_name,
        competitor_sov: parseFloat(o.competitor_sov) || 0,
        decay_score: parseFloat(o.decay_score) || 0,
        decay_status: o.decay_status,
        trojan_horse_opportunity: o.trojan_horse_opportunity === 'true',
        risk_score: parseFloat(o.risk_score) || 0,
        z_score: parseFloat(o.z_score) || 0,
        drift_detected: o.drift_detected === 'true',
        ai_traffic: parseFloat(o.ai_traffic) || 0,
        ai_citations: parseFloat(o.ai_citations) || 0,
        user_tier: o.user_tier,
        social_platform: o.social_platform,
        platform_chatgpt: parseFloat(o.platform_chatgpt) || 0,
        platform_perplexity: parseFloat(o.platform_perplexity) || 0,
        platform_claude: parseFloat(o.platform_claude) || 0,
        platform_gemini: parseFloat(o.platform_gemini) || 0,
      } as GeoRow;
    });

  return _cache;
}

// ── Query helpers ─────────────────────────────────────────────────────────────

/** Match rows by brand name (case-insensitive). Falls back to full dataset sample. */
export function queryByBrand(brand: string, limit = 300): GeoRow[] {
  const data = loadGeoData();
  const q = brand.toLowerCase().trim();
  const exact = data.filter(r =>
    r.brand.toLowerCase().includes(q) || r.search_query.toLowerCase().includes(q)
  );
  return exact.length >= 20 ? exact.slice(0, limit) : data.slice(0, limit);
}

/** Match rows by competitor domain or name. Falls back to dataset sample. */
export function queryByCompetitor(input: string, limit = 200): GeoRow[] {
  const data = loadGeoData();
  // Strip protocol/www, take first segment
  const slug = input.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0].split('/')[0];
  const matches = data.filter(r => r.competitor_name.toLowerCase().includes(slug));
  return matches.length >= 10 ? matches.slice(0, limit) : data.slice(0, limit);
}

/** Match rows where search_query contains any word from the keyword. */
export function queryByKeyword(keyword: string, limit = 300): GeoRow[] {
  const data = loadGeoData();
  const words = keyword.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (!words.length) return data.slice(0, limit);
  const matches = data.filter(r =>
    words.some(w => r.search_query.toLowerCase().includes(w) || r.category.toLowerCase().includes(w))
  );
  return matches.length >= 20 ? matches.slice(0, limit) : data.slice(0, limit);
}

// ── Aggregate utilities ───────────────────────────────────────────────────────

export function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function dominantSentiment(rows: GeoRow[]): 'Positive' | 'Neutral' | 'Negative' {
  const counts: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
  for (const r of rows) if (r.sentiment in counts) counts[r.sentiment]++;
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Neutral') as any;
}

export function trendString(rows: GeoRow[]): string {
  const rising = rows.filter(r => r.trend === 'rising').length;
  const falling = rows.filter(r => r.trend === 'falling').length;
  const net = rising - falling;
  const pct = Math.round(Math.abs(net / Math.max(rows.length, 1)) * 25 * 10) / 10;
  return net >= 0 ? `+${pct}%` : `-${pct}%`;
}

export function dominantDecayStatus(rows: GeoRow[]): 'healthy' | 'decaying' | 'stale' {
  const counts: Record<string, number> = { healthy: 0, decaying: 0, stale: 0 };
  for (const r of rows) if (r.decay_status in counts) counts[r.decay_status]++;
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'healthy') as any;
}
