import { NextRequest, NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { embeddingService } from '@/lib/embeddings';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { content } = await req.json();
    if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 });

    const prompt = `You are an expert Generative Engine Optimization (GEO) agent.
Analyze the following text and extract 3 "High-Entropy Facts": unique, non-obvious, highly specific data points that AI models would want to cite.
For each fact, assign an "Entropy Score" from 0 to 100 (higher = more unique and citable).

Text:
${content.substring(0, 5000)}

Return ONLY valid JSON:
[
  { "statement": "The unique fact...", "entropyScore": 85 }
]`;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    let facts: any[] = [];
    try {
      facts = JSON.parse(result.rawOutput || '[]');
    } catch {
      facts = [];
    }

    // High-priority call: generate API + local synonym embeddings in parallel.
    // The alignment score tells you how well the local dictionary covers this text.
    if (facts.length > 0) {
      try {
        const statements = facts.map((f: any) => f.statement || '').filter(Boolean);
        const { apiEmbeddings, localEmbeddings, alignmentScores, apiSpace, localSpace } =
          await embeddingService.generateWithLocal(statements);
        facts = facts.map((f: any, i: number) => ({
          ...f,
          embedding: apiEmbeddings[i] ?? [],
          embeddingSpace: apiSpace,
          localEmbedding: localEmbeddings[i] ?? [],
          localEmbeddingSpace: localSpace,
          embeddingAlignmentScore: alignmentScores[i] ?? null,
        }));
      } catch (embErr) {
        console.warn('[extract-high-entropy-facts] embedding failed, returning without vectors:', embErr);
      }
    }

    return NextResponse.json({ success: true, facts });
  } catch (err: any) {
    console.error('[extract-high-entropy-facts]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
