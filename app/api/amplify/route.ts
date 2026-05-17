import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/src/lib/llm-orchestrator';

export async function POST(request: Request) {
  try {
    const { fact, userId = 'anonymous' } = await request.json();
    if (!fact) return NextResponse.json({ error: "Fact is required" }, { status: 400 });

    const prompt = `
      You are a GEO Expert. Take this core brand fact and rewrite it for 3 social channels (LinkedIn, Twitter, Reddit) to maximize semantic authority and citation probability.
      Fact: "${fact}"
      Return as JSON with keys: linkedin, twitter, reddit.
    `;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      prompt,
      schema: true
    });

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json(result.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
