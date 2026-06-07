import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  try {
    const { text } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const prompt = `
You are a Generative Engine Optimization (GEO) specialist.

Analyze the following HTML or plain text and:
1. Identify "semantic fluff" — generic sentences, vague claims, filler phrases, passive voice, and buzzwords that AI engines cannot cite or verify.
2. Rewrite the content as a semantic HTML table with clear entities, statistics, and verifiable facts.

Return ONLY valid JSON with exactly these two keys:
{
  "detectedFluff": "<A 2-3 sentence summary of the semantic problems found in the content>",
  "htmlTable": "<A valid HTML <table> element with thead and tbody, restructuring the key facts from the content into AI-readable rows. Include columns: Entity, Claim, Supporting Stat, Source Type>"
}

Content to analyze:
"""${text.substring(0, 8000)}"""
`;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    let parsed: any;
    try {
      const raw = typeof result.data === 'string' ? result.data : result.rawOutput || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : result.data;
    } catch {
      parsed = result.data;
    }

    if (!parsed?.detectedFluff || !parsed?.htmlTable) {
      return NextResponse.json({ success: false, error: 'Unexpected response format from AI' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: parsed });
  } catch (err: any) {
    console.error('technical-restructure error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
