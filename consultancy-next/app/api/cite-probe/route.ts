import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { dbAdmin } from '@/lib/firebase-admin';

// Build 7 brand-and-keyword-specific queries so the probe is relevant to the actual client
function buildQueries(brand: string, _domain: string, keywords: string[]): string[] {
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

function checkCitation(response: string, brand: string, domain: string): {
  cited: boolean;
  excerpt: string | null;
} {
  const lower = response.toLowerCase();
  const brandLower = brand.toLowerCase();
  const domainLower = domain.toLowerCase().replace(/^https?:\/\//, '');
  const cited = lower.includes(brandLower) || lower.includes(domainLower);
  if (!cited) return { cited: false, excerpt: null };
  const sentences = response.split(/(?<=[.!?])\s+/);
  const match = sentences.find(s =>
    s.toLowerCase().includes(brandLower) || s.toLowerCase().includes(domainLower)
  );
  return { cited: true, excerpt: match || null };
}

interface PlatformResult {
  cited: boolean;
  excerpt: string | null;
  error?: string;
  skipped?: boolean;
}

async function probeGemini(query: string, brand: string, domain: string): Promise<PlatformResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) return { cited: false, excerpt: null, skipped: true };
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: { temperature: 0.3, maxOutputTokens: 600 },
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return checkCitation(text, brand, domain);
  } catch (e: any) {
    return { cited: false, excerpt: null, error: e.message };
  }
}

async function probeChatGPT(query: string, brand: string, domain: string): Promise<PlatformResult> {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) return { cited: false, excerpt: null, skipped: true };
  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: query }],
      max_tokens: 600,
      temperature: 0.3,
    });
    const text = response.choices[0]?.message?.content || '';
    return checkCitation(text, brand, domain);
  } catch (e: any) {
    return { cited: false, excerpt: null, error: e.message };
  }
}

async function probePerplexity(query: string, brand: string, domain: string): Promise<PlatformResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY || '';
  if (!apiKey) return { cited: false, excerpt: null, skipped: true };
  try {
    const client = new OpenAI({ apiKey, baseURL: 'https://api.perplexity.ai' });
    const response = await client.chat.completions.create({
      model: 'sonar',
      messages: [{ role: 'user', content: query }],
      max_tokens: 600,
    } as any);
    const text = response.choices[0]?.message?.content || '';
    return checkCitation(text, brand, domain);
  } catch (e: any) {
    return { cited: false, excerpt: null, error: e.message };
  }
}

async function probeClaude(query: string, brand: string, domain: string): Promise<PlatformResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return { cited: false, excerpt: null, skipped: true };
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
    return checkCitation(text, brand, domain);
  } catch (e: any) {
    return { cited: false, excerpt: null, error: e.message };
  }
}

export async function POST(request: Request) {
  try {
    const { brand, domain, userId = 'anonymous', queries, keywords = [] } = await request.json();

    if (!brand || !domain) {
      return NextResponse.json({ error: 'brand and domain are required' }, { status: 400 });
    }

    // Use caller-supplied queries, else build brand+keyword-specific ones, else generic fallback
    const testQueries: string[] = queries?.length > 0 ? queries : buildQueries(brand, domain, keywords);
    const timestamp = new Date().toISOString();

    // Each query is sent to all platforms in parallel
    const queryResults = await Promise.all(
      testQueries.map(async (query) => {
        const [gemini, chatgpt, perplexity, claude] = await Promise.all([
          probeGemini(query, brand, domain),
          probeChatGPT(query, brand, domain),
          probePerplexity(query, brand, domain),
          probeClaude(query, brand, domain),
        ]);

        const platforms = { gemini, chatgpt, perplexity, claude };
        const active = Object.values(platforms).filter(p => !p.skipped);
        const citedOnAny = active.some(p => p.cited);
        const firstExcerpt = active.find(p => p.cited && p.excerpt)?.excerpt || null;

        return { query, cited: citedOnAny, excerpt: firstExcerpt, platforms, timestamp };
      })
    );

    // Per-platform citation rates (null = API key not configured)
    const platformNames = ['gemini', 'chatgpt', 'perplexity', 'claude'] as const;
    const platformRates: Record<string, number | null> = {};
    for (const p of platformNames) {
      const pResults = queryResults.map(r => r.platforms[p]);
      const active = pResults.filter(r => !r.skipped);
      platformRates[p] = active.length === 0 ? null
        : Math.round((active.filter(r => r.cited).length / active.length) * 100);
    }

    const activeRates = Object.values(platformRates).filter(r => r !== null) as number[];
    const citationRate = activeRates.length > 0
      ? Math.round(activeRates.reduce((a, b) => a + b, 0) / activeRates.length)
      : 0;

    const citedCount = queryResults.filter(r => r.cited).length;
    const activePlatforms = activeRates.length;

    const probeResult = {
      brand, domain, userId, timestamp,
      citationRate, citedCount,
      totalQueries: testQueries.length,
      activePlatforms, platformRates,
      results: queryResults,
    };

    if (dbAdmin && userId !== 'anonymous') {
      try {
        await dbAdmin.collection('citation_tests').add(probeResult);
        // Log the probe action for the training data pipeline (action → outcome join)
        dbAdmin.collection('audit_logs').add({
          userId,
          action: 'Ran Citation Probe',
          details: {
            citationRate,
            citedCount,
            totalQueries: testQueries.length,
            activePlatforms,
            platformRates,
          },
          timestamp: new Date().toISOString(),
        }).catch(() => {});
        // Estimated cost across active platforms
        const cost =
          (platformRates.gemini !== null ? (testQueries.length * 500 / 1_000_000) * 0.40 : 0) +
          (platformRates.chatgpt !== null ? (testQueries.length * 800 / 1_000_000) * 0.60 : 0) +
          (platformRates.perplexity !== null ? testQueries.length * 0.005 : 0) +
          (platformRates.claude !== null ? (testQueries.length * 800 / 1_000_000) * 4.00 : 0);
        dbAdmin.collection('cost_audit').add({
          userId, feature: 'cite-probe-multi', timestamp,
          platforms: platformNames.filter(p => platformRates[p] !== null),
          queriesRun: testQueries.length,
          estimatedCostUsd: cost,
          totalCostUsd: cost,
        }).catch(() => {});
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
