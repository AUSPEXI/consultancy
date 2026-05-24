/**
 * Phase 2: Perplexity GEO Data Collector
 *
 * Queries the Perplexity API for real (query, response_text, citation_outcome) triplets
 * and augments the synthetic CSV schema with 8 response-level fields.
 *
 * Usage:
 *   PERPLEXITY_API_KEY=pplx-xxx TARGET_BRAND="YourBrand" npx tsx scripts/collect-perplexity-data.ts
 *
 * Optional env vars:
 *   BATCH_SIZE          - queries per run (default: 50)
 *   OUTPUT_FILE         - output JSONL path (default: public/data/geo_phase2.jsonl)
 *   QUERIES_FILE        - JSON array of query strings (default: uses built-in GEO query set)
 *   MODEL               - Perplexity model (default: sonar)
 *   DELAY_MS            - ms between requests (default: 1200)
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_KEY = process.env.PERPLEXITY_API_KEY;
const TARGET_BRAND = process.env.TARGET_BRAND || '';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10);
const OUTPUT_FILE = process.env.OUTPUT_FILE || path.join(process.cwd(), 'public', 'data', 'geo_phase2.jsonl');
const QUERIES_FILE = process.env.QUERIES_FILE || '';
const MODEL = process.env.MODEL || 'sonar';
const DELAY_MS = parseInt(process.env.DELAY_MS || '1200', 10);

if (!API_KEY) {
  console.error('Error: PERPLEXITY_API_KEY is not set.');
  process.exit(1);
}

if (!TARGET_BRAND) {
  console.error('Error: TARGET_BRAND is not set. Set it to the real brand name you are tracking.');
  process.exit(1);
}

// ─── Built-in GEO query set ───────────────────────────────────────────────────

const DEFAULT_QUERIES = [
  'best enterprise CRM software 2025',
  'top AI SEO tools for content teams',
  'how to improve brand visibility in AI responses',
  'best tools for generative engine optimisation',
  'ChatGPT vs Perplexity for business research',
  'what is share of voice in AI search',
  'how do LLMs decide which brands to mention',
  'best SaaS tools for content marketing',
  'AI citation optimisation strategies',
  'how to get cited by ChatGPT and Perplexity',
  'best tools for tracking AI brand mentions',
  'enterprise content strategy for 2025',
  'how to rank in AI-generated answers',
  'top platforms for brand monitoring AI',
  'semantic SEO vs traditional SEO 2025',
  'how to measure share of voice in LLMs',
  'best AI answer engines for research',
  'content scoring tools for SEO teams',
  'how to create high-entropy content for AI',
  'Perplexity AI best practices for brands',
];

// ─── Confidence language patterns ─────────────────────────────────────────────

const HIGH_CONFIDENCE = ['definitely', 'certainly', 'clearly', 'undoubtedly', 'the best', 'top choice', 'leading', 'widely regarded'];
const LOW_CONFIDENCE = ['might', 'may', 'could', 'perhaps', 'possibly', 'some users', 'depending on', 'it depends'];

function detectConfidenceLanguage(text: string): 'high' | 'medium' | 'low' {
  const lower = text.toLowerCase();
  const high = HIGH_CONFIDENCE.filter(w => lower.includes(w)).length;
  const low = LOW_CONFIDENCE.filter(w => lower.includes(w)).length;
  if (high > low) return 'high';
  if (low > high) return 'low';
  return 'medium';
}

// ─── Brand position in response ───────────────────────────────────────────────

function getBrandPosition(text: string, brand: string): 'first_third' | 'middle_third' | 'last_third' | 'not_present' {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(brand.toLowerCase());
  if (idx === -1) return 'not_present';
  const fraction = idx / text.length;
  if (fraction < 0.33) return 'first_third';
  if (fraction < 0.67) return 'middle_third';
  return 'last_third';
}

// ─── Framing type ─────────────────────────────────────────────────────────────

function detectFramingType(text: string, brand: string): 'leader' | 'challenger' | 'alternative' | 'not_mentioned' {
  const lower = text.toLowerCase();
  const brandLower = brand.toLowerCase();
  if (!lower.includes(brandLower)) return 'not_mentioned';

  // Look at tokens near brand mention
  const idx = lower.indexOf(brandLower);
  const window = lower.slice(Math.max(0, idx - 80), idx + 80);

  if (/\b(best|top|leading|#1|number one|most popular|market leader)\b/.test(window)) return 'leader';
  if (/\b(alternative|instead|compared to|versus|vs\.?|rather than|competitor)\b/.test(window)) return 'alternative';
  if (/\b(also|another option|can also|worth considering|growing|emerging)\b/.test(window)) return 'challenger';
  return 'challenger';
}

// ─── Citation verbatim ────────────────────────────────────────────────────────

function extractCitationVerbatim(text: string, brand: string): string {
  const brandLower = brand.toLowerCase();
  const sentences = text.split(/(?<=[.!?])\s+/);
  const match = sentences.find(s => s.toLowerCase().includes(brandLower));
  return match ? match.trim().slice(0, 300) : '';
}

// ─── Co-cited brands ──────────────────────────────────────────────────────────

const KNOWN_BRANDS = [
  'HubSpot', 'Salesforce', 'SEMrush', 'Ahrefs', 'Moz', 'BrightEdge', 'Conductor',
  'Jasper', 'Copy.ai', 'Surfer SEO', 'Clearscope', 'MarketMuse', 'Frase',
  'Perplexity', 'ChatGPT', 'Claude', 'Gemini', 'Bing', 'Google',
  'Sprout Social', 'Buffer', 'Hootsuite', 'Brandwatch', 'Mention',
];

function extractCoCitedBrands(text: string, targetBrand: string): string[] {
  const found: string[] = [];
  for (const brand of KNOWN_BRANDS) {
    if (brand.toLowerCase() === targetBrand.toLowerCase()) continue;
    if (text.toLowerCase().includes(brand.toLowerCase())) {
      found.push(brand);
    }
  }
  return found.slice(0, 8);
}

// ─── Main collector ───────────────────────────────────────────────────────────

interface Phase2Record {
  query: string;
  ai_engine: 'Perplexity';
  model_version: string;
  is_cited: boolean;
  brand_position_in_response: 'first_third' | 'middle_third' | 'last_third' | 'not_present';
  framing_type: 'leader' | 'challenger' | 'alternative' | 'not_mentioned';
  co_cited_brands: string[];
  confidence_language: 'high' | 'medium' | 'low';
  response_word_count: number;
  query_answered_fully: boolean;
  response_text: string;
  citation_verbatim: string;
  citations: string[];
  collected_at: string;
}

async function collectRecord(
  client: OpenAI,
  query: string,
  brand: string
): Promise<Phase2Record> {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: query }],
  } as any);

  const content = (response.choices[0]?.message?.content) || '';
  const citations: string[] = (response as any).citations || [];
  const wordCount = content.trim().split(/\s+/).length;
  const isCited = content.toLowerCase().includes(brand.toLowerCase());

  return {
    query,
    ai_engine: 'Perplexity',
    model_version: MODEL,
    is_cited: isCited,
    brand_position_in_response: getBrandPosition(content, brand),
    framing_type: detectFramingType(content, brand),
    co_cited_brands: extractCoCitedBrands(content, brand),
    confidence_language: detectConfidenceLanguage(content),
    response_word_count: wordCount,
    query_answered_fully: wordCount > 80 && !content.toLowerCase().includes("i don't know"),
    response_text: content,
    citation_verbatim: extractCitationVerbatim(content, brand),
    citations,
    collected_at: new Date().toISOString(),
  };
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const client = new OpenAI({
    apiKey: API_KEY,
    baseURL: 'https://api.perplexity.ai',
  });

  // Load queries
  let queries: string[];
  if (QUERIES_FILE && fs.existsSync(QUERIES_FILE)) {
    queries = JSON.parse(fs.readFileSync(QUERIES_FILE, 'utf-8'));
    console.log(`Loaded ${queries.length} queries from ${QUERIES_FILE}`);
  } else {
    queries = DEFAULT_QUERIES;
    console.log(`Using built-in query set (${queries.length} queries)`);
  }

  const batch = queries.slice(0, BATCH_SIZE);
  console.log(`Collecting ${batch.length} records for brand: "${TARGET_BRAND}"`);
  console.log(`Output: ${OUTPUT_FILE}\n`);

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

  const stream = fs.createWriteStream(OUTPUT_FILE, { flags: 'a' });
  let success = 0;
  let failed = 0;

  for (let i = 0; i < batch.length; i++) {
    const query = batch[i];
    process.stdout.write(`[${i + 1}/${batch.length}] "${query.slice(0, 60)}" ... `);

    try {
      const record = await collectRecord(client, query, TARGET_BRAND);
      stream.write(JSON.stringify(record) + '\n');
      console.log(`${record.is_cited ? '✓ cited' : '— not cited'} | ${record.response_word_count}w | ${record.framing_type}`);
      success++;
    } catch (err: any) {
      console.log(`ERROR: ${err.message}`);
      failed++;
    }

    if (i < batch.length - 1) await sleep(DELAY_MS);
  }

  stream.end();
  console.log(`\nDone. ${success} records written, ${failed} failed.`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`\nNext step: load ${OUTPUT_FILE} into your SLM training pipeline.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
