export type AiEngine = 'ChatGPT' | 'Perplexity' | 'Claude' | 'Gemini';
export type Sentiment = 'Positive' | 'Neutral' | 'Negative';
export type DecayStatus = 'healthy' | 'decaying' | 'stale';
export type ContentType = 'blog' | 'sales' | 'technical';
export type UserTier = 'Free' | 'Basic' | 'Medium' | 'Premium';
export type QueryIntent = 'informational' | 'commercial' | 'navigational' | 'transactional';
export type SemanticCluster =
  | 'enterprise-trusted'
  | 'cost-leader'
  | 'thought-leader'
  | 'technical-authority'
  | 'brand-advocate'
  | 'challenger'
  | 'niche-specialist';

export interface GeoSyntheticRecord {
  // Identity
  id: string;
  date: string;                          // ISO 8601 YYYY-MM-DD
  brand: string;
  domain: string;
  page_url: string;

  // Search context
  search_query: string;
  category: string;
  query_intent: QueryIntent;             // informational / commercial / navigational / transactional
  semantic_cluster: SemanticCluster;     // brand positioning cluster — input feature for SLM

  // AI engine
  ai_engine: AiEngine;
  model_version: string;                 // e.g. gpt-4o-2025-03, claude-3-5-sonnet

  // Citation
  is_cited: boolean;
  citation_rank: number | null;          // 1-10, null if not cited
  competing_citations_count: number;     // other brands cited in same response

  // GeoPulse / SOV
  sov_score: number;                     // 0-100 aggregate share of voice
  sentiment: Sentiment;
  trend: string;                         // e.g. "+4.2%"
  platform_chatgpt: number;             // 0-100 SOV on ChatGPT
  platform_perplexity: number;
  platform_claude: number;
  platform_gemini: number;

  // ContentScorer
  content_score: number;                 // 0-100
  entity_density_score: number;          // 0-100
  statistical_anchors_score: number;     // 0-100
  inverted_pyramid_score: number;        // 0-100
  days_since_published: number;          // content freshness signal
  content_type: ContentType;
  entropy_score: number;                 // 0-100 content uniqueness

  // Competitors
  competitor_name: string;
  competitor_sov: number;                // 0-100
  decay_score: number;                   // 0-100
  decay_status: DecayStatus;
  trojan_horse_opportunity: boolean;

  // BrandMonitor
  risk_score: number;                    // 0-100
  z_score: number;                       // std deviations from brand's risk baseline
  drift_detected: boolean;              // |z_score| > 2

  // AI Traffic
  ai_traffic: number;                    // estimated sessions from AI referral
  ai_citations: number;                  // total citation count across responses

  // User
  user_tier: UserTier;
  social_platform: string;
}
