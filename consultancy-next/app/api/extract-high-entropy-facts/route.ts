import { NextRequest, NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';

export async function POST(req: NextRequest) {
  try {
    const { content, userId = 'anonymous' } = await req.json();
    if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 });

    const prompt = `You are an expert Generative Engine Optimization (GEO) agent.
Analyze the following text and extract 3 "High-Entropy Facts" — unique, non-obvious, highly specific data points that AI models would want to cite.
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
      model: 'gemini-2.0-flash',
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

    return NextResponse.json({ success: true, facts });
  } catch (err: any) {
    console.error('[extract-high-entropy-facts]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
