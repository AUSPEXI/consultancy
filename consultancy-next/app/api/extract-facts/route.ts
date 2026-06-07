import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { embeddingService } from '@/lib/embeddings';

export async function POST(request: Request) {
  try {
    const { content, contentType, userId = 'anonymous' } = await request.json();
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
    // Fire-and-forget — a failed embed never blocks the fact extraction response.
    let embeddings: (number[] | null)[] = facts.map(() => null);
    try {
      const vecs = await embeddingService.generateEmbeddings(facts);
      embeddings = vecs;
    } catch (embedErr) {
      console.warn('[extract-facts] embedding generation failed (non-fatal):', embedErr);
    }

    const factsWithEmbeddings = facts.map((statement, i) => ({
      statement,
      embedding: embeddings[i] && (embeddings[i] as number[]).length > 0 ? embeddings[i] : null,
    }));

    return NextResponse.json({ success: true, facts: factsWithEmbeddings });
  } catch (error: any) {
    console.error('Extract facts endpoint error:', error);
    return NextResponse.json({ error: 'Failed to extract facts' }, { status: 500 });
  }
}
