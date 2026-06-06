#!/usr/bin/env node
/**
 * GEO Lab — Multi-LLM Citation Probe Runner
 *
 * Usage:
 *   node probe.mjs <experiment-dir> [--platform gemini,openai,perplexity,claude] [--trials 30]
 *
 * Output:
 *   <experiment-dir>/results/raw.json
 *
 * Requires .env with:
 *   GEMINI_API_KEY, OPENAI_API_KEY, PERPLEXITY_API_KEY, ANTHROPIC_API_KEY
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const args = process.argv.slice(2);
const experimentDir = args[0];
if (!experimentDir) {
  console.error('Usage: node probe.mjs <experiment-dir>');
  process.exit(1);
}

const platformArg = args.find(a => a.startsWith('--platform'))?.split('=')[1]
  ?? args[args.indexOf('--platform') + 1];
const platforms = platformArg
  ? platformArg.split(',')
  : ['gemini', 'openai', 'perplexity', 'claude'];

const trialsArg = args.find(a => a.startsWith('--trials'))?.split('=')[1]
  ?? args[args.indexOf('--trials') + 1];
const trialsPerVariant = parseInt(trialsArg ?? '30', 10);

// ── Load experiment design ──────────────────────────────────────────────────
const designPath = path.join(experimentDir, 'DESIGN.md');
const variantsDir = path.join(experimentDir, 'variants');

const designText = await fs.readFile(designPath, 'utf8').catch(() => {
  console.error(`Missing DESIGN.md in ${experimentDir}`);
  process.exit(1);
});

// Parse variants from variants/ folder
const variantFiles = (await fs.readdir(variantsDir).catch(() => [])).filter(f => f.endsWith('.md'));
if (variantFiles.length < 2) {
  console.error(`Need at least 2 variant files in ${variantsDir}/`);
  process.exit(1);
}
const variants = await Promise.all(
  variantFiles.map(async f => ({
    id: f.replace('.md', ''),
    content: await fs.readFile(path.join(variantsDir, f), 'utf8'),
  }))
);

// Parse queries from DESIGN.md  (lines under "## Queries" section)
const queriesMatch = designText.match(/## Queries\n([\s\S]*?)(?=\n## |\n$)/);
const queries = queriesMatch
  ? queriesMatch[1].trim().split('\n').map(l => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean)
  : [];
if (queries.length === 0) {
  console.error('No queries found in DESIGN.md under "## Queries" section.');
  process.exit(1);
}

console.log(`\nExperiment: ${experimentDir}`);
console.log(`Variants: ${variants.map(v => v.id).join(', ')}`);
console.log(`Queries: ${queries.length}`);
console.log(`Platforms: ${platforms.join(', ')}`);
console.log(`Trials per variant: ${trialsPerVariant}\n`);

// ── LLM callers ─────────────────────────────────────────────────────────────

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
    }
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

async function callOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? null;
}

async function callPerplexity(prompt) {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return null;
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? null;
}

async function callClaude(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? null;
}

const callers = { gemini: callGemini, openai: callOpenAI, perplexity: callPerplexity, claude: callClaude };

// ── Build probe prompt ───────────────────────────────────────────────────────
function buildPrompt(query, variantContents) {
  // Randomise source order to counter position bias
  const shuffled = [...variantContents].sort(() => Math.random() - 0.5);
  const sourceBlock = shuffled
    .map((v, i) => `[SOURCE ${String.fromCharCode(65 + i)}]\n${v.content}`)
    .join('\n\n---\n\n');

  return `You are answering a question using the provided sources. Cite any source you draw on by its label (e.g. "According to Source A…").

Question: ${query}

Sources:
${sourceBlock}

Answer concisely (2–4 sentences), citing the sources you used.`;
}

// ── Check which sources were cited ──────────────────────────────────────────
function parseCitations(response, variantIds) {
  // Check each variant by its label position (A, B, C…) and by distinctive phrases
  const cited = {};
  const lower = response.toLowerCase();
  variantIds.forEach((id, i) => {
    const label = `source ${String.fromCharCode(65 + i)}`;
    cited[id] = lower.includes(label);
  });
  return cited;
}

// ── Run probes ───────────────────────────────────────────────────────────────
const results = [];
let trialNum = 0;
const total = trialsPerVariant * queries.length * platforms.length;

for (let t = 0; t < trialsPerVariant; t++) {
  for (const query of queries) {
    const prompt = buildPrompt(query, variants);
    for (const platform of platforms) {
      const caller = callers[platform];
      if (!caller) continue;

      trialNum++;
      process.stdout.write(`\r[${trialNum}/${total}] ${platform} — trial ${t + 1}/${trialsPerVariant}   `);

      let response = null;
      let error = null;
      try {
        response = await caller(prompt);
      } catch (e) {
        error = e.message;
      }

      const citations = response ? parseCitations(response, variants.map(v => v.id)) : {};

      results.push({
        trial: t + 1,
        query,
        platform,
        response: response?.slice(0, 500) ?? null,
        error,
        citations,
        timestamp: new Date().toISOString(),
      });

      // Small pause to stay within rate limits
      await new Promise(r => setTimeout(r, 300));
    }
  }
}

console.log('\n\nProbe complete.\n');

// ── Save results ─────────────────────────────────────────────────────────────
const resultsDir = path.join(experimentDir, 'results');
await fs.mkdir(resultsDir, { recursive: true });
const outPath = path.join(resultsDir, 'raw.json');
await fs.writeFile(outPath, JSON.stringify({ meta: { variants: variants.map(v => v.id), queries, platforms, trialsPerVariant, runAt: new Date().toISOString() }, results }, null, 2));

console.log(`Results saved to ${outPath}`);
console.log('Run: node scripts/analyze.mjs ' + experimentDir);
