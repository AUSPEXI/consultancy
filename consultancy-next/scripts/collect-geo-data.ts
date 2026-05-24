/**
 * Phase 2: GEO Data Collector (Gemini)
 *
 * Queries Gemini Flash to generate realistic (query, response_text, citation_outcome)
 * triplets and augments the synthetic schema with 8 response-level fields.
 *
 * Usage:
 *   GEMINI_API_KEY=your-key TARGET_BRAND="YourBrand" npx tsx scripts/collect-geo-data.ts
 *
 * Optional env vars:
 *   BATCH_SIZE    - queries per run (default: 50)
 *   OUTPUT_FILE   - output JSONL path (default: public/data/geo_phase2.jsonl)
 *   QUERIES_FILE  - path to JSON array of query strings (default: built-in GEO set)
 *   MODEL         - Gemini model (default: gemini-2.0-flash)
 *   DELAY_MS      - ms between requests (default: 800)
 *
 * Note: Gemini generates realistic AI-style responses but is not search-grounded.
 * For production training data, replace with real LLM API calls (Perplexity sonar,
 * ChatGPT browsing, etc.) once you have the relevant API subscriptions.
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const TARGET_BRAND = process.env.TARGET_BRAND || '';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10);
const OUTPUT_FILE = process.env.OUTPUT_FILE
  || path.join(process.cwd(), 'public', 'data', 'geo_phase2.jsonl');
const QUERIES_FILE = process.env.QUERIES_FILE || '';
const MODEL = process.env.MODEL || 'gemini-2.0-flash';
const DELAY_MS = parseInt(process.env.DELAY_MS || '800', 10);

if (!API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set.');
  process.exit(1);
}
if (!TARGET_BRAND) {
  console.error('Error: TARGET_BRAND is not set. e.g. TARGET_BRAND="Auspexi"');
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

const HIGH_CONFIDENCE_WORDS = ['definitely', 'certainly', 'clearly', 'undoubtedly',
  'the best', 'top choice', 'leading', 'widely regarded', 'most popular'];
const LOW_CONFIDENCE_WORDS = ['might', 'may', 'could', 'perhaps', 'possibly',
  'some users', 'depending on', "it depends", 'varies'];

function detectConfidenceLanguage(text: string): 'high' | 'medium' | 'low' {
  const lower = text.toLowerCase();
  const high = HIGH_CONFIDENCE_WORDS.filter(w => lower.includes(w)).length;
  const low = LOW_CONFIDENCE_WORDS.filter(w => lower.includes(w)).length;
  if (high > low) return 'high';
  if (low > high) return 'low';
  return 'medium';
}

// ─── Brand position ───────────────────────────────────────────────────────────

function getBrandPosition(text: string, brand: string): 'first_third' | 'middle_third' | 'last_third' | 'not_present' {
  const idx = text.toLowerCase().indexOf(brand.toLowerCase());
  if (idx === -1) return 'not_present';
  const fraction = idx / text.length;
  if (fraction < 0.33) return 'first_third';
  if (fraction < 0.67) return 'middle_third';
  return 'last_third';
}

// ─── Framing type ─────────────────────────────────────────────────────────────

function detectFramingType(text: string, brand: string): 'leader' | 'challenger' | 'alternative' | 'not_mentioned' {
  const lower = text.toLowerCase();
  if (!lower.includes(brand.toLowerCase())) return 'not_mentioned';
  const idx = lower.indexOf(brand.toLowerCase());
  const window = lower.slice(Math.max(0, idx - 100), idx + 100);
  if (/\b(best|top|leading|#1|number one|most popular|market leader)\b/.test(window)) return 'leader';
  if (/\b(alternative|instead|rather than|versus|vs\.?|competitor|compared to)\b/.test(window)) return 'alternative';
  return 'challenger';
}

// ─── Citation verbatim ────────────────────────────────────────────────────────

function extractCitationVerbatim(text: string, brand: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const match = sentences.find(s => s.toLowerCase().includes(brand.toLowerCase()));
  return match ? match.trim().slice(0, 300) : '';
}

// ─── Co-cited brands ──────────────────────────────────────────────────────────

const KNOWN_BRANDS = [
  'HubSpot', 'Salesforce', 'SEMrush', 'Ahrefs', 'Moz', 'BrightEdge',
  'Jasper', 'Surfer SEO', 'Clearscope', 'MarketMuse', 'Frase',
  'Perplexity', 'ChatGPT', 'Claude', 'Gemini', 'Bing', 'Google',
  'Sprout Social', 'Brandwatch', 'Mention', 'Hootsuite', 'Buffer',
];

function extractCoCitedBrands(text: string, targetBrand: string): string[] {
  return KNOWN_BRANDS
    .filter(b => b.toLowerCase() !== targetBrand.toLowerCase()
      && text.toLowerCase().includes(b.toLowerCase()))
    .slice(0, 8);
}

// ─── Gemini call ──────────────────────────────────────────────────────────────

interface Phase2Record {
  query: string;
  ai_engine: string;
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
  collected_at: string;
}

async function collectRecord(
  genAI: GoogleGenAI,
  query: string,
  brand: string,
): Promise<Phase2Record> {
  // Ask Gemini to simulate how an AI assistant would answer this query
  const prompt = `You are simulating how an AI assistant (like Perplexity or ChatGPT) would answer the following user query. Write a realistic, helpful 3-5 sentence response as if you are that AI assistant answering with up-to-date knowledge. Mention specific tools, brands, or platforms where appropriate.\n\nUser query: "${query}"`;

  const result = await (genAI as any).models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { generationConfig: { temperature: 0.9 } },
  });

  const content: string = result.text || '';
  const wordCount = content.trim().split(/\s+/).length;
  const isCited = content.toLowerCase().includes(brand.toLowerCase());

  return {
    query,
    ai_engine: 'Gemini',
    model_version: MODEL,
    is_cited: isCited,
    brand_position_in_response: getBrandPosition(content, brand),
    framing_type: detectFramingType(content, brand),
    co_cited_brands: extractCoCitedBrands(content, brand),
    confidence_language: detectConfidenceLanguage(content),
    response_word_count: wordCount,
    query_answered_fully: wordCount > 60,
    response_text: content,
    citation_verbatim: extractCitationVerbatim(content, brand),
    collected_at: new Date().toISOString(),
  };
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const genAI = new GoogleGenAI({ apiKey: API_KEY });

  let queries: string[];
  if (QUERIES_FILE && fs.existsSync(QUERIES_FILE)) {
    queries = JSON.parse(fs.readFileSync(QUERIES_FILE, 'utf-8'));
    console.log(`Loaded ${queries.length} queries from ${QUERIES_FILE}`);
  } else {
    queries = DEFAULT_QUERIES;
    console.log(`Using built-in GEO query set (${queries.length} queries)`);
  }

  const batch = queries.slice(0, BATCH_SIZE);
  console.log(`Collecting ${batch.length} records for brand: "${TARGET_BRAND}"`);
  console.log(`Model: ${MODEL} | Output: ${OUTPUT_FILE}\n`);

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  const stream = fs.createWriteStream(OUTPUT_FILE, { flags: 'a' });

  let cited = 0;
  let failed = 0;

  for (let i = 0; i < batch.length; i++) {
    const query = batch[i];
    process.stdout.write(`[${i + 1}/${batch.length}] "${query.slice(0, 55)}" ... `);

    try {
      const record = await collectRecord(genAI, query, TARGET_BRAND);
      stream.write(JSON.stringify(record) + '\n');
      if (record.is_cited) cited++;
      console.log(`${record.is_cited ? '✓ cited' : '— not cited'} | ${record.response_word_count}w | ${record.framing_type}`);
    } catch (err: any) {
      console.log(`ERROR: ${err.message}`);
      failed++;
    }

    if (i < batch.length - 1) await sleep(DELAY_MS);
  }

  stream.end();
  const total = batch.length - failed;
  console.log(`\nDone. ${total} records written (${cited} cited, ${total - cited} not cited), ${failed} failed.`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch(err => { console.error(err); process.exit(1); });
