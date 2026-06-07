/**
 * Real multi-engine query helpers.
 *
 * Fires a single prompt at the live AI engines we have API keys for and returns
 * each engine's ACTUAL response text. Used by the SOV Simulator so the dashboard
 * reflects what real engines say — never a single model fabricating four answers.
 *
 * An engine with no configured API key is returned as { skipped: true } and must
 * be excluded from any share-of-voice denominator by the caller.
 */
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export type EngineId = 'chatgpt' | 'claude' | 'gemini' | 'perplexity';

export interface EngineResponse {
  /** The engine's actual answer text ('' when skipped or errored) */
  response: string;
  /** Whether the brand was genuinely mentioned (real substring + negative-context guard) */
  mentionedBrand: boolean;
  /** True when no API key is configured — caller must exclude from SOV denominator */
  skipped: boolean;
  /** Populated when the live call threw */
  error?: string;
}

// If the brand name appears only inside one of these phrases, the engine is
// disclaiming knowledge — that is NOT a genuine mention for SOV purposes.
const NEGATIVE_PATTERNS = [
  "couldn't find any information", 'could not find any information',
  "don't have any information", 'do not have any information',
  'no information about', 'not familiar with', 'not in my knowledge',
  'outside my knowledge', 'i cannot find', "i can't find",
  'unable to find information', "doesn't appear in my", 'does not appear in my',
  "isn't a company", 'is not a company', 'let me imagine', "let's imagine",
  'hypothetically', 'as a hypothetical', "i'll assume", 'i will assume',
];

export function detectBrandMention(response: string, brand: string): boolean {
  if (!response || !brand) return false;
  const lower = response.toLowerCase();
  const brandLower = brand.toLowerCase();
  if (!lower.includes(brandLower)) return false;
  // Mentioned, but disclaimed → not a genuine mention.
  return !NEGATIVE_PATTERNS.some((p) => lower.includes(p));
}

async function safeGemini(query: string): Promise<{ text: string; skipped: boolean; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) return { text: '', skipped: true };
  try {
    const ai = new GoogleGenAI({ apiKey });
    const r = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: { temperature: 0.3, maxOutputTokens: 600 },
    });
    return { text: r.candidates?.[0]?.content?.parts?.[0]?.text || '', skipped: false };
  } catch (e: any) {
    return { text: '', skipped: false, error: e.message };
  }
}

async function safeChatGPT(query: string): Promise<{ text: string; skipped: boolean; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) return { text: '', skipped: true };
  try {
    const client = new OpenAI({ apiKey });
    const r = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: query }],
      max_tokens: 600,
      temperature: 0.3,
    });
    return { text: r.choices[0]?.message?.content || '', skipped: false };
  } catch (e: any) {
    return { text: '', skipped: false, error: e.message };
  }
}

async function safePerplexity(query: string): Promise<{ text: string; skipped: boolean; error?: string }> {
  const apiKey = process.env.PERPLEXITY_API_KEY || '';
  if (!apiKey) return { text: '', skipped: true };
  try {
    const client = new OpenAI({ apiKey, baseURL: 'https://api.perplexity.ai' });
    const r = await client.chat.completions.create({
      model: 'sonar',
      messages: [{ role: 'user', content: query }],
      max_tokens: 600,
    } as any);
    return { text: r.choices[0]?.message?.content || '', skipped: false };
  } catch (e: any) {
    return { text: '', skipped: false, error: e.message };
  }
}

async function safeClaude(query: string): Promise<{ text: string; skipped: boolean; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return { text: '', skipped: true };
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
    return { text: data.content?.[0]?.text || '', skipped: false };
  } catch (e: any) {
    return { text: '', skipped: false, error: e.message };
  }
}

const RUNNERS: Record<EngineId, (q: string) => Promise<{ text: string; skipped: boolean; error?: string }>> = {
  gemini: safeGemini,
  chatgpt: safeChatGPT,
  perplexity: safePerplexity,
  claude: safeClaude,
};

/** Query one real engine and classify whether it genuinely mentioned the brand. */
export async function queryEngine(engine: EngineId, query: string, brand: string): Promise<EngineResponse> {
  const { text, skipped, error } = await RUNNERS[engine](query);
  return {
    response: text,
    mentionedBrand: skipped ? false : detectBrandMention(text, brand),
    skipped,
    ...(error ? { error } : {}),
  };
}

/** Query all four engines in parallel for a single query. */
export async function queryAllEngines(
  query: string,
  brand: string,
): Promise<Record<EngineId, EngineResponse>> {
  const [chatgpt, claude, gemini, perplexity] = await Promise.all([
    queryEngine('chatgpt', query, brand),
    queryEngine('claude', query, brand),
    queryEngine('gemini', query, brand),
    queryEngine('perplexity', query, brand),
  ]);
  return { chatgpt, claude, gemini, perplexity };
}
