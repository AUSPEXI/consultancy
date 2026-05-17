import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { SimulatorSchema } from '@/lib/output-validation';

export async function POST(request: Request) {
  try {
    const { query, brand, userId = 'anonymous' } = await request.json();
    if (!query || !brand) {
      return NextResponse.json({ error: "Missing query or brand" }, { status: 400 });
    }

    const prompt = `
      Simulate how 4 AI engines (ChatGPT, Claude, Gemini, Perplexity) would answer: "${query}".
      Brand: "${brand}".
    `;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      prompt,
      schema: SimulatorSchema
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: result.data });
  } catch (error) {
    return NextResponse.json({ error: "Simulation failed" }, { status: 500 });
  }
}
