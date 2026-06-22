#!/usr/bin/env node
/**
 * GEO Lab — LLM-judge attribution cross-check.
 *
 * The primary scorer (rescore.mjs) credits a citation only when the answer
 * reproduces a variant-UNIQUE phrase. That is biased toward more "quotable"
 * variants — a specific number ("43%") is easier to quote verbatim than a vague
 * phrase ("significantly") — which could manufacture or inflate an effect.
 *
 * This adds an INDEPENDENT, semantic attribution: a neutral LLM judge decides,
 * by meaning (not wording), whether each answer drew on content distinctive to
 * variant A, B, both, or neither. Writes citationsLlm per record + an llmJudge
 * summary into raw.json. analyze.mjs then reports the agreement between the two
 * methods — if they agree, the finding is not a quotability artifact.
 *
 * Non-fatal: skips cleanly if ANTHROPIC_API_KEY is unset.
 *
 * Usage: node scripts/llm-judge.mjs <experiment-dir>
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const experimentDir = process.argv[2];
if (!experimentDir) {
  console.error('Usage: node scripts/llm-judge.mjs <experiment-dir>');
  process.exit(1);
}

// WS6: judge with a DIFFERENT model family than the engines under test. The probe
// includes Claude, so a Claude judge invites a self-preference critique. Prefer
// OpenAI, then Gemini; fall back to Anthropic only if neither is configured.
const JUDGE =
  process.env.OPENAI_API_KEY ? { family: 'openai', model: 'gpt-4o-mini', key: process.env.OPENAI_API_KEY } :
  process.env.GEMINI_API_KEY ? { family: 'gemini', model: 'gemini-2.5-flash', key: process.env.GEMINI_API_KEY } :
  process.env.ANTHROPIC_API_KEY ? { family: 'anthropic', model: 'claude-haiku-4-5-20251001', key: process.env.ANTHROPIC_API_KEY } :
  null;
if (!JUDGE) {
  console.log('[llm-judge] No judge API key (OPENAI/GEMINI/ANTHROPIC) set — skipping cross-check (non-fatal).');
  process.exit(0);
}
if (JUDGE.family === 'anthropic') {
  console.warn('[llm-judge] ⚠ Using a Claude judge to grade answers that include Claude output — set OPENAI_API_KEY or GEMINI_API_KEY to avoid self-preference bias.');
}

// Route the judge prompt to whichever family was selected; return raw text.
async function callJudge(prompt) {
  if (JUDGE.family === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${JUDGE.key}` },
      body: JSON.stringify({ model: JUDGE.model, max_tokens: 100, temperature: 0, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message ?? JSON.stringify(data.error));
    return data.choices?.[0]?.message?.content ?? '';
  }
  if (JUDGE.family === 'gemini') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${JUDGE.model}:generateContent?key=${JUDGE.key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 100 } }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message ?? JSON.stringify(data.error));
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': JUDGE.key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: JUDGE.model, max_tokens: 100, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? JSON.stringify(data.error));
  return data.content?.[0]?.text ?? '';
}

const rawPath = path.join(experimentDir, 'results', 'raw.json');
const raw = JSON.parse(await fs.readFile(rawPath, 'utf8'));

const variantsDir = path.join(experimentDir, 'variants');
const variantFiles = (await fs.readdir(variantsDir)).filter(f => f.endsWith('.md'));
const variants = {};
for (const f of variantFiles) {
  variants[f.replace('.md', '')] = await fs.readFile(path.join(variantsDir, f), 'utf8');
}
const variantIds = Object.keys(variants).sort();

async function judge(response) {
  const sources = variantIds.map(id => `### Source ${id}\n${variants[id].slice(0, 4000)}`).join('\n\n');
  const prompt = `You are a strict, neutral citation auditor. An AI engine had these candidate sources available and produced the ANSWER below. For EACH source, decide whether the answer actually used or reproduced content/claims that are DISTINCTIVE to that source — judge by meaning, not exact wording, and ignore generic facts that the sources share.

${sources}

### ANSWER
${(response || '').slice(0, 6000)}

Return ONLY JSON, no prose: {${variantIds.map(id => `"${id}": true|false`).join(', ')}} — true means the answer drew on content distinctive to that source.`;

  const text = await callJudge(prompt);
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[0]);
    const out = {};
    for (const id of variantIds) out[id] = parsed[id] === true;
    return out;
  } catch {
    return null;
  }
}

let judged = 0, failed = 0;
for (const r of raw.results) {
  if (!r.response) continue;
  try {
    const c = await judge(r.response);
    if (c) { r.citationsLlm = c; judged++; }
    else { failed++; }
  } catch {
    failed++;
  }
}

const summary = {};
for (const id of variantIds) summary[id] = { cited: 0, n: 0 };
for (const r of raw.results) {
  if (!r.citationsLlm) continue;
  for (const id of variantIds) { summary[id].n++; if (r.citationsLlm[id]) summary[id].cited++; }
}
raw.llmJudge = { model: JUDGE.model, judgeFamily: JUDGE.family, judged, failed, summary, scoredAt: new Date().toISOString() };

await fs.writeFile(rawPath, JSON.stringify(raw, null, 2));
console.log(`[llm-judge] judged ${judged} responses (${failed} unparseable) with ${JUDGE.family}:${JUDGE.model}. Per-variant:`, JSON.stringify(summary));
