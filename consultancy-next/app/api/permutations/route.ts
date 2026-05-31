import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { embeddingService } from '@/lib/embeddings';
import { dbAdmin } from '@/lib/firebase-admin';

export interface PermutationResult {
  query: string;
  format: 'question' | 'comparison' | 'howto' | 'definition' | 'best' | 'review' | 'vs';
  intent: 'informational' | 'commercial' | 'navigational';
  embedding?: number[];
}

// Generates ~60 query permutations per keyword across 7 format types x ~8–9 variants each.
// For N keywords this produces N * ~60 vectors → stored in fact_permutations for model training.
export async function POST(request: Request) {
  try {
    const { keyword, brand = '', userId = 'anonymous' } = await request.json();
    if (!keyword?.trim()) return NextResponse.json({ error: 'keyword is required' }, { status: 400 });

    const kw = keyword.trim();

    // Generate permutation queries via Gemini
    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      feature: 'permutations',
      prompt: `You are a GEO (Generative Engine Optimization) expert. Generate exactly 60 realistic search queries a user might type into an AI engine (ChatGPT, Perplexity, Gemini, Claude) when researching the topic: "${kw}"${brand ? ` in the context of the brand "${brand}"` : ''}.

Cover all 7 format types with ~8-9 queries each:
1. "question" — questions starting with What/How/Why/Which/When/Who
2. "comparison" — comparing options or approaches
3. "howto" — step-by-step how-to queries
4. "definition" — definitional or explanatory queries
5. "best" — "best X for Y" or "top X" queries
6. "review" — evaluation, pros/cons, is-it-worth-it queries
7. "vs" — direct head-to-head comparison queries (e.g. "X vs Y")

For each query also classify:
- intent: "informational" | "commercial" | "navigational"

Return ONLY a JSON array:
[
  { "query": "...", "format": "question", "intent": "informational" },
  ...
]

Generate exactly 60 items. Vary phrasing — don't repeat the same sentence structure.`,
    });

    let permutations: Omit<PermutationResult, 'embedding'>[] = [];
    try {
      const raw = typeof result.data === 'string' ? result.data : result.rawOutput || '[]';
      permutations = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch {
      return NextResponse.json({ error: 'Failed to parse permutations from LLM' }, { status: 500 });
    }

    // Generate embeddings for all permutation queries in one batch
    let withEmbeddings: PermutationResult[] = permutations.map(p => ({ ...p }));
    try {
      const queries = permutations.map(p => p.query);
      const embeddings = await embeddingService.generateEmbeddings(queries);
      withEmbeddings = permutations.map((p, i) => ({ ...p, embedding: embeddings[i] ?? [] }));
    } catch (embErr) {
      console.warn('[permutations] embedding generation failed, returning without vectors:', embErr);
    }

    // Persist to fact_permutations collection (feeds model training data)
    if (dbAdmin && userId !== 'anonymous') {
      const batch = dbAdmin.batch();
      const colRef = dbAdmin.collection('fact_permutations');

      // Store a summary document with all permutations
      const docRef = colRef.doc();
      batch.set(docRef, {
        userId,
        keyword: kw,
        brand,
        count: withEmbeddings.length,
        permutations: withEmbeddings.map(p => ({
          query: p.query,
          format: p.format,
          intent: p.intent,
          // Store embedding only if it has values — avoids Firestore 1MB doc limit
          ...(p.embedding?.length ? { embedding: p.embedding } : {}),
        })),
        createdAt: new Date().toISOString(),
        embeddingModel: embeddingService.getActiveEngine().model,
        embeddingDimensions: embeddingService.getActiveEngine().dimensions,
      });

      await batch.commit();

      // Log for model training audit
      await dbAdmin.collection('audit_logs').add({
        userId,
        action: 'Generated Query Permutations',
        metadata: { keyword: kw, count: withEmbeddings.length, hasEmbeddings: (withEmbeddings[0]?.embedding?.length ?? 0) > 0 },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      keyword: kw,
      count: withEmbeddings.length,
      permutations: withEmbeddings,
      byFormat: {
        question:   withEmbeddings.filter(p => p.format === 'question').length,
        comparison: withEmbeddings.filter(p => p.format === 'comparison').length,
        howto:      withEmbeddings.filter(p => p.format === 'howto').length,
        definition: withEmbeddings.filter(p => p.format === 'definition').length,
        best:       withEmbeddings.filter(p => p.format === 'best').length,
        review:     withEmbeddings.filter(p => p.format === 'review').length,
        vs:         withEmbeddings.filter(p => p.format === 'vs').length,
      },
    });
  } catch (err: any) {
    console.error('[permutations]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
