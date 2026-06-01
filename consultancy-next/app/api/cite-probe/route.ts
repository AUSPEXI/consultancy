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

// Extract meaningful keywords from a statement, excluding stopwords
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

function checkCitation(
  response: string,
  brand: string,
  domain: string,
  knownFalses: string[] = [],
): {
  cited: boolean;
  accurate: boolean;
  misinformation: string | null;
  excerpt: string | null;
} {
  const lower = response.toLowerCase();
  const brandLower = brand.toLowerCase();
  const domainLower = domain.toLowerCase().replace(/^https?:\/\//, '');

  // Negative-intent phrases — if the response contains these alongside the brand name
  // it means the AI explicitly doesn't know the brand, which is NOT a citation
  const NEGATIVE_PATTERNS = [
    "couldn't find any information",
    "could not find any information",
    "don't have any information",
    "do not have any information",
    "no information about",
    "not familiar with",
    "not in my knowledge",
    "outside my knowledge",
    "i cannot find",
    "i can't find",
    "unable to find information",
    "doesn't appear in my",
    "does not appear in my",
    "isn't a company",
    "is not a company",
    "let me imagine",
    "let's imagine",
    "hypothetically",
    "as a hypothetical",
    "i'll assume",
    "i will assume",
  ];

  const hasNegative = NEGATIVE_PATTERNS.some(p => lower.includes(p));
  const mentionsBrand = lower.includes(brandLower) || lower.includes(domainLower);

  // Brand mentioned but only in a negative/unknown context → not a citation
  if (!mentionsBrand || hasNegative) {
    return { cited: false, accurate: true, misinformation: null, excerpt: null };
  }

  const sentences = response.split(/(?<=[.!?])\s+/);
  const match = sentences.find(s =>
    s.toLowerCase().includes(brandLower) || s.toLowerCase().includes(domainLower)
  );

  // Misinformation detection: keyword cluster matching against known-false statements
  let misinformationSnippet: string | null = null;
  if (knownFalses.length > 0) {
    for (const falseStmt of knownFalses) {
      const keywords = extractKeywords(falseStmt);
      if (keywords.length < 2) continue;
      // Require at least 40% of keywords to match (minimum 2)
      const matchThreshold = Math.max(2, Math.floor(keywords.length * 0.4));
      const matchCount = keywords.filter(kw => lower.includes(kw)).length;
      if (matchCount >= matchThreshold) {
        misinformationSnippet = sentences.find(s => {
          const sl = s.toLowerCase();
          return keywords.filter(kw => sl.includes(kw)).length >= 2;
        }) || match || null;
        break;
      }
    }
  }

  return {
    cited: true,
    accurate: misinformationSnippet === null,
    misinformation: misinformationSnippet,
    excerpt: match || null,
  };
}

interface PlatformResult {
  cited: boolean;
  accurate: boolean;
  misinformation: string | null;
  excerpt: string | null;
  error?: string;
  skipped?: boolean;
}

async function probeGemini(query: string, brand: string, domain: string, knownFalses: string[]): Promise<PlatformResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) return { cited: false, accurate: true, misinformation: null, excerpt: null, skipped: true };
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
  if (!apiKey) return { cited: false, accurate: true, misinformation: null, excerpt: null, skipped: true };
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
  if (!apiKey) return { cited: false, accurate: true, misinformation: null, excerpt: null, skipped: true };
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
  if (!apiKey) return { cited: false, accurate: true, misinformation: null, excerpt: null, skipped: true };
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

export async function POST(request: Request) {
  try {
    const {
      brand, domain, userId = 'anonymous', queries, keywords = [],
      negativeStatements: clientFalses = [],
    } = await request.json();

    if (!brand || !domain) {
      return NextResponse.json({ error: 'brand and domain are required' }, { status: 400 });
    }

    // Load known-false statements: prefer client-supplied, fall back to Firestore
    let knownFalses: string[] = clientFalses;
    if (dbAdmin && userId !== 'anonymous' && knownFalses.length === 0) {
      try {
        const userDoc = await dbAdmin.collection('users').doc(userId).get();
        knownFalses = userDoc.data()?.negativeStatements || [];
      } catch (_) {}
    }

    // Use caller-supplied queries, else build brand+keyword-specific ones, else generic fallback
    const testQueries: string[] = queries?.length > 0 ? queries : buildQueries(brand, domain, keywords);
    const timestamp = new Date().toISOString();

    const queryResults = await Promise.all(
      testQueries.map(async (query) => {
        const [gemini, chatgpt, perplexity, claude] = await Promise.all([
          probeGemini(query, brand, domain, knownFalses),
          probeChatGPT(query, brand, domain, knownFalses),
          probePerplexity(query, brand, domain, knownFalses),
          probeClaude(query, brand, domain, knownFalses),
        ]);

        const platforms = { gemini, chatgpt, perplexity, claude };
        const active = Object.values(platforms).filter(p => !p.skipped);
        const citedOnAny = active.some(p => p.cited);
        const hasMisinformation = active.some(p => p.cited && !p.accurate);
        // Prefer a verified-accurate excerpt; fall back to any excerpt
        const firstExcerpt = active.find(p => p.cited && p.accurate && p.excerpt)?.excerpt
          || active.find(p => p.cited && p.excerpt)?.excerpt || null;
        const misinformationSnippet = active.find(p => p.misinformation)?.misinformation || null;

        return {
          query, cited: citedOnAny,
          accurate: !hasMisinformation,
          misinformation: misinformationSnippet,
          excerpt: firstExcerpt,
          platforms, timestamp,
        };
      })
    );

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
    const misinformationCount = queryResults.filter(r => r.cited && !r.accurate).length;
    const activePlatforms = activeRates.length;

    const probeResult = {
      brand, domain, userId, timestamp,
      citationRate, citedCount, misinformationCount,
      totalQueries: testQueries.length,
      activePlatforms, platformRates,
      results: queryResults,
    };

    if (dbAdmin && userId !== 'anonymous') {
      try {
        await dbAdmin.collection('citation_tests').add(probeResult);
        dbAdmin.collection('audit_logs').add({
          userId,
          action: 'Ran Citation Probe',
          details: { citationRate, citedCount, misinformationCount, totalQueries: testQueries.length, activePlatforms, platformRates },
          timestamp: new Date().toISOString(),
        }).catch(() => {});
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
