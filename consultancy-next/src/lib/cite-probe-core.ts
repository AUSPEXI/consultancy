import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

// Shared citation-probe engine. Single source of truth for the user-facing
// /api/cite-probe route so the probe logic stays consistent across callers.

export type PlatformKey = 'gemini' | 'chatgpt' | 'perplexity' | 'claude' | 'grok' | 'deepseek' | 'google_aio';
export const ALL_ENGINES: PlatformKey[] = ['gemini', 'chatgpt', 'perplexity', 'claude', 'grok', 'deepseek', 'google_aio'];

export type Sentiment = 'positive' | 'neutral' | 'negative';

// The exact model identifier each engine probe calls. Logged with every probe so
// that citation-behaviour shifts caused by provider model swaps are separable
// from real content-driven movement in longitudinal analysis. Keep in sync with
// the model strings inside each probe function below.
export const ENGINE_MODEL_VERSIONS: Record<PlatformKey, string> = {
  gemini: 'gemini-2.5-flash',
  chatgpt: 'gpt-4o-mini',
  perplexity: 'sonar',
  claude: 'claude-haiku-4-5-20251001',
  grok: 'grok-2-latest',
  deepseek: 'deepseek-chat',
  google_aio: 'serpapi-google-ai-overview',
};

// ── Citation pathway (WS1) ───────────────────────────────────────────────────
// A bare query measures PARAMETRIC recall (does the model know the brand from
// training?); a query run with the engine's web tool measures GROUNDED retrieval
// (does it cite the brand when it searches the live web?). These are different
// questions and must be labelled — a young brand reading "not cited (parametric)"
// is expected, not a failing grade.
export type Pathway = 'parametric' | 'grounded';
export type ProbeMode = 'parametric' | 'grounded';

// What each engine can do TODAY in this codebase. Grounded for Gemini/Grok is a
// follow-up slice; until implemented they're listed parametric-only so we never
// label a result "grounded" that wasn't.
export const ENGINE_PATHWAYS: Record<PlatformKey, Pathway[]> = {
  gemini: ['parametric', 'grounded'],   // grounded = googleSearch grounding tool
  chatgpt: ['parametric', 'grounded'],
  claude: ['parametric', 'grounded'],
  grok: ['parametric', 'grounded'],      // grounded = xAI live search
  perplexity: ['grounded'],          // sonar always retrieves
  deepseek: ['parametric'],          // no native web tool today
  google_aio: ['grounded'],          // SerpAPI = real Google AI Overview
};

// Resolve the pathway an engine will actually run given the requested mode: honour
// the request when the engine supports it, else fall back to its only capability.
export function resolvePathway(engine: PlatformKey, requested: ProbeMode): Pathway {
  const caps = ENGINE_PATHWAYS[engine];
  return caps.includes(requested) ? requested : caps[0];
}

export interface PlatformResult {
  cited: boolean;
  accurate: boolean;
  misinformation: string | null;
  excerpt: string | null;
  // Full raw LLM response — stored so sentiment/position can be re-scored offline.
  rawResponse?: string | null;
  // Sentiment of the brand mention (null when not cited). Heuristic — no extra API cost.
  sentiment?: Sentiment | null;
  // Rank of the brand in a recommendation list (1-based) when the answer is a
  // numbered/bulleted list and the brand appears in it; null otherwise.
  position?: number | null;
  // Normalised position of the first brand mention in the answer (0–100; lower =
  // earlier = more prominent). null when not cited.
  positionPct?: number | null;
  // WS1: which pathway actually produced THIS result (reflects what ran, not what
  // was requested — a failed grounded call falls back to parametric and says so).
  pathway?: Pathway;
  // Structured citations the engine returned (grounded only); null otherwise.
  sourceUrls?: string[] | null;
  // True when the brand's own domain appears in sourceUrls — the strongest
  // "cited as a source" signal for GEO.
  citedInSources?: boolean;
  // WS2 repeat-sampling: across N trials of this query, how many cited the brand,
  // out of how many completed (non-skipped) attempts. cited = majority vote.
  citedTrials?: number;
  totalTrials?: number;
  error?: string;
  skipped?: boolean;
}

