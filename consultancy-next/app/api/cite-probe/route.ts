import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { dbAdmin } from '@/lib/firebase-admin';

// Gemini 2.0 Flash: $0.10/1M input, $0.40/1M output tokens
async function logCiteProbesCost(userId: string, results: any[]): Promise<void> {
  if (!dbAdmin || userId === 'anonymous') return;
  // Rough estimate: each probe ~300 input + 200 output tokens
  const totalInputTokens = results.length * 300;
  const totalOutputTokens = results.length * 200;
  const estimatedCostUsd = (totalInputTokens / 1_000_000) * 0.10 + (totalOutputTokens / 1_000_000) * 0.40;
  await dbAdmin.collection('cost_audit').add({
    userId,
    feature: 'cite-probe',
    model: 'gemini-2.0-flash',
    provider: 'gemini',
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    estimatedCostUsd,
    totalCostUsd: estimatedCostUsd,
    queriesRun: results.length,
    timestamp: new Date().toISOString(),
  });
}

// Default GEO-space queries — auspexi's target citation territory
const DEFAULT_QUERIES = [
  'What are the best tools for generative engine optimization?',
  'How do I get my brand cited by AI like ChatGPT and Perplexity?',
  'What companies specialize in GEO optimization for AI search?',
  'How do I optimize content to appear in AI-generated answers?',
  'What is generative engine optimization and who offers it?',
  'How can brands increase their share of voice in AI responses?',
  'Best software for tracking AI citation and brand mentions in LLMs?',
];

function checkCitation(response: string, brand: string, domain: string): {
  cited: boolean;
  excerpt: string | null;
} {
  const lower = response.toLowerCase();
  const brandLower = brand.toLowerCase();
  const domainLower = domain.toLowerCase().replace(/^https?:\/\//, '');

  const cited = lower.includes(brandLower) || lower.includes(domainLower);
  if (!cited) return { cited: false, excerpt: null };

  // Extract the sentence(s) containing the citation
  const sentences = response.split(/(?<=[.!?])\s+/);
  const match = sentences.find(s =>
    s.toLowerCase().includes(brandLower) || s.toLowerCase().includes(domainLower)
  );
  return { cited: true, excerpt: match || null };
}

export async function POST(request: Request) {
  try {
    const { brand, domain, userId = 'anonymous', queries } = await request.json();

    if (!brand || !domain) {
      return NextResponse.json({ error: 'brand and domain are required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const testQueries: string[] = queries?.length > 0 ? queries : DEFAULT_QUERIES;
    const timestamp = new Date().toISOString();

    const results = await Promise.all(
      testQueries.map(async (query) => {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: query,
            config: {
              temperature: 0.3,
              maxOutputTokens: 600,
            },
          });

          const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const { cited, excerpt } = checkCitation(text, brand, domain);

          return {
            query,
            cited,
            excerpt,
            responseLength: text.length,
            timestamp,
          };
        } catch (err: any) {
          return { query, cited: false, excerpt: null, error: err.message, timestamp };
        }
      })
    );

    const citedCount = results.filter(r => r.cited).length;
    const citationRate = Math.round((citedCount / results.length) * 100);

    const probeResult = {
      brand,
      domain,
      userId,
      timestamp,
      citationRate,
      citedCount,
      totalQueries: results.length,
      results,
    };

    // Persist to Firestore for trend tracking + cost audit
    if (dbAdmin && userId !== 'anonymous') {
      try {
        await dbAdmin.collection('citation_tests').add(probeResult);
        logCiteProbesCost(userId, results).catch(() => {});
      } catch (err) {
        console.error('Failed to persist citation test:', err);
      }
    }

    return NextResponse.json({ success: true, ...probeResult });
  } catch (err: any) {
    console.error('cite-probe error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
