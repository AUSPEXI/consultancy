import { NextResponse } from 'next/server';
import { getExa } from '@/lib/exa';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { FactExtractionSchema } from '@/lib/output-validation';
import { embeddingService } from '@/lib/embeddings';

export async function POST(request: Request) {
  try {
    const { industry, userId = 'anonymous' } = await request.json();
    if (!industry) {
      return NextResponse.json({ error: 'Missing industry' }, { status: 400 });
    }

    const exa = getExa();
    const searchRes = await exa.searchAndContents(
      `Latest statistics, data points, and factual insights about the ${industry} industry`,
      { numResults: 3, text: true }
    );
    const exaContext = searchRes.results
      .map((r: any) => `URL: ${r.url}\nText: ${r.text}`)
      .join('\n\n')
      .substring(0, 5000);

    const prompt = `
      You are an expert Generative Engine Optimization (GEO) agent and Fact-Grabber research assistant.
      The user's industry/domain is: "${industry}".
      
      Using the following context exclusively from live web search results, extract or synthesize 3 "High-Entropy Facts" (unique, non-obvious, highly specific data points or statistics that AI models would want to cite) related to this industry.
      For each fact, assign an "Entropy Score" from 0 to 100 (higher means more unique). 
      
      CONTEXT:
      ${exaContext}
      
      Return ONLY valid JSON matching this schema:
      [
        { "statement": "The unique fact...", "entropyScore": 85 }
      ]
    `;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      schema: FactExtractionSchema,
      feature: 'research-facts',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status: 500 }
      );
    }

    let facts: any[] = result.data || [];

    // High-priority API call: embed all facts AND compute local synonym vectors in
    // parallel. Storing both gives alignment scores that reveal dictionary gaps.
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
        console.warn('[research-facts] embedding failed, returning without vectors:', embErr);
      }
    }

    return NextResponse.json({ success: true, facts });
  } catch (error: any) {
    console.error('Research facts endpoint error:', error);
    return NextResponse.json({ error: 'Failed to research facts' }, { status: 500 });
  }
}
