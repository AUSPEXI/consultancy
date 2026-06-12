import { NextRequest, NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { SOVMetricsSchema } from '@/lib/output-validation';
import OpenAI from 'openai';
import Exa from 'exa-js';

let exaInstance: Exa | null = null;

function getExa(): Exa {
  if (!exaInstance) {
    const apiKey = process.env.EXA_API_KEY || process.env.NEXT_PUBLIC_EXA_API_KEY;
    if (!apiKey) throw new Error('EXA_API_KEY is not configured');
    exaInstance = new Exa(apiKey);
  }
  return exaInstance;
}

/**
 * Query Perplexity Sonar (real-time web search) for brand-specific facts
 * and write them to knowledge_graph as ground truth for the UMAP latent space map.
 * Old perplexity-sonar entries for this user are replaced on each audit run.
 */
async function syncPerplexityGroundTruth(
  userId: string,
  brand: string,
  keywords: string[]
): Promise<number> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return 0;

  let { dbAdmin } = await import('@/lib/firebase-admin');
  if (!dbAdmin) return 0;

  const client = new OpenAI({ apiKey: key, baseURL: 'https://api.perplexity.ai' });
  let factsWritten = 0;

  for (const keyword of keywords.slice(0, 2)) {
    try {
      const response = await client.chat.completions.create({
        model: 'sonar',
        messages: [{
          role: 'user',
          content: `What specific facts, features, differentiators, or claims is "${brand}" known for in the context of "${keyword}"? List concrete, citable statements only.`,
        }],
        max_tokens: 600,
      } as any);

      const text = response.choices[0]?.message?.content || '';
      if (!text) continue;

      const noInfoPatterns = /could not find|no information|no results|not mentioned|no specific|unable to find|don't have|no data|not available|couldn't find|not indexed/i;

      // Split into individual sentences as discrete fact units
      const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 25 && s.length < 300 && !s.startsWith('#') && !noInfoPatterns.test(s));

      const writeBatch = dbAdmin.batch();
      for (const sentence of sentences.slice(0, 6)) {
        const ref = dbAdmin.collection('knowledge_graph').doc();
        writeBatch.set(ref, {
          userId,
          fact: sentence,
          source: 'perplexity-sonar',
          keyword,
          brand,
          timestamp: new Date().toISOString(),
        });
        factsWritten++;
      }
      await writeBatch.commit();
    } catch {
      // Non-critical — silent fail per keyword
    }
  }

  return factsWritten;
}