const POSITIVE_WORDS = [
  'best', 'leading', 'top', 'excellent', 'recommended', 'trusted', 'popular',
  'powerful', 'innovative', 'reliable', 'strong', 'great', 'preferred', 'superior',
  'robust', 'effective', 'award', 'high-quality', 'industry-leading', 'standout',
  'favorite', 'favourite', 'go-to', 'well-regarded', 'reputable', 'cutting-edge',
];
const NEGATIVE_WORDS = [
  'worst', 'poor', 'lacking', 'limited', 'weak', 'outdated', 'criticized', 'criticised',
  'problem', 'issue', 'concern', 'unreliable', 'difficult', 'complaint', 'scam',
  'avoid', 'expensive', 'overpriced', 'buggy', 'clunky', 'disappointing', 'subpar',
  'lacks', 'drawback', 'downside', 'controversial',
];

// Classify the sentiment of the sentence(s) mentioning the brand.
function computeSentiment(brandSentences: string[]): Sentiment {
  let score = 0;
  for (const s of brandSentences) {
    const sl = ` ${s.toLowerCase()} `;
    for (const w of POSITIVE_WORDS) if (sl.includes(` ${w} `) || sl.includes(`${w},`) || sl.includes(`${w}.`)) score++;
    for (const w of NEGATIVE_WORDS) if (sl.includes(` ${w} `) || sl.includes(`${w},`) || sl.includes(`${w}.`)) score--;
  }
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

// Find the brand's rank in a numbered/bulleted recommendation list (1-based),
// plus a normalised 0–100 position of its first mention in the whole answer.
function computePosition(response: string, brandLower: string, domainLower: string):
  { position: number | null; positionPct: number | null } {
  const matches = (line: string) => {
    const ll = line.toLowerCase();
    return ll.includes(brandLower) || (domainLower && ll.includes(domainLower));
  };

  // List rank: look for numbered or bulleted lines, in order.
  const lines = response.split('\n');
  const listLines = lines.filter(l => /^\s*(\d+[.)]|[-*•])\s+/.test(l));
  if (listLines.length >= 2) {
    const rank = listLines.findIndex(matches);
    if (rank >= 0) {
      const idx = response.toLowerCase().indexOf(brandLower);
      const pct = idx >= 0 ? Math.round((idx / response.length) * 100) : null;
      return { position: rank + 1, positionPct: pct };
    }
  }

  // Otherwise: normalised character offset of first brand mention.
  const idx = response.toLowerCase().indexOf(brandLower);
  const offset = idx >= 0 ? idx : (domainLower ? response.toLowerCase().indexOf(domainLower) : -1);
  if (offset < 0) return { position: null, positionPct: null };
  return { position: null, positionPct: Math.round((offset / response.length) * 100) };
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

// Whole-word(s) match of `needle` in already-lowercased `haystack`. Treats any
// non-alphanumeric as a boundary so multi-word brands and punctuation work.
function wordBoundaryMatch(haystack: string, needle: string): boolean {
  const n = (needle || '').trim();
  if (!n) return false;
  const esc = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${esc}(?:[^a-z0-9]|$)`, 'i').test(haystack);
}

export function checkCitation(
  response: string,
  brand: string,
  domain: string,
  knownFalses: string[] = [],
): { cited: boolean; accurate: boolean; misinformation: string | null; excerpt: string | null; sentiment: Sentiment | null; position: number | null; positionPct: number | null } {
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
  // WS7: match the brand on WORD BOUNDARIES, not bare substring — otherwise a brand
  // whose name is a common word (e.g. "Arc", "Notion", "Apple") false-positives on
  // any incidental occurrence. The domain stays a substring match (it's distinctive).
  const mentionsBrand = wordBoundaryMatch(lower, brandLower) || (!!domainLower && lower.includes(domainLower));

  if (!mentionsBrand || hasNegative) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null, sentiment: null, position: null, positionPct: null };
  }

  const sentences = response.split(/(?<=[.!?])\s+/);
  const match = sentences.find(s =>
    s.toLowerCase().includes(brandLower) || s.toLowerCase().includes(domainLower)
  );

  const brandSentencesForSentiment = sentences.filter(s => {
    const sl = s.toLowerCase();
    return sl.includes(brandLower) || (domainLower && sl.includes(domainLower));
  });
  const sentiment = computeSentiment(brandSentencesForSentiment);
  const { position, positionPct } = computePosition(response, brandLower, domainLower);

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
    sentiment,
    position,
    positionPct,
  };
}

const SKIPPED: PlatformResult = { cited: false, accurate: true, misinformation: null, excerpt: null, skipped: true };

// ── Retry / backoff (WS2) ────────────────────────────────────────────────────
// The OpenAI-compatible SDK retries 429/5xx itself (we bump maxRetries below);
// the raw-fetch engines (Claude, Google AIO) need their own backoff so one
// engine rate-limiting doesn't silently shrink its trial count (differential
// missingness).
const RETRY_MAX = 3;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function fetchWithRetry(url: string, init: RequestInit, tries = RETRY_MAX): Promise<Response> {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, init);
      if ((res.status === 429 || res.status >= 500) && i < tries - 1) {
        await sleep(250 * 2 ** i); // 250ms → 500ms → 1s
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) { await sleep(250 * 2 ** i); continue; }
      throw e;
    }
  }
  throw lastErr;
}

// Combine N trial results for ONE engine on ONE query into a single result:
// cited = majority vote; carry citedTrials/totalTrials for trial-level CIs.
function combineTrials(results: PlatformResult[]): PlatformResult {
  const valid = results.filter(r => !r.skipped);
  if (valid.length === 0) return results[0] ?? SKIPPED;
  const totalTrials = valid.length;
  const citedTrials = valid.filter(r => r.cited).length;
  const cited = citedTrials * 2 >= totalTrials; // ties resolve to cited
  const rep = valid.find(r => r.cited && r.accurate) ?? valid.find(r => r.cited) ?? valid[0];
  return { ...rep, cited, citedTrials, totalTrials };
}

// ── Grounded-mode helpers (WS1) ──────────────────────────────────────────────
// Does the brand's own domain appear among the engine's returned source URLs?
function domainInSources(domain: string, sourceUrls: string[] | null | undefined): boolean {
  if (!sourceUrls || sourceUrls.length === 0) return false;
  const d = String(domain).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (!d) return false;
  return sourceUrls.some(u => (u || '').toLowerCase().includes(d));
}

// Build a grounded PlatformResult: the brand counts as cited if it's named in the
// answer text OR its domain appears in the returned sources.
function finalizeGrounded(
  text: string, brand: string, domain: string, knownFalses: string[], sourceUrls: string[],
): PlatformResult {
  const base = checkCitation(text, brand, domain, knownFalses);
  const citedInSources = domainInSources(domain, sourceUrls);
  return {
    ...base,
    cited: base.cited || citedInSources,
    rawResponse: text,
    pathway: 'grounded',
    sourceUrls: sourceUrls.length ? [...new Set(sourceUrls)] : null,
    citedInSources,
  };
}

// Extract answer text from an OpenAI Responses API result (best-effort across SDK shapes).
function extractResponsesText(r: any): string {
  if (typeof r?.output_text === 'string' && r.output_text) return r.output_text;
  const parts: string[] = [];
  for (const item of r?.output ?? []) {
    for (const c of item?.content ?? []) {
      if (typeof c?.text === 'string') parts.push(c.text);
    }
  }
  return parts.join('\n');
}
// Extract url_citation annotations from an OpenAI Responses API result.
function extractResponsesCitations(r: any): string[] {
  const urls: string[] = [];
  for (const item of r?.output ?? []) {
    for (const c of item?.content ?? []) {
      for (const ann of c?.annotations ?? []) {
        if (ann?.type === 'url_citation' && ann?.url) urls.push(ann.url);
      }
    }
  }
  return urls;
}
// Extract grounded source URLs from a Gemini response that used googleSearch.
function extractGeminiCitations(response: any): string[] {
  const urls: string[] = [];
  const meta = response?.candidates?.[0]?.groundingMetadata;
  for (const chunk of meta?.groundingChunks ?? []) {
    if (chunk?.web?.uri) urls.push(chunk.web.uri);
  }
  return urls;
}

// Extract cited URLs from an Anthropic messages response that used the web_search tool.
function extractClaudeCitations(data: any): string[] {
  const urls: string[] = [];
  for (const block of data?.content ?? []) {
    if (block?.type === 'web_search_tool_result') {
      for (const r of block?.content ?? []) if (r?.url) urls.push(r.url);
    }
    for (const cit of block?.citations ?? []) if (cit?.url) urls.push(cit.url);
  }
  return urls;
}

async function probeGemini(query: string, brand: string, domain: string, knownFalses: string[], pathway: Pathway = 'parametric'): Promise<PlatformResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) return SKIPPED;
  const ai = new GoogleGenAI({ apiKey });

  if (pathway === 'grounded') {
    // Google Search grounding tool. Cast config through `any` so it compiles across
    // SDK versions; fall back to the parametric call (labelled honestly) on failure.
    try {
      const response: any = await ai.models.generateContent({
        model: ENGINE_MODEL_VERSIONS.gemini,
        contents: query,
        config: { temperature: 0.3, tools: [{ googleSearch: {} }] } as any,
      });
      const text = (response.candidates?.[0]?.content?.parts ?? [])
        .map((p: any) => p?.text).filter((t: any) => typeof t === 'string').join('') || '';
      const sourceUrls = extractGeminiCitations(response);
      if (sourceUrls.length > 0) return finalizeGrounded(text, brand, domain, knownFalses, sourceUrls);
    } catch { /* fall through to parametric */ }
  }

  try {
    const response = await ai.models.generateContent({
      model: ENGINE_MODEL_VERSIONS.gemini,
      contents: query,
      config: { temperature: 0.3, maxOutputTokens: 600 },
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { ...checkCitation(text, brand, domain, knownFalses), rawResponse: text, pathway: 'parametric', sourceUrls: null, citedInSources: false };
  } catch (e: any) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null, error: e.message, pathway: 'parametric' };
  }
}

async function probeChatGPT(query: string, brand: string, domain: string, knownFalses: string[], pathway: Pathway = 'parametric'): Promise<PlatformResult> {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) return SKIPPED;
  const client = new OpenAI({ apiKey, maxRetries: RETRY_MAX });

  if (pathway === 'grounded') {
    // Responses API with the web-search tool. Cast through `any` so this compiles
    // across SDK versions; on any failure we fall back to the parametric call and
    // label the result honestly. (Verify the tool string against current docs.)
    try {
      const r: any = await (client as any).responses.create({
        model: ENGINE_MODEL_VERSIONS.chatgpt,
        tools: [{ type: 'web_search' }],
        input: query,
        temperature: 0.3,
      });
      const text = extractResponsesText(r);
      if (text) return finalizeGrounded(text, brand, domain, knownFalses, extractResponsesCitations(r));
    } catch { /* fall through to parametric */ }
  }

  try {
    const response = await client.chat.completions.create({
      model: ENGINE_MODEL_VERSIONS.chatgpt,
      messages: [{ role: 'user', content: query }],
      max_tokens: 600,
      temperature: 0.3,
    });
    const text = response.choices[0]?.message?.content || '';
    return { ...checkCitation(text, brand, domain, knownFalses), rawResponse: text, pathway: 'parametric', sourceUrls: null, citedInSources: false };
  } catch (e: any) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null, error: e.message, pathway: 'parametric' };
  }
}

async function probePerplexity(query: string, brand: string, domain: string, knownFalses: string[], _pathway: Pathway = 'grounded'): Promise<PlatformResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY || '';
  if (!apiKey) return SKIPPED;
  try {
    const client = new OpenAI({ apiKey, baseURL: 'https://api.perplexity.ai', maxRetries: RETRY_MAX });
    const response: any = await client.chat.completions.create({
      model: ENGINE_MODEL_VERSIONS.perplexity,
      messages: [{ role: 'user', content: query }],
      max_tokens: 600,
    } as any);
    const text = response.choices[0]?.message?.content || '';
    // sonar always retrieves — pull its source list (shape varies by API version).
    const sourceUrls: string[] = (
      response.citations
      ?? response.search_results?.map((s: any) => s?.url)
      ?? []
    ).filter((u: any) => typeof u === 'string');
    return finalizeGrounded(text, brand, domain, knownFalses, sourceUrls);
  } catch (e: any) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null, error: e.message, pathway: 'grounded' };
  }
}

async function probeClaude(query: string, brand: string, domain: string, knownFalses: string[], pathway: Pathway = 'parametric'): Promise<PlatformResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return SKIPPED;
  const grounded = pathway === 'grounded';
  try {
    const body: any = {
      model: ENGINE_MODEL_VERSIONS.claude,
      max_tokens: 600,
      messages: [{ role: 'user', content: query }],
    };
    // Add the web-search tool for grounded mode. (Verify the tool version string
    // against current Anthropic docs at maintenance time — these move.)
    if (grounded) body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }];

    const res = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const text = (data.content ?? [])
      .filter((b: any) => b?.type === 'text' && typeof b.text === 'string')
      .map((b: any) => b.text).join('\n') || data.content?.[0]?.text || '';

    if (grounded) {
      const sourceUrls = extractClaudeCitations(data);
      // Only claim "grounded" if the tool actually engaged (returned sources);
      // otherwise label parametric so we never overstate the pathway.
      if (sourceUrls.length > 0) return finalizeGrounded(text, brand, domain, knownFalses, sourceUrls);
    }
    return { ...checkCitation(text, brand, domain, knownFalses), rawResponse: text, pathway: 'parametric', sourceUrls: null, citedInSources: false };
  } catch (e: any) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null, error: e.message, pathway };
  }
}

// Grok (x.ai) and DeepSeek are OpenAI-compatible — same pattern as Perplexity.
async function probeGrok(query: string, brand: string, domain: string, knownFalses: string[], pathway: Pathway = 'parametric'): Promise<PlatformResult> {
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
  if (!apiKey) return SKIPPED;
  const client = new OpenAI({ apiKey, baseURL: 'https://api.x.ai/v1', maxRetries: RETRY_MAX });

  if (pathway === 'grounded') {
    // xAI Live Search via search_parameters (passed through the OpenAI-compatible
    // body). Fall back to the parametric call (labelled honestly) on failure.
    try {
      const response: any = await client.chat.completions.create({
        model: ENGINE_MODEL_VERSIONS.grok,
        messages: [{ role: 'user', content: query }],
        max_tokens: 600, temperature: 0.3,
        search_parameters: { mode: 'auto', return_citations: true },
      } as any);
      const text = response.choices[0]?.message?.content || '';
      const sourceUrls: string[] = (response.citations ?? [])
        .map((c: any) => (typeof c === 'string' ? c : c?.url))
        .filter((u: any) => typeof u === 'string');
      if (sourceUrls.length > 0) return finalizeGrounded(text, brand, domain, knownFalses, sourceUrls);
    } catch { /* fall through to parametric */ }
  }

  try {
    const response = await client.chat.completions.create({
      model: ENGINE_MODEL_VERSIONS.grok,
      messages: [{ role: 'user', content: query }],
      max_tokens: 600, temperature: 0.3,
    } as any);
    const text = response.choices[0]?.message?.content || '';
    return { ...checkCitation(text, brand, domain, knownFalses), rawResponse: text, pathway: 'parametric', sourceUrls: null, citedInSources: false };
  } catch (e: any) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null, error: e.message, pathway: 'parametric' };
  }
}

async function probeDeepSeek(query: string, brand: string, domain: string, knownFalses: string[], _pathway: Pathway = 'parametric'): Promise<PlatformResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY || '';
  if (!apiKey) return SKIPPED;
  try {
    const client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com', maxRetries: RETRY_MAX });
    const response = await client.chat.completions.create({
      model: ENGINE_MODEL_VERSIONS.deepseek,
      messages: [{ role: 'user', content: query }],
      max_tokens: 600, temperature: 0.3,
    } as any);
    const text = response.choices[0]?.message?.content || '';
    return { ...checkCitation(text, brand, domain, knownFalses), rawResponse: text, pathway: 'parametric', sourceUrls: null, citedInSources: false };
  } catch (e: any) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null, error: e.message, pathway: 'parametric' };
  }
}

// Google AI Overviews — the highest-volume AI answer surface, but it has no chat
// API. We read it via SerpAPI, which runs the actual Google search and returns the
// rendered AI Overview as structured text blocks + reference links. A brand counts
// as "cited" if it appears in the overview text OR in the cited reference list.
//
// SerpAPI sometimes returns the overview inline; other times it returns only a
// page_token that must be redeemed with a second `engine=google_ai_overview` call.
// We handle both. When there is no AI Overview for a query at all, that's a real
// signal (Google chose not to show one) — we return cited:false, not skipped.
function flattenAioText(aio: any): string {
  if (!aio) return '';
  const parts: string[] = [];
  const walkBlocks = (blocks: any[]) => {
    for (const b of blocks || []) {
      if (typeof b?.snippet === 'string') parts.push(b.snippet);
      if (Array.isArray(b?.list)) {
        for (const item of b.list) {
          if (typeof item?.snippet === 'string') parts.push(item.snippet);
          if (typeof item?.title === 'string') parts.push(item.title);
        }
      }
      if (Array.isArray(b?.text_blocks)) walkBlocks(b.text_blocks);
    }
  };
  walkBlocks(aio.text_blocks);
  // Reference links count as citations too — fold in titles + source domains.
  for (const ref of aio.references || []) {
    if (typeof ref?.title === 'string') parts.push(ref.title);
    if (typeof ref?.link === 'string') parts.push(ref.link);
    if (typeof ref?.source === 'string') parts.push(ref.source);
    if (typeof ref?.snippet === 'string') parts.push(ref.snippet);
  }
  return parts.join('\n');
}

async function probeGoogleAIO(query: string, brand: string, domain: string, knownFalses: string[], _pathway: Pathway = 'grounded'): Promise<PlatformResult> {
  const apiKey = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY || '';
  if (!apiKey) return SKIPPED;
  try {
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
    const res = await fetchWithRetry(url, {});
    const data = await res.json();
    let aio = data.ai_overview;

    // If only a page_token came back, redeem it for the full overview.
    if (aio?.page_token && !aio?.text_blocks) {
      const tokenUrl = `https://serpapi.com/search.json?engine=google_ai_overview&page_token=${encodeURIComponent(aio.page_token)}&api_key=${apiKey}`;
      const tokenRes = await fetchWithRetry(tokenUrl, {});
      const tokenData = await tokenRes.json();
      aio = tokenData.ai_overview || aio;
    }

    // No AI Overview shown for this query — a genuine "not cited" result.
    if (!aio || (!aio.text_blocks && !aio.references)) {
      return { cited: false, accurate: true, misinformation: null, excerpt: null, sentiment: null, position: null, positionPct: null, pathway: 'grounded', sourceUrls: null, citedInSources: false };
    }

    const text = flattenAioText(aio);
    const sourceUrls: string[] = (aio.references || [])
      .map((ref: any) => ref?.link)
      .filter((u: any) => typeof u === 'string');
    return finalizeGrounded(text, brand, domain, knownFalses, sourceUrls);
  } catch (e: any) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null, error: e.message, pathway: 'grounded' };
  }
}

