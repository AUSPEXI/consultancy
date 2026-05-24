export type AiEngine = 'ChatGPT' | 'Perplexity' | 'Claude' | 'Gemini';
export type Sentiment = 'Positive' | 'Neutral' | 'Negative';
export type DecayStatus = 'healthy' | 'decaying' | 'stale';
export type ContentType = 'blog' | 'sales' | 'technical';
export type UserTier = 'Free' | 'Basic' | 'Medium' | 'Premium';

export interface GeoSyntheticRecord {
  id: string;
  date: string;                        // ISO 8601 YYYY-MM-DD
  brand: string;
  domain: string;
  page_url: string;
  search_query: string;
  category: string;
  ai_engine: AiEngine;
  is_cited: boolean;
  citation_rank: number | null;        // 1-10, null if not cited
  sov_score: number;                   // 0-100 share of voice
  sentiment: Sentiment;
  trend: string;                       // e.g. "+4.2%"
  content_score: number;               // 0-100
  entity_density_score: number;        // 0-100
  statistical_anchors_score: number;   // 0-100
  inverted_pyramid_score: number;      // 0-100
  content_type: ContentType;
  competitor_name: string;
  competitor_sov: number;              // 0-100
  decay_score: number;                 // 0-100
  decay_status: DecayStatus;
  trojan_horse_opportunity: boolean;
  risk_score: number;                  // 0-100
  ai_traffic: number;                  // estimated sessions driven by AI
  ai_citations: number;                // total citation count
  entropy_score: number;               // 0-100 content uniqueness
  user_tier: UserTier;
  social_platform: string;
  platform_chatgpt: number;            // 0-100 SOV on ChatGPT
  platform_perplexity: number;         // 0-100 SOV on Perplexity
  platform_claude: number;             // 0-100 SOV on Claude
  platform_gemini: number;             // 0-100 SOV on Gemini
}
