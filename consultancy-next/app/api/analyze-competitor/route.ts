import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getExa } from '@/lib/exa';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { requireAuth } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';

/**
 * Competitor decay analysis — REAL data only.
 *
 * The old route read a synthetic CSV (geo_synthetic_10000.csv): typing a real
 * competitor returned fabricated decay/content/entity scores. This rebuild uses
 * Exa to pull the competitor's actual most-recent indexed pages, computes a real
 * freshness signal (days since their newest published content), and runs ONE
 * cheap LLM pass that scores ONLY the real page excerpts for entity density and
 * statistical-anchor presence (index-based — it never invents pages). When Exa
 * finds nothing public, we say so honestly instead of inventing a verdict.
 */

const ClassificationSchema = z.object({
  entityDensityScore: z.number().min(0).max(100),
  statisticalAnchorsScore: z.number().min(0).max(100),
  contentScore: z.number().min(0).max(100),
  vulnerabilities: z.array(z.string().min(8)).default([]),
});

interface ExaPage {
  url: string;
  title: string;
  text: string;
  publishedDate: string | null;
}

async function fetchCompetitorPages(hostname: string): Promise<ExaPage[]> {
  const exa = getExa();
  const queryText = `Latest articles, product pages, and content from ${hostname}`;
  const res = await exa.searchAndContents(queryText, {
    type: 'keyword',
    numResults: 12,
    includeDomains: [hostname],
    text: { maxCharacters: 1500 },
  });
  return (res.results || [])
    .filter((r: any) => r.url)
    .map((r: any) => ({
      url: r.url,
      title: r.title || r.url,
      text: (r.text || '').trim(),
      publishedDate: r.publishedDate || null,
    }));
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((Date.now() - t) / (1000 * 60 * 60 * 24));
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { hostname } = await request.json();
    if (!hostname?.trim()) {
      return NextResponse.json({ error: 'hostname is required' }, { status: 400 });
    }
    const host = hostname.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const competitorName = host.split('.')[0].replace(/^\w/, (c: string) => c.toUpperCase());

    const pages = await fetchCompetitorPages(host);

    // Log Exa search cost (~$0.025 per search)
    if (dbAdmin && userId) {
      dbAdmin.collection('cost_audit').add({
        userId,
        feature: 'analyze-competitor',
        model: 'exa-keyword',
        provider: 'exa',
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0.025,
        totalCostUsd: 0.025,
        exaResults: pages.length,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    // Honest insufficient-data state — no public content, no fabricated verdict.
    if (pages.length === 0) {
      return NextResponse.json({
        success: true,
        result: {
          name: competitorName,
          insufficientData: true,
          decayStatus: 'unknown',
          trojanHorseOpportunity: false,
          vulnerabilities: [],
          totalSignals: 0,
          message: `No public content for ${host} is currently indexed by our crawler. We can't assess their AI-citation decay yet — this often means they have a thin or well-gated web presence. Try the root domain, or run a Citation Probe on your shared keywords to see who AI actually cites.`,
        },
      });
    }

    // ── Real freshness signal ────────────────────────────────────────────────
    const ages = pages.map((p) => daysSince(p.publishedDate)).filter((d): d is number => d !== null);
    const newestAge = ages.length ? Math.min(...ages) : null;     // most recent page
    const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null;

    // Decay status grounded in real recency of their newest indexed content.
    let decayStatus: 'healthy' | 'decaying' | 'stale' | 'unknown' = 'unknown';
    if (newestAge !== null) {
      if (newestAge > 365) decayStatus = 'stale';
      else if (newestAge > 180) decayStatus = 'decaying';
      else decayStatus = 'healthy';
    }

    // ── LLM scores ONLY the real excerpts (index-grounded, no invented pages) ──
    const context = pages
      .map((p, i) => `[${i}] TITLE: ${p.title}\nPUBLISHED: ${p.publishedDate || 'unknown'}\nEXCERPT: ${p.text.substring(0, 1000)}`)
      .join('\n\n');

    const prompt = `You are a Generative Engine Optimization (GEO) analyst assessing how well a competitor's content is positioned to be CITED by AI engines (ChatGPT, Gemini, Claude, Perplexity). The competitor is "${competitorName}" (${host}).

Below are REAL excerpts from their actual indexed pages. Judge ONLY what is in the excerpts — do not invent pages, claims, or numbers.

Score 0-100:
- entityDensityScore: how rich the content is in specific named entities (products, people, places, technologies). High = lots of concrete, citable specifics.
- statisticalAnchorsScore: how much the content leans on verifiable data points, figures, dates, and statistics (which AI engines reward) versus vague opinion.
- contentScore: overall how citation-worthy this content is for an AI engine answering a user question.

Then list 1-4 concrete vulnerabilities — specific weaknesses in THIS content that a competitor could exploit to win the citation instead. Ground every vulnerability in what you actually see (or its absence) in the excerpts. If the content is genuinely strong, return fewer vulnerabilities.

PAGES:
${context}

Return ONLY valid JSON:
{ "entityDensityScore": 0-100, "statisticalAnchorsScore": 0-100, "contentScore": 0-100, "vulnerabilities": ["...", "..."] }`;

    const result = await llmOrchestrator.executeCall<z.infer<typeof ClassificationSchema>>({
      userId: userId || 'anonymous',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      schema: ClassificationSchema,
      feature: 'analyze-competitor',
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Analysis failed' },
        { status: 500 }
      );
    }

    const { entityDensityScore, statisticalAnchorsScore, contentScore } = result.data;
    const vulnerabilities = [...result.data.vulnerabilities];

    // Add a freshness vulnerability grounded in the REAL newest-page age.
    if (newestAge !== null && newestAge > 365) {
      vulnerabilities.unshift(`Their newest indexed page is ${newestAge} days old — AI engines deprioritise stale sources, so fresh authoritative content can displace them.`);
    } else if (newestAge !== null && newestAge > 180) {
      vulnerabilities.unshift(`Slow publishing cadence — newest indexed content is ${newestAge} days old, opening a freshness gap to exploit.`);
    }

    // Trojan Horse = a real opening: stale/decaying OR weak specificity in their content.
    const trojanHorseOpportunity =
      decayStatus === 'stale' || decayStatus === 'decaying' ||
      entityDensityScore < 40 || statisticalAnchorsScore < 40;

    if (vulnerabilities.length === 0) {
      vulnerabilities.push(`${competitorName} looks healthy in AI citations (newest content ~${newestAge ?? '?'} days old, entity density ${entityDensityScore}/100). Monitor monthly for drift.`);
    }

    return NextResponse.json({
      success: true,
      result: {
        name: competitorName,
        insufficientData: false,
        decayStatus,
        contentScore: Math.round(contentScore),
        entityDensityScore: Math.round(entityDensityScore),
        statisticalAnchorsScore: Math.round(statisticalAnchorsScore),
        newestPageAgeDays: newestAge,
        avgPageAgeDays: avgAge,
        trojanHorseOpportunity,
        vulnerabilities: vulnerabilities.slice(0, 5),
        totalSignals: pages.length,
      },
    });
  } catch (err: any) {
    console.error('analyze-competitor error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
