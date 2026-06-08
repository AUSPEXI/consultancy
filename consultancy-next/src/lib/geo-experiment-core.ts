import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import type { PlatformKey } from './geo-experiment-levers';

// Layer 2 "Test My Draft" — fast-mode, in-context citability experiments.
// Mirrors geo-lab/context/experiment-methodology.md: one variable changed,
// source order randomised per trial, two-proportion z-test for significance.
//
// Levers/engines live in ./geo-experiment-levers (client-safe). This file holds
// the server-only runner + stats.
export { EXPERIMENT_LEVERS, EXPERIMENT_ENGINES, getLever } from './geo-experiment-levers';
export type { PlatformKey, Lever } from './geo-experiment-levers';

// ── Engine callers (raw text, no citation logic) ──────────────────────────────
async function askGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.3, maxOutputTokens: 500 },
    });
    return res.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch { return null; }
}

async function askChatGPT(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) return null;
  try {
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500, temperature: 0.3,
    });
    return res.choices[0]?.message?.content || '';
  } catch { return null; }
}

async function askPerplexity(prompt: string): Promise<string | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY || '';
  if (!apiKey) return null;
  try {
    const client = new OpenAI({ apiKey, baseURL: 'https://api.perplexity.ai' });
    const res = await client.chat.completions.create({
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    } as any);
    return res.choices[0]?.message?.content || '';
  } catch { return null; }
}

async function askClaude(prompt: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || '';
  } catch { return null; }
}

function askEngine(engine: PlatformKey, prompt: string): Promise<string | null> {
  switch (engine) {
    case 'gemini': return askGemini(prompt);
    case 'chatgpt': return askChatGPT(prompt);
    case 'perplexity': return askPerplexity(prompt);
    case 'claude': return askClaude(prompt);
  }
}

// ── Head-to-head trial ────────────────────────────────────────────────────────
// Present both variants as candidate sources (order randomised) and ask the
// engine to answer the query citing a source by its number. Returns which
// variant was cited: 'A', 'B', or null (neither / ambiguous).
function buildTrialPrompt(query: string, first: string, second: string): string {
  return `Answer the question using ONLY the candidate sources below. Cite the single source you relied on most by writing "SOURCE: 1" or "SOURCE: 2" on the final line.

Question: ${query}

[Source 1]
"""
${first.substring(0, 4000)}
"""

[Source 2]
"""
${second.substring(0, 4000)}
"""

Write a 2–3 sentence answer, then on the final line write SOURCE: 1 or SOURCE: 2.`;
}

function parseCitedSource(response: string): 1 | 2 | null {
  const m = response.match(/SOURCE:\s*([12])/i);
  if (m) return Number(m[1]) as 1 | 2;
  // Fallback: last mention of "source 1/2" anywhere
  const all = [...response.matchAll(/source\s*([12])/gi)];
  if (all.length) return Number(all[all.length - 1][1]) as 1 | 2;
  return null;
}

export interface VariantTally { cited: number; trials: number; rate: number }
export interface EngineResult { engine: PlatformKey; a: VariantTally; b: VariantTally; skipped: boolean }

export interface ExperimentResult {
  engines: EngineResult[];
  pooled: {
    a: VariantTally; b: VariantTally;
    diffPp: number; z: number; pValue: number; significant: boolean;
    ci95: [number, number]; winner: 'A' | 'B' | 'tie';
    underpowered: boolean;
  };
  totalCalls: number;
}