// Probe one query across the requested engines. Engines not in `engines` are
// returned as skipped without making (or paying for) an API call.
async function probeQuery(
  query: string, brand: string, domain: string, knownFalses: string[], engines: Set<PlatformKey>,
  mode: ProbeMode = 'parametric', trials = 1,
): Promise<Record<PlatformKey, PlatformResult>> {
  // Each engine runs the pathway it actually supports for the requested mode.
  const pw = (e: PlatformKey) => resolvePathway(e, mode);
  // Run an engine `trials` times and majority-vote (WS2). trials=1 is identical
  // to the old single-call behaviour.
  const run = async (
    engine: PlatformKey,
    fn: (p: Pathway) => Promise<PlatformResult>,
  ): Promise<PlatformResult> => {
    if (!engines.has(engine)) return SKIPPED;
    const p = pw(engine);
    if (trials <= 1) return fn(p);
    const attempts = await Promise.all(Array.from({ length: trials }, () => fn(p)));
    return combineTrials(attempts);
  };
  const [gemini, chatgpt, perplexity, claude, grok, deepseek, google_aio] = await Promise.all([
    run('gemini', (p) => probeGemini(query, brand, domain, knownFalses, p)),
    run('chatgpt', (p) => probeChatGPT(query, brand, domain, knownFalses, p)),
    run('perplexity', (p) => probePerplexity(query, brand, domain, knownFalses, p)),
    run('claude', (p) => probeClaude(query, brand, domain, knownFalses, p)),
    run('grok', (p) => probeGrok(query, brand, domain, knownFalses, p)),
    run('deepseek', (p) => probeDeepSeek(query, brand, domain, knownFalses, p)),
    run('google_aio', (p) => probeGoogleAIO(query, brand, domain, knownFalses, p)),
  ]);
  return { gemini, chatgpt, perplexity, claude, grok, deepseek, google_aio };
}

