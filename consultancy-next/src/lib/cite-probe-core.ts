import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

// Shared citation-probe engine. Single source of truth for both the user-facing
// /api/cite-probe route and the scheduled /api/cron/brand-probe route, so the
// probe logic never drifts between manual and automated runs.

export type PlatformKey = 'gemini' | 'chatgpt' | 'perplexity' | 'claude';
export const ALL_ENGINES: PlatformKey[] = ['gemini', 'chatgpt', 'perplexity', 'claude'];

export interface PlatformResult {
  cited: boolean;
  accurate: boolean;
  misinformation: string | null;
  excerpt: string | null;
  error?: string;
  skipped?: boolean;
}

// Build 7 brand-and-keyword-specific queries so the probe is relevant to the actual client
export function buildQueries(brand: string, _domain: string, keywords: string[]): string[] {
  const kws = keywords.filter(Boolean);
  const k0 = kws[0] || 'generative engine optimization';
  const k1 = kws[1] || 'AI search visibility';
  const k2 = kws[2] || 'brand citations in AI';

  return [
    `What are the best tools for ${k0}?`,
    `How do I get my brand cited by AI like ChatGPT and Perplexity?`,
    `What companies specialize in ${k1}?`,
    `How do I optimize content to appear in AI-generated answers?`,
    brand ? `What is ${brand} and what do they specialise in?` : `What is generative engine optimization and who offers it?`,
    brand ? `How can ${brand} help with ${k2}?` : `How can brands increase their share of voice in AI responses?`,
    `Best software for tracking AI citation and brand mentions in LLMs?`,
  ];
}

function extractKeywords(statement: string): string[] {
  const STOP_WORDS = new Set([
    'the', 'and', 'for', 'are', 'this', 'that', 'with', 'they', 'have', 'from',
    'your', 'been', 'were', 'said', 'each', 'which', 'their', 'will', 'about',
    'would', 'there', 'could', 'other', 'into', 'more', 'also', 'than', 'them',
    'then', 'some', 'these', 'when', 'what', 'where', 'who', 'how', 'its', 'but',
    'not', 'any', 'can', 'our', 'was', 'has', 'had', 'his', 'her', 'all',
  ]);
  return statement
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
}

export function checkCitation(
  response: string,
  brand: string,
  domain: string,
  knownFalses: string[] = [],
): { cited: boolean; accurate: boolean; misinformation: string | null; excerpt: string | null } {
  const lower = response.toLowerCase();
  const brandLower = brand.toLowerCase();
  const domainLower = domain.toLowerCase().replace(/^https?:\/\//, '');

  const NEGATIVE_PATTERNS = [
    "couldn't find any information", "could not find any information",
    "don't have any information", "do not have any information",
    "no information about", "not familiar with", "not in my knowledge",
    "outside my knowledge", "i cannot find", "i can't find",
    "unable to find information", "doesn't appear in my", "does not appear in my",
    "isn't a company", "is not a company", "let me imagine", "let's imagine",
    "hypothetically", "as a hypothetical", "i'll assume", "i will assume",
  ];

  const hasNegative = NEGATIVE_PATTERNS.some(p => lower.includes(p));
  const mentionsBrand = lower.includes(brandLower) || lower.includes(domainLower);

  if (!mentionsBrand || hasNegative) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null };
  }

  const sentences = response.split(/(?<=[.!?])\s+/);
  const match = sentences.find(s =>
    s.toLowerCase().includes(brandLower) || s.toLowerCase().includes(domainLower)
  );

  const NEGATION_WORDS = [
    " not ", " no ", "isn't", "aren't", "doesn't", "don't", "never",
    "unrelated", "unlike", "different from", "separate from", "distinct",
    "rather than", "instead of", "as opposed to",
  ];
  let misinformationSnippet: string | null = null;
  if (knownFalses.length > 0) {
    const brandSentences = sentences.filter(s => {
      const sl = s.toLowerCase();
      return sl.includes(brandLower) || (domainLower && sl.includes(domainLower));
    });
    for (const falseStmt of knownFalses) {
      const keywords = extractKeywords(falseStmt);
      if (keywords.length < 2) continue;
      const matchThreshold = Math.max(2, Math.floor(keywords.length * 0.4));
      for (const sentence of brandSentences) {
        const sl = sentence.toLowerCase();
        if (NEGATION_WORDS.some(neg => sl.includes(neg))) continue;
        const matchCount = keywords.filter(kw => sl.includes(kw)).length;
        if (matchCount >= matchThreshold) {
          misinformationSnippet = sentence;
          break;
        }
      }
      if (misinformationSnippet) break;
    }
  }

  return {
    cited: true,
    accurate: misinformationSnippet === null,
    misinformation: misinformationSnippet,
    excerpt: match || null,
  };
}

const SKIPPED: PlatformResult = { cited: false, accurate: true, misinformation: null, excerpt: null, skipped: true };

async function probeGemini(query: string, brand: string, domain: string, knownFalses: string[]): Promise<PlatformResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) return SKIPPED;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: { temperature: 0.3, maxOutputTokens: 600 },
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return checkCitation(text, brand, domain, knownFalses);
  } catch (e: any) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null, error: e.message };
  }
}

async function probeChatGPT(query: string, brand: string, domain: string, knownFalses: string[]): Promise<PlatformResult> {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) return SKIPPED;
  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: query }],
      max_tokens: 600,
      temperature: 0.3,
    });
    const text = response.choices[0]?.message?.content || '';
    return checkCitation(text, brand, domain, knownFalses);
  } catch (e: any) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null, error: e.message };
  }
}

