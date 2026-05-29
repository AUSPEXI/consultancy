import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';

export async function POST(request: Request) {
  try {
    const { topic, crawlerData, vaultContext, userId = 'anonymous' } = await request.json();
    if (!topic?.trim() || !crawlerData) {
      return NextResponse.json({ error: 'topic and crawlerData are required' }, { status: 400 });
    }

    const sourcesSummary = (crawlerData.sources || [])
      .map((s: any, i: number) => `[Source ${i + 1}] ${s.title}\nURL: ${s.url}\n${(s.text || '').substring(0, 1500)}`)
      .join('\n\n---\n\n')
      .substring(0, 12000);

    const vaultSection = vaultContext
      ? `\n\nBrand Vault Context (first-party facts — treat as ground truth):\n- ${vaultContext}`
      : '';

    const prompt = `You are an expert Fact Extraction Agent specializing in Generative Engine Optimization (GEO).

Topic: "${topic}"
${vaultSection}

Crawled Sources:
${sourcesSummary}

Your task:
1. Extract only verifiable, concrete facts from the sources above — statistics, named entities, data points, specific claims with attribution.
2. Discard vague opinions, marketing language, and unverifiable assertions.
3. If Brand Vault Context is provided, include those facts as authoritative and clearly marked.
4. Format as a clean markdown bullet list. Group related facts under sub-headings.
5. Every fact must be traceable to a source URL where possible.

Return ONLY the markdown fact list. No preamble, no explanation.`;

    const result = await llmOrchestrator.executeCall<string>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      feature: 'agent-extract',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    const facts = typeof result.data === 'string' ? result.data : result.rawOutput || '';

    return NextResponse.json({ success: true, result: facts });
  } catch (err: any) {
    console.error('agent/extract error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
