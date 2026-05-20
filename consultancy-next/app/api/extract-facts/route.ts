import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';

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
      model: 'gemini-1.5-flash',
      prompt,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const rawStr = result.rawOutput || '[]';
    let facts = [];
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

    return NextResponse.json({ success: true, facts });
  } catch (error: any) {
    console.error('Extract facts endpoint error:', error);
    return NextResponse.json({ error: 'Failed to extract facts' }, { status: 500 });
  }
}
