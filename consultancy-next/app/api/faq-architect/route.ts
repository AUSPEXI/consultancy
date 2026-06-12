import { NextResponse } from 'next/server';
import { z } from 'zod';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { requireAuth } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';
import { checkTierAccess } from '@/constants/tiers';

// FAQ Architect — generates a complete, deploy-ready FAQ page for the user's
// brand. The differentiator vs generic "AI FAQ generators": questions are not
// invented. They come from the user's own Citation Probe history (the queries
// AI engines are actually asked about their category, with citation status),
// and answers are grounded in the user's Fact-Vault. Uncited queries — the
// places the brand is losing — are prioritised, so the generated FAQ is a
// targeted gap-filling asset, not generic boilerplate.
//
// POST { regenerate?: boolean }  → generates (or regenerates) the draft
// GET                            → returns the saved draft

const FaqItemSchema = z.object({
  question: z.string().min(8),
  answer: z.string().min(40),
  source: z.enum(['uncited-query', 'cited-query', 'fact-vault', 'category-knowledge']),
});

const FaqDraftSchema = z.object({
  categories: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    items: z.array(FaqItemSchema).min(2),
  })).min(2),
});

export type FaqDraft = z.infer<typeof FaqDraftSchema>;

async function loadContext(userId: string) {
  if (!dbAdmin) return null;

  const userDoc = await dbAdmin.collection('users').doc(userId).get();
  const userData = userDoc.data() ?? {};
  const brand: string = userData.brand || '';
  const domain: string = userData.domain || userData.website || '';
  const industry: string = userData.industry || '';

  // Latest probe — real queries with citation status and content-gap geometry.
  const probeSnap = await dbAdmin.collection('citation_tests')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();
  const probe = probeSnap.docs[0]?.data();
  const probeQueries: { query: string; cited: boolean; isGap: boolean }[] =
    (probe?.results ?? []).map((r: any) => ({
      query: r.query,
      cited: !!r.cited,
      isGap: typeof r.minFactDistance === 'number' && r.minFactDistance > 0.5,
    }));

  // Fact-Vault statements (no embeddings needed — text only).
  const factsSnap = await dbAdmin.collection('facts')
    .where('userId', '==', userId).limit(80).get();
  let facts: string[] = factsSnap.docs
    .map(d => (d.data().statement as string) || '')
    .filter(t => t.length > 10);
  if (facts.length === 0) {
    const kgSnap = await dbAdmin.collection('knowledge_graph')
      .where('userId', '==', userId).limit(80).get();
    facts = kgSnap.docs.map(d => (d.data().fact as string) || '').filter(t => t.length > 10);
  }

  return { brand, domain, industry, probeQueries, facts };
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  if (!dbAdmin) return NextResponse.json({ error: 'Datastore unavailable' }, { status: 503 });

  const userDoc = await dbAdmin.collection('users').doc(userId).get();
  const tier = userDoc.exists ? (userDoc.data()?.tier || 'Free') : 'Free';
  if (!checkTierAccess(tier, 'Pro')) {
    return NextResponse.json({ error: 'upgrade_required', upgradeTo: 'Pro' }, { status: 403 });
  }

  try {
    const ctx = await loadContext(userId);
    if (!ctx || !ctx.brand) {
      return NextResponse.json(
        { success: false, error: 'Complete your brand profile in Settings first.' },
        { status: 400 },
      );
    }
    if (ctx.facts.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Add at least 5 facts to your Fact-Vault first. Answers are grounded in your verified facts.' },
        { status: 400 },
      );
    }

    const uncited = ctx.probeQueries.filter(q => !q.cited);
    const gaps = ctx.probeQueries.filter(q => q.isGap);

    const prompt = `You are the FAQ Architect for "${ctx.brand}"${ctx.domain ? ` (${ctx.domain})` : ''}${ctx.industry ? `, a brand in the ${ctx.industry} space` : ''}.

Generate a complete, AI-citation-optimised FAQ page. This FAQ exists to win citations from AI engines (ChatGPT, Gemini, Claude, Perplexity), so every answer must follow GEO/AEO best practice.

## GROUND TRUTH: the brand's verified Fact-Vault (your ONLY source for brand claims):
${ctx.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## REAL QUERIES AI engines are asked about this category (from live citation probes):
${ctx.probeQueries.length > 0
  ? ctx.probeQueries.map(q => `- "${q.query}" [${q.cited ? 'brand IS cited' : 'brand NOT cited'}${q.isGap ? ', no covering fact: CONTENT GAP' : ''}]`).join('\n')
  : '(no probe history: derive questions from the facts and category knowledge)'}

## RULES
1. PRIORITISE the uncited queries${gaps.length > 0 ? ' and especially the CONTENT GAP queries' : ''}: each should become an FAQ question (rephrased as a natural question if needed). These are where the brand is losing AI citations today.
2. Every answer: 40–70 words. First sentence directly and completely answers the question (lead with the answer: no preamble, no marketing filler). Remaining sentences add supporting facts.
3. Brand claims MUST come from the Fact-Vault above. Never invent statistics, customer counts, certifications, or capabilities. General category/industry education that doesn't claim anything about the brand is allowed (mark source "category-knowledge").
4. High entropy: prefer specific numbers, named methods, and concrete entities from the facts over vague language.
5. Each question must address a DISTINCT intent. No near-duplicates (AI engines skip sources with redundant answers).
6. Organise into 3–6 logical categories with kebab-case ids, a short title, and a one-line description.
7. Mark each item's source: "uncited-query" (from an uncited probe query), "cited-query", "fact-vault" (built from facts, no matching query), or "category-knowledge".
8. 15–30 questions total, weighted toward categories where the uncited queries cluster.

Return ONLY valid JSON:
{
  "categories": [
    {
      "id": "kebab-case-id",
      "title": "Category Title",
      "description": "One-line description.",
      "items": [
        { "question": "...?", "answer": "...", "source": "uncited-query" }
      ]
    }
  ]
}`;

    const result = await llmOrchestrator.executeCall<FaqDraft>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      schema: FaqDraftSchema,
      feature: 'faq-architect',
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'FAQ generation failed' },
        { status: 500 },
      );
    }

    const draft = {
      userId,
      brand: ctx.brand,
      domain: ctx.domain,
      categories: result.data.categories,
      stats: {
        totalQuestions: result.data.categories.reduce((s, c) => s + c.items.length, 0),
        fromUncitedQueries: result.data.categories.reduce(
          (s, c) => s + c.items.filter(i => i.source === 'uncited-query').length, 0),
        factCount: ctx.facts.length,
        probeQueryCount: ctx.probeQueries.length,
      },
      generatedAt: new Date().toISOString(),
    };

    // One living draft per user — regeneration replaces it.
    await dbAdmin.collection('faq_drafts').doc(userId).set(draft);

    return NextResponse.json({ success: true, draft });
  } catch (err: any) {
    console.error('faq-architect error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    if (!dbAdmin) return NextResponse.json({ success: true, draft: null });
    const doc = await dbAdmin.collection('faq_drafts').doc(userId).get();
    return NextResponse.json({ success: true, draft: doc.exists ? doc.data() : null });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
