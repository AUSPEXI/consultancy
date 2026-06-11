import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getExa } from '@/lib/exa';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { requireAuth } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';

// The LLM classifies real Exa results by index — it NEVER emits URLs or titles,
// so every link surfaced to the user is a genuine, crawlable source.
const ClassificationSchema = z.object({
  overallSentiment: z.enum(['Positive', 'Neutral', 'Negative', 'Mixed']),
  riskScore: z.number().min(0).max(100),
  actionPlan: z.string().min(10),
  threads: z
    .array(
      z.object({
        index: z.number().int().min(0),
        sentiment: z.enum(['Positive', 'Neutral', 'Negative', 'Mixed']),
        summary: z.string().min(1),
      })
    )
    .default([]),
});

interface ExaThread {
  url: string;
  title: string;
  text: string;
  publishedDate: string | null;
}

async function searchConsensus(brand: string): Promise<ExaThread[]> {
  const exa = getExa();
  const queryText = `What are people saying about ${brand}? Discussions, reviews, complaints, and opinions`;

  // Primary: restrict to the high-signal consensus platforms that feed LLM training.
  let results: any[] = [];
  try {
    const restricted = await exa.searchAndContents(queryText, {
      type: 'neural',
      useAutoprompt: true,
      numResults: 12,
      includeDomains: ['reddit.com', 'quora.com', 'news.ycombinator.com'],
      text: { maxCharacters: 2000 },
    });
    results = restricted.results || [];
  } catch (err) {
    console.warn('[brand-monitor] restricted Exa search failed, falling back:', err);
  }

  // Fallback: if the platforms returned nothing, widen to the open web so the
  // user still gets a real signal instead of an empty (or fabricated) result.
  if (results.length === 0) {
    const open = await exa.searchAndContents(queryText, {
      type: 'neural',
      useAutoprompt: true,
      numResults: 10,
      text: { maxCharacters: 2000 },
    });
    results = open.results || [];
  }

  return results
    .filter((r: any) => r.url)
    .map((r: any) => ({
      url: r.url,
      title: r.title || r.url,
      text: (r.text || '').trim(),
      publishedDate: r.publishedDate || null,
    }));
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { brand } = await request.json();
    if (!brand?.trim()) {
      return NextResponse.json({ error: 'brand is required' }, { status: 400 });
    }
    const brandName = brand.trim();

    const threads = await searchConsensus(brandName);

    // Log Exa search cost (~$0.025 per neural search)
    if (dbAdmin && userId) {
      dbAdmin.collection('cost_audit').add({
        userId,
        feature: 'brand-monitor',
        model: 'exa-neural',
        provider: 'exa',
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0.025,
        totalCostUsd: 0.025,
        exaResults: threads.length,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    if (threads.length === 0) {
      return NextResponse.json({
        success: true,
        result: {
          overallSentiment: 'Neutral',
          riskScore: 0,
          driftCount: 0,
          totalSignals: 0,
          actionPlan: `No public discussion of "${brandName}" was found on Reddit, Quora, or Hacker News right now. This is an opportunity: seed authoritative, entity-dense content on these high-crawl platforms to build a positive presence before competitors define the narrative for you.`,
          threads: [],
        },
      });
    }

    // Build a numbered, source-grounded context for classification.
    const context = threads
      .map((t, i) => `[${i}] TITLE: ${t.title}\nURL: ${t.url}\nEXCERPT: ${t.text.substring(0, 1200)}`)
      .join('\n\n');

    const prompt = `You are a brand perception analyst for Generative Engine Optimization (GEO). The brand being monitored is "${brandName}".

Below are REAL search results from Reddit, Quora, and other public forums about this brand. Each is numbered. Analyse the actual text of each result.

For EACH numbered result, classify the sentiment toward "${brandName}" as Positive, Neutral, Negative, or Mixed, and write a one-sentence factual summary of what the thread actually says (grounded ONLY in the excerpt — do not invent details).

Then assess the OVERALL picture:
- overallSentiment: the dominant sentiment across all results (Positive, Neutral, or Negative)
- riskScore (0-100): "context poisoning" risk — how likely negative or misleading narratives about ${brandName} are to be absorbed into future LLM training. More negative/misleading threads on high-authority platforms = higher risk.
- actionPlan: 2-3 sentences of specific defensive GEO advice based on what you actually found.

RESULTS:
${context}

Return ONLY valid JSON:
{
  "overallSentiment": "Positive|Neutral|Negative",
  "riskScore": 0-100,
  "actionPlan": "...",
  "threads": [ { "index": 0, "sentiment": "Positive|Neutral|Negative|Mixed", "summary": "..." } ]
}`;

    const result = await llmOrchestrator.executeCall<z.infer<typeof ClassificationSchema>>({
      userId: userId || 'anonymous',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      schema: ClassificationSchema,
      feature: 'brand-monitor',
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Classification failed',
          validationErrors: result.validationErrors,
          rawOutput: result.rawOutput,
        },
        { status: 500 }
      );
    }

    const { overallSentiment, riskScore, actionPlan } = result.data;

    // Map the LLM's per-index classification back onto the REAL Exa threads.
    // The URL and title always come from Exa, never the model.
    const classified = result.data.threads
      .filter((c) => c.index >= 0 && c.index < threads.length)
      .map((c) => ({
        url: threads[c.index].url,
        title: threads[c.index].title,
        sentiment: c.sentiment,
        summary: c.summary,
      }));

    const driftCount = classified.filter((t) => t.sentiment === 'Negative').length;

    return NextResponse.json({
      success: true,
      result: {
        overallSentiment,
        riskScore: Math.round(riskScore),
        driftCount,
        totalSignals: threads.length,
        actionPlan,
        threads: classified,
      },
    });
  } catch (err: any) {
    console.error('brand-monitor error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