async function probePerplexity(query: string, brand: string, domain: string, knownFalses: string[]): Promise<PlatformResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY || '';
  if (!apiKey) return SKIPPED;
  try {
    const client = new OpenAI({ apiKey, baseURL: 'https://api.perplexity.ai' });
    const response = await client.chat.completions.create({
      model: 'sonar',
      messages: [{ role: 'user', content: query }],
      max_tokens: 600,
    } as any);
    const text = response.choices[0]?.message?.content || '';
    return checkCitation(text, brand, domain, knownFalses);
  } catch (e: any) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null, error: e.message };
  }
}

async function probeClaude(query: string, brand: string, domain: string, knownFalses: string[]): Promise<PlatformResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return SKIPPED;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: query }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    return checkCitation(text, brand, domain, knownFalses);
  } catch (e: any) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null, error: e.message };
  }
}

// Probe one query across the requested engines. Engines not in `engines` are
// returned as skipped without making (or paying for) an API call.
async function probeQuery(
  query: string, brand: string, domain: string, knownFalses: string[], engines: Set<PlatformKey>,
): Promise<Record<PlatformKey, PlatformResult>> {
  const [gemini, chatgpt, perplexity, claude] = await Promise.all([
    engines.has('gemini') ? probeGemini(query, brand, domain, knownFalses) : Promise.resolve(SKIPPED),
    engines.has('chatgpt') ? probeChatGPT(query, brand, domain, knownFalses) : Promise.resolve(SKIPPED),
    engines.has('perplexity') ? probePerplexity(query, brand, domain, knownFalses) : Promise.resolve(SKIPPED),
    engines.has('claude') ? probeClaude(query, brand, domain, knownFalses) : Promise.resolve(SKIPPED),
  ]);
  return { gemini, chatgpt, perplexity, claude };
}

export interface ProbeAggregate {
  queryResults: Array<{
    query: string; cited: boolean; accurate: boolean;
    misinformation: string | null; excerpt: string | null;
    platforms: Record<PlatformKey, PlatformResult>; timestamp: string;
  }>;
  platformRates: Record<string, number | null>;
  citationRate: number;
  citedCount: number;
  misinformationCount: number;
  activePlatforms: number;
}

// Run a full citation probe for one brand across a query set and aggregate it.
export async function runCitationProbe(opts: {
  brand: string; domain: string; queries: string[];
  knownFalses?: string[]; engines?: Set<PlatformKey>;
}): Promise<ProbeAggregate> {
  const { brand, domain, queries } = opts;
  const knownFalses = opts.knownFalses ?? [];
  const engines = opts.engines ?? new Set(ALL_ENGINES);
  const timestamp = new Date().toISOString();

  const queryResults = await Promise.all(
    queries.map(async (query) => {
      const platforms = await probeQuery(query, brand, domain, knownFalses, engines);
      const active = Object.values(platforms).filter(p => !p.skipped);
      const citedOnAny = active.some(p => p.cited);
      const hasMisinformation = active.some(p => p.cited && !p.accurate);
      const firstExcerpt = active.find(p => p.cited && p.accurate && p.excerpt)?.excerpt
        || active.find(p => p.cited && p.excerpt)?.excerpt || null;
      const misinformationSnippet = active.find(p => p.misinformation)?.misinformation || null;
      return {
        query, cited: citedOnAny, accurate: !hasMisinformation,
        misinformation: misinformationSnippet, excerpt: firstExcerpt,
        platforms, timestamp,
      };
    })
  );

  const platformRates: Record<string, number | null> = {};
  for (const p of ALL_ENGINES) {
    const pResults = queryResults.map(r => r.platforms[p]);
    const active = pResults.filter(r => !r.skipped);
    platformRates[p] = active.length === 0 ? null
      : Math.round((active.filter(r => r.cited).length / active.length) * 100);
  }

  const activeRates = Object.values(platformRates).filter(r => r !== null) as number[];
  const citationRate = activeRates.length > 0
    ? Math.round(activeRates.reduce((a, b) => a + b, 0) / activeRates.length) : 0;
  const citedCount = queryResults.filter(r => r.cited).length;
  const misinformationCount = queryResults.filter(r => r.cited && !r.accurate).length;

  return { queryResults, platformRates, citationRate, citedCount, misinformationCount, activePlatforms: activeRates.length };
}

// Lightweight cited-only probe used for competitor head-to-head comparison.
export async function probeBrandRate(
  queries: string[], brand: string, domain: string, engines: Set<PlatformKey> = new Set(ALL_ENGINES),
): Promise<{ rate: number; perQuery: { query: string; cited: boolean }[] }> {
  const perQuery = await Promise.all(
    queries.map(async (query) => {
      const platforms = await probeQuery(query, brand, domain, [], engines);
      const active = Object.values(platforms).filter(p => !p.skipped);
      return { query, cited: active.some(p => p.cited) };
    })
  );
  const cited = perQuery.filter(r => r.cited).length;
  const rate = perQuery.length > 0 ? Math.round((cited / perQuery.length) * 100) : 0;
  return { rate, perQuery };
}

// Estimate USD cost of a probe pass. Mirrors the per-engine pricing used in the
// cost_audit writes. `passes` = number of brands probed (brand + competitors).
export function estimateProbeCost(numQueries: number, engines: Set<PlatformKey>, passes = 1): number {
  const perPass =
    (engines.has('gemini') ? (numQueries * 500 / 1_000_000) * 0.40 : 0) +
    (engines.has('chatgpt') ? (numQueries * 800 / 1_000_000) * 0.60 : 0) +
    (engines.has('perplexity') ? numQueries * 0.005 : 0) +
    (engines.has('claude') ? (numQueries * 800 / 1_000_000) * 4.00 : 0);
  return perPass * passes;
}