// Run the full experiment: engines × queries × trialsPerQuery head-to-head calls.
export async function runHeadToHead(opts: {
  variantA: string;
  variantB: string;
  queries: string[];
  engines: PlatformKey[];
  trialsPerQuery: number;
}): Promise<ExperimentResult> {
  const { variantA, variantB, queries, engines, trialsPerQuery } = opts;
  const engineResults: EngineResult[] = [];
  let totalCalls = 0;

  for (const engine of engines) {
    let aCited = 0, bCited = 0, trials = 0;
    let anySuccess = false;

    for (const query of queries) {
      for (let t = 0; t < trialsPerQuery; t++) {
        // Randomise which variant is shown first to counter position bias
        const aFirst = Math.random() < 0.5;
        const prompt = buildTrialPrompt(query, aFirst ? variantA : variantB, aFirst ? variantB : variantA);
        const response = await askEngine(engine, prompt);
        totalCalls++;
        if (response === null) continue; // engine unavailable / errored — skip trial
        anySuccess = true;
        const cited = parseCitedSource(response);
        if (cited === null) { trials++; continue; } // counted as a trial, neither variant won
        const citedVariant = (cited === 1) === aFirst ? 'A' : 'B';
        if (citedVariant === 'A') aCited++; else bCited++;
        trials++;
      }
    }

    engineResults.push({
      engine,
      a: { cited: aCited, trials, rate: trials ? aCited / trials : 0 },
      b: { cited: bCited, trials, rate: trials ? bCited / trials : 0 },
      skipped: !anySuccess,
    });
  }

  // Pool across engines
  const aCitedTotal = engineResults.reduce((s, e) => s + e.a.cited, 0);
  const bCitedTotal = engineResults.reduce((s, e) => s + e.b.cited, 0);
  const trialsTotal = engineResults.reduce((s, e) => s + e.a.trials, 0); // a.trials == b.trials
  const aRate = trialsTotal ? aCitedTotal / trialsTotal : 0;
  const bRate = trialsTotal ? bCitedTotal / trialsTotal : 0;

  const { z, pValue } = twoProportionZ(bRate, trialsTotal, aRate, trialsTotal);
  const diffPp = +((bRate - aRate) * 100).toFixed(1);
  const [ciLo, ciHi] = ci95Diff(aRate, bRate, trialsTotal);

  let winner: 'A' | 'B' | 'tie' = 'tie';
  if (pValue < 0.05 && diffPp !== 0) winner = diffPp > 0 ? 'B' : 'A';

  return {
    engines: engineResults,
    pooled: {
      a: { cited: aCitedTotal, trials: trialsTotal, rate: aRate },
      b: { cited: bCitedTotal, trials: trialsTotal, rate: bRate },
      diffPp, z, pValue, significant: pValue < 0.05,
      ci95: [ciLo, ciHi], winner,
      underpowered: trialsTotal < 30,
    },
    totalCalls,
  };
}

// ── Statistics (ported from geo-lab/scripts/analyze.mjs) ──────────────────────
export function twoProportionZ(p1: number, n1: number, p2: number, n2: number): { z: number; pValue: number } {
  if (n1 === 0 || n2 === 0) return { z: 0, pValue: 1 };
  const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return { z: 0, pValue: 1 };
  const z = (p1 - p2) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  return { z: +z.toFixed(3), pValue: +pValue.toFixed(4) };
}

function normalCDF(z: number): number {
  // Abramowitz & Stegun 7.1.26 approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const prob = pdf * (0.319381530 * t - 0.356563782 * t ** 2 + 1.781477937 * t ** 3 - 1.821255978 * t ** 4 + 1.330274429 * t ** 5);
  return z > 0 ? 1 - prob : prob;
}

// 95% CI on the difference (B − A) of two proportions sharing trial count n.
function ci95Diff(pA: number, pB: number, n: number): [number, number] {
  if (n === 0) return [0, 0];
  const se = Math.sqrt((pA * (1 - pA)) / n + (pB * (1 - pB)) / n);
  const margin = 1.96 * se;
  const diff = pB - pA;
  return [+((diff - margin) * 100).toFixed(1), +((diff + margin) * 100).toFixed(1)];
}

// Each head-to-head trial is ONE engine call (both variants in one prompt).
// Perplexity is the dominant per-call cost; everything else is cheap.
export function estimateExperimentCost(engines: PlatformKey[], queries: number, trialsPerQuery: number): number {
  const trialsPerEngine = queries * trialsPerQuery;
  let cost = 0;
  for (const e of engines) {
    const perCall = e === 'perplexity' ? 0.006 : 0.0008;
    cost += trialsPerEngine * perCall;
  }
  return +cost.toFixed(3);
}
