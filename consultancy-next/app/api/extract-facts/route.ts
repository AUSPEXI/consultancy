import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { embeddingService } from '@/lib/embeddings';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  try {
    const { content, contentType } = await request.json();
    if (!content) {
      return NextResponse.json({ error: 'Missing content or userId' }, { status: 400 });
    }

    const prompt = `Extract 3 atomic facts from the following text and format as a JSON array of strings. Each string must be a concise, standalone fact.\nText: ${content.substring(0, 5000)}`;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const rawStr = result.rawOutput || '[]';
    let facts: string[] = [];
    try {
      let cleaned = rawStr.trim();
      if (cleaned.includes('```')) {
        const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) cleaned = match[1];
      }
      facts = JSON.parse(cleaned);
    } catch {
      facts = [rawStr];
    }

    // Generate embeddings for all facts so the UMAP/map analytics can use them.
    // In 'auto' mode this uses the API when a key exists, else the zero-cost local
    // synonym embedder — so facts ALWAYS get a vector. A failed embed is non-fatal.
    let embeddings: (number[] | null)[] = facts.map(() => null);
    let embeddingSpace = embeddingService.getActiveSpace('auto');
    try {
      const vecs = await embeddingService.generateEmbeddings(facts, 'auto');
      embeddings = vecs;
    } catch (embedErr) {
      console.warn('[extract-facts] embedding generation failed (non-fatal):', embedErr);
      embeddingSpace = '';
    }

    const factsWithEmbeddings = facts.map((statement, i) => ({
      statement,
      embedding: embeddings[i] && (embeddings[i] as number[]).length > 0 ? embeddings[i] : null,
      embeddingSpace: embeddings[i] && (embeddings[i] as number[]).length > 0 ? embeddingSpace : null,
    }));

    return NextResponse.json({ success: true, facts: factsWithEmbeddings, embeddingSpace });
  } catch (error: any) {
    console.error('Extract facts endpoint error:', error);
    return NextResponse.json({ error: 'Failed to extract facts' }, { status: 500 });
  }
}
