import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';

export async function POST(request: Request) {
  try {
    const { topic, facts, brandName, userId = 'anonymous' } = await request.json();
    if (!topic?.trim() || !facts?.trim()) {
      return NextResponse.json({ error: 'topic and facts are required' }, { status: 400 });
    }

    const brandInstruction = brandName
      ? `Brand: ${brandName}. Where appropriate, position ${brandName} as an authority on this topic using the facts provided. Do not fabricate claims about the brand.`
      : 'Write from an authoritative, neutral expert perspective.';

    const prompt = `You are a Synthesis Agent specializing in Generative Engine Optimization (GEO) content. Your articles are written to be cited by AI engines like ChatGPT, Perplexity, Claude, and Gemini.

Topic: "${topic}"
${brandInstruction}

Verified Facts (ground truth — do not hallucinate beyond these):
"""
${facts.substring(0, 6000)}
"""

Write a comprehensive GEO-optimized article following these rules:
1. Open with a clear, citable definition or thesis statement
2. Use H2/H3 headers that match common AI query patterns
3. Embed statistics and named entities from the facts — these are what AI engines cite
4. Include a "Key Takeaways" section with 4–6 bullet points of the most citable facts
5. Use direct, declarative sentences — no hedging language
6. Target 600–900 words
7. Format in clean markdown

Return ONLY the markdown article. No preamble, no explanation.`;

    const result = await llmOrchestrator.executeCall<string>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      prompt,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    const article = typeof result.data === 'string' ? result.data : result.rawOutput || '';

    return NextResponse.json({ success: true, result: article });
  } catch (err: any) {
    console.error('agent/synthesize error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