// Wilson score 95% CI for a proportion (k successes in n trials).
// Returns [lowerPct, upperPct] rounded to integers.
export function wilsonCI95(k: number, n: number): [number, number] {
  if (n === 0) return [0, 100];
  const z = 1.96;
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / denom;
  return [Math.max(0, Math.round((centre - margin) * 100)), Math.min(100, Math.round((centre + margin) * 100))];
}

export interface ProbeAggregate {
  queryResults: Array<{
    query: string; cited: boolean; accurate: boolean;
    misinformation: string | null; excerpt: string | null;
    sentiment: Sentiment | null; positionPct: number | null;
    platforms: Record<PlatformKey, PlatformResult>; timestamp: string;
  }>;
  platformRates: Record<string, number | null>;
  citationRate: number;
  // 95% Wilson CI on citationRate as [lowerPct, upperPct]. Communicates statistical
  // uncertainty — at 7 queries the interval is ±≈35pp, so movement within the band
  // is noise, not signal.
  ci95: [number, number];
  citedCount: number;
  misinformationCount: number;
  activePlatforms: number;
  // Sentiment of brand mentions across all cited platform results.
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  // Average normalised position of the brand mention (0–100; lower = earlier).
  // null when the brand was never cited.
  avgPositionPct: number | null;
  // WS2: trial-level stats per engine. With repeat-sampling the rate is computed
  // over cited TRIALS / total TRIALS (tighter Wilson CI than the query-level rate).
  // errorTrials surfaces differential missingness (one engine rate-limiting more).
  platformTrialStats?: Record<string, {
    citedTrials: number; totalTrials: number; ratePct: number; ci95: [number, number]; errorTrials: number;
  }>;
  // Repeat-sampling depth actually used (1 = single pass).
  trialsPerQuery?: number;
}

