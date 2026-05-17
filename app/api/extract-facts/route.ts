import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';

export async function POST(request: Request) {
  try {
    const { content, userId } = await request.json();
    if (!content || !userId) return NextResponse.json({ error: "Missing content or userId" }, { status: 400 });

    const prompt = `Extract 3 atomic facts from the following text and format as a JSON array of strings. Each string must be a concise, standalone fact.\nText: ${content.substring(0, 5000)}`;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      prompt
    });

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    let cleanedOutput = result.rawOutput || '[]';
    if (cleanedOutput.includes('```')) {
      const match = cleanedOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) cleanedOutput = match[1];
    }
    const facts = JSON.parse(cleanedOutput);
    return NextResponse.json({ success: true, facts });
  } catch (error) {
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