export async function POST(req: NextRequest) {
  const { requireTier } = await import('@/lib/api-auth');
  const authResult = await requireTier(req, 'Starter');
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { brand, domain, competitors, keywords, sentimentPrompts } = await req.json();

    if (!brand || !domain || !keywords || keywords.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const defaultSentimentPrompts = [
      'Best alternative to top competitor?',
      'Is the product reliable for enterprise?',
      'Common user complaints & reviews?',
      'Pricing compared to market average?',
    ];

    const promptsToUse =
      sentimentPrompts && sentimentPrompts.length > 0 ? sentimentPrompts : defaultSentimentPrompts;
    const sentimentSchema = promptsToUse
      .map(
        (p: string) =>
          `{ "prompt": "${p.replace(/"/g, '\\"')}", "score": <int -100 to 100> }`
      )
      .join(',\n    ');

    const exa = getExa();

    // 1. Search Exa for the keywords — run in parallel to cut sequential wait time
    const searchResults = await Promise.all(
      keywords.slice(0, 3).map((keyword: string) =>
        exa.searchAndContents(keyword, {
          type: 'neural',
          useAutoprompt: true,
          numResults: 5,
          text: true,
        }).then((r: any) => ({ keyword, results: r.results }))
        .catch(() => ({ keyword, results: [] }))
      )
    );
    let combinedContext = '';
    for (const { keyword, results } of searchResults) {
      combinedContext += `\n\n--- Results for keyword: ${keyword} ---\n`;
      combinedContext += results
        .map((r: any) => r.text ?? '')
        .join('\n\n')
        .substring(0, 5000);
    }

    // 2. Run main SOV analysis + Perplexity ground truth sync in parallel
    const [result, perplexityFacts] = await Promise.all([
      llmOrchestrator.executeCall<any>({
        userId,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        prompt: `
You are an expert Generative Engine Optimization (GEO) analyst.
Analyze the following search results for the target keywords.
Calculate the "Share of Voice" (SOV) percentage for the primary brand and its competitors.

Primary Brand: ${brand}
Domain: ${domain}
Competitors: ${competitors.join(', ')}

Search Context:
${combinedContext.substring(0, 30000)}

Return ONLY a JSON object.
IMPORTANT: Base every estimate strictly on citation frequency in the context above.
If the brand is NOT mentioned in the context, return 0 for its scores. Never invent
a baseline. Honest zeros are required; this data feeds an ML training pipeline.

{
  "aSov": <integer percentage for ${brand}>,
  "compA": <integer percentage for ${competitors[0] || 'Competitor A'}>,
  "compB": <integer percentage for ${competitors[1] || 'Competitor B'}>,
  "compGap": <integer percentage difference between brand and compA>,
  "aiTraffic": <integer count indicative of traffic source strength>,
  "aiCitations": <integer count of explicit brand citations>,
  "err": <integer 0-100 indicating how robustly AI remembers brand facts>,
  "platforms": {
    "chatgpt": <integer 0-100>,
    "perplexity": <integer 0-100>,
    "claude": <integer 0-100>,
    "gemini": <integer 0-100>
  },
  "radar": [
    { "subject": "Pricing Insights", "brandScore": <int>, "compScore": <int> },
    { "subject": "Feature Comparison", "brandScore": <int>, "compScore": <int> },
    { "subject": "Implementation Docs", "brandScore": <int>, "compScore": <int> },
    { "subject": "Customer Support", "brandScore": <int>, "compScore": <int> },
    { "subject": "Security & Auth", "brandScore": <int>, "compScore": <int> },
    { "subject": "Enterprise Ready", "brandScore": <int>, "compScore": <int> }
  ],
  "sentiment": [
    ${sentimentSchema}
  ],
  "topUrls": [
    { "path": "/pricing", "citations": <int> },
    { "path": "/blog/some-article-based-on-context", "citations": <int> },
    { "path": "/features", "citations": <int> }
  ]
}
`,
        schema: SOVMetricsSchema,
      }),
      syncPerplexityGroundTruth(userId, brand, keywords).catch(() => 0),
    ]);

    if (!result.success) {
      const isQuota = result.error?.includes('429') || result.error?.includes('RESOURCE_EXHAUSTED') || result.error?.includes('quota');
      return NextResponse.json(
        {
          error: isQuota
            ? 'AI quota exceeded. Ensure billing is enabled at console.cloud.google.com → APIs → Generative Language API.'
            : result.error,
          validationErrors: result.validationErrors,
          rawOutput: result.rawOutput,
        },
        { status: isQuota ? 429 : 500 }
      );
    }

    const parsedData = result.data;

    return NextResponse.json({
      success: true,
      providerUsed: result.providerUsed || 'gemini',
      perplexityFactsSynced: perplexityFacts,
      // Honest zeros — no invented floors or random jitter. Missing model output
      // means "no signal", not "make something up".
      metrics: {
        aSov: parsedData.aSov ?? 0,
        err: parsedData.err ?? 0,
        compA: parsedData.compA ?? 0,
        compB: parsedData.compB ?? 0,
        compC: parsedData.compC ?? 0,
        compD: parsedData.compD ?? 0,
        compGap: parsedData.compGap ?? ((parsedData.aSov ?? 0) - (parsedData.compA ?? 0)),
        aiTraffic: parsedData.aiTraffic ?? 0,
        platforms: parsedData.platforms ?? { chatgpt: 0, perplexity: 0, claude: 0, gemini: 0 },
        radar: parsedData.radar || [],
        sentiment: parsedData.sentiment || [],
        topUrls: parsedData.topUrls || [],
        // LLM-estimated from search context, not directly measured.
        synthetic: true,
        estimationMethod: 'llm-context-estimate',
      },
    });
  } catch (error: any) {
    console.error('Error running daily audit:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
