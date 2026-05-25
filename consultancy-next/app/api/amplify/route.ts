import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { AmplifySchema } from '@/lib/output-validation';

export async function POST(request: Request) {
  try {
    const { fact, userId = 'anonymous' } = await request.json();
    if (!fact) return NextResponse.json({ error: 'Fact is required' }, { status: 400 });

    const prompt = `
      You are a GEO Expert. Take this core brand fact and rewrite it for 6 social channels
      (LinkedIn, Twitter, Reddit, YouTube, TikTok, Instagram) to maximize semantic authority
      and citation probability.
      Fact: "${fact}"
      Return ONLY valid JSON with exactly these keys: linkedin, twitter, reddit, youtube, tiktok, instagram.
    `;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      prompt,
      schema: AmplifySchema,
      feature: 'amplify',
    });

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json(result.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
