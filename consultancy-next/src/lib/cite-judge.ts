import { z } from 'zod';
import { llmOrchestrator } from './llm-orchestrator';
import type { PlatformKey } from './cite-probe-core';

// WS3 — optional semantic citation judge (paid accuracy tier).
//
// The default scorer (checkCitation) is a cheap heuristic: brand word-match +
// negation/word-list sentiment. It misses sarcasm, negation, and "mentioned but
// not really recommended". This module re-judges a raw answer by MEANING with a
// neutral LLM — and, critically, with a model family DIFFERENT from the engine
// that produced the answer, so we never grade an engine with its own family.

export const CiteJudgeSchema = z.object({
  cited: z.boolean(),
  accurate: z.boolean(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
});
export type CiteJudgeVerdict = z.infer<typeof CiteJudgeSchema>;

type JudgeProvider = 'openai' | 'anthropic' | 'gemini';

// Which model family produced each engine's answer (so we can avoid judging with it).
const ENGINE_FAMILY: Record<PlatformKey, JudgeProvider | 'other'> = {
  gemini: 'gemini',
  chatgpt: 'openai',
  perplexity: 'openai',   // sonar is OpenAI-lineage-adjacent; treat as openai for avoidance
  claude: 'anthropic',
  grok: 'other',
  deepseek: 'other',
  google_aio: 'other',
};

// Preference order of judges; first one whose family differs from the engine wins.
const JUDGE_PREFERENCE: { provider: JudgeProvider; model: string }[] = [
  { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
  { provider: 'openai', model: 'gpt-4o-mini' },
  { provider: 'gemini', model: 'gemini-2.5-flash' },
];

// Pick a judge whose family differs from the engine under test.
export function pickJudge(engine: PlatformKey): { provider: JudgeProvider; model: string } {
  const fam = ENGINE_FAMILY[engine];
  return JUDGE_PREFERENCE.find(j => j.provider !== fam) ?? JUDGE_PREFERENCE[0];
}

// Cohen's κ for two binary raters over paired booleans (chance-corrected agreement).
export function cohenKappa(pairs: { a: boolean; b: boolean }[]): number | null {
  const n = pairs.length;
  if (n === 0) return null;
  let aa = 0, ab = 0, ba = 0, bb = 0;
  for (const { a, b } of pairs) {
    if (a && b) aa++; else if (a && !b) ab++; else if (!a && b) ba++; else bb++;
  }
  const po = (aa + bb) / n;
  const pYesA = (aa + ab) / n;
  const pYesB = (aa + ba) / n;
  const pe = pYesA * pYesB + (1 - pYesA) * (1 - pYesB);
  return pe < 1 ? Number(((po - pe) / (1 - pe)).toFixed(3)) : 1;
}

// Judge one answer for one brand. Returns null on any failure (caller keeps the
// heuristic verdict). Cost is logged via the orchestrator (feature: cite-probe-judge).
export async function judgeCitation(opts: {
  userId: string;
  brand: string;
  domain: string;
  response: string | null | undefined;
  engine: PlatformKey;
}): Promise<CiteJudgeVerdict | null> {
  const { userId, brand, domain, response, engine } = opts;
  if (!response || !response.trim()) return null;
  const judge = pickJudge(engine);
  const prompt = `You are a strict, neutral citation auditor. Decide, by MEANING (not exact words), how the brand below is treated in the ANSWER.

Brand: "${brand}" (domain: ${domain})

ANSWER:
"""${response.slice(0, 6000)}"""

Return ONLY JSON: {"cited": boolean, "accurate": boolean, "sentiment": "positive"|"neutral"|"negative"}
- cited = true ONLY if the answer genuinely references or recommends this brand as a relevant option (a passing/negated mention like "X is NOT suitable" is cited=true but sentiment negative; an incidental unrelated use of the word is cited=false).
- accurate = false if the answer states something materially false about the brand.
- sentiment = tone toward the brand in this answer.`;

  try {
    const res = await llmOrchestrator.executeCall<CiteJudgeVerdict>({
      userId,
      provider: judge.provider,
      model: judge.model,
      prompt,
      schema: CiteJudgeSchema,
      feature: 'cite-probe-judge',
      temperature: 0,
    });
    return res.success && res.data ? res.data : null;
  } catch {
    return null;
  }
}