// Run a full citation probe for one brand across a query set and aggregate it.
export async function runCitationProbe(opts: {
  brand: string; domain: string; queries: string[];
  knownFalses?: string[]; engines?: Set<PlatformKey>; mode?: ProbeMode; trialsPerQuery?: number;
}): Promise<ProbeAggregate> {
  const { brand, domain, queries } = opts;
  const knownFalses = opts.knownFalses ?? [];
  const engines = opts.engines ?? new Set(ALL_ENGINES);
  const mode = opts.mode ?? 'parametric';
  const trialsPerQuery = Math.max(1, opts.trialsPerQuery ?? 1);
  const timestamp = new Date().toISOString();

  const queryResults = await Promise.all(
    queries.map(async (query) => {
      const platforms = await probeQuery(query, brand, domain, knownFalses, engines, mode, trialsPerQuery);
      const active = Object.values(platforms).filter(p => !p.skipped);
      const citedOnAny = active.some(p => p.cited);
      const hasMisinformation = active.some(p => p.cited && !p.accurate);
      const firstExcerpt = active.find(p => p.cited && p.accurate && p.excerpt)?.excerpt
        || active.find(p => p.cited && p.excerpt)?.excerpt || null;
      const misinformationSnippet = active.find(p => p.misinformation)?.misinformation || null;
      // Representative sentiment/position for the query = first cited platform's.
      const citedResult = active.find(p => p.cited);
      const sentiment = citedResult?.sentiment ?? null;
      const positionPct = citedResult?.positionPct ?? null;
      return {
        query, cited: citedOnAny, accurate: !hasMisinformation,
        misinformation: misinformationSnippet, excerpt: firstExcerpt,
        sentiment, positionPct,
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

  // Sentiment + position aggregated across every cited platform result.
  const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
  const positions: number[] = [];
  for (const qr of queryResults) {
    for (const p of ALL_ENGINES) {
      const pr = qr.platforms[p];
      if (pr.skipped || !pr.cited) continue;
      if (pr.sentiment) sentimentBreakdown[pr.sentiment]++;
      if (typeof pr.positionPct === 'number') positions.push(pr.positionPct);
    }
  }
  const avgPositionPct = positions.length
    ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length) : null;

  const ci95 = wilsonCI95(citedCount, queryResults.length);

  // WS2: trial-level stats per engine. citedTrials/totalTrials aggregate the
  // per-query majority-vote inputs; the Wilson CI here tightens as trials rise.
  const platformTrialStats: ProbeAggregate['platformTrialStats'] = {};
  for (const p of ALL_ENGINES) {
    const pResults = queryResults.map(r => r.platforms[p]).filter(r => !r.skipped);
    if (pResults.length === 0) continue;
    const citedTrials = pResults.reduce((s, r) => s + (r.citedTrials ?? (r.cited ? 1 : 0)), 0);
    const totalTrials = pResults.reduce((s, r) => s + (r.totalTrials ?? 1), 0);
    const errorTrials = pResults.reduce((s, r) => s + Math.max(0, (trialsPerQuery) - (r.totalTrials ?? 1)), 0);
    platformTrialStats[p] = {
      citedTrials, totalTrials,
      ratePct: totalTrials ? Math.round((citedTrials / totalTrials) * 100) : 0,
      ci95: wilsonCI95(citedTrials, totalTrials),
      errorTrials,
    };
  }

  return {
    queryResults, platformRates, citationRate, ci95, citedCount, misinformationCount,
    activePlatforms: activeRates.length, sentimentBreakdown, avgPositionPct,
    platformTrialStats, trialsPerQuery,
  };
}

// Lightweight cited-only probe used for competitor head-to-head comparison.
export async function probeBrandRate(
  queries: string[], brand: string, domain: string, engines: Set<PlatformKey> = new Set(ALL_ENGINES),
  mode: ProbeMode = 'parametric',
): Promise<{ rate: number; perQuery: { query: string; cited: boolean }[] }> {
  const perQuery = await Promise.all(
    queries.map(async (query) => {
      const platforms = await probeQuery(query, brand, domain, [], engines, mode);
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
// `mode` = grounded runs cost more because each query triggers a billed web
// search on top of generation (WS1 cost guard).
export function estimateProbeCost(numQueries: number, engines: Set<PlatformKey>, passes = 1, mode: ProbeMode = 'parametric'): number {
  // Per-query surcharge for the web-search step when an engine runs grounded.
  // Rough provider search pricing; tune as real usage data comes in.
  const GROUNDED_SEARCH_USD: Partial<Record<PlatformKey, number>> = {
    chatgpt: 0.010, claude: 0.010, gemini: 0.000, grok: 0.005,
  };
  const groundedSurcharge = mode === 'grounded'
    ? [...engines].reduce((sum, e) =>
        resolvePathway(e, 'grounded') === 'grounded' ? sum + (GROUNDED_SEARCH_USD[e] ?? 0) * numQueries : sum, 0)
    : 0;
  const perPass =
    (engines.has('gemini') ? (numQueries * 500 / 1_000_000) * 0.40 : 0) +
    (engines.has('chatgpt') ? (numQueries * 800 / 1_000_000) * 0.60 : 0) +
    (engines.has('perplexity') ? numQueries * 0.005 : 0) +
    (engines.has('claude') ? (numQueries * 800 / 1_000_000) * 4.00 : 0) +
    (engines.has('grok') ? (numQueries * 800 / 1_000_000) * 2.00 : 0) +
    (engines.has('deepseek') ? (numQueries * 800 / 1_000_000) * 0.28 : 0) +
    // SerpAPI bills per search (~$0.01 on the $50/5k plan); ~1.3× to cover the
    // occasional page_token redemption that needs a second search call.
    (engines.has('google_aio') ? numQueries * 0.013 : 0) +
    groundedSurcharge;
  return perPass * passes;
}
