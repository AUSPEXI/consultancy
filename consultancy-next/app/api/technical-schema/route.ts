import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  try {
    const { factText } = await request.json();
    if (!factText?.trim()) {
      return NextResponse.json({ error: 'factText is required' }, { status: 400 });
    }

    const prompt = `
You are a JSON-LD Schema expert for Generative Engine Optimization (GEO).

Convert the following brand facts or content into a JSON-LD schema that will maximize AI citation probability.

Choose the most appropriate Schema.org type(s) from: FAQPage, HowTo, Article, Product, Organization, Person, Event, or a combination.

Requirements:
- Use concrete entities, statistics, and verifiable claims
- Include "@context": "https://schema.org"
- Structure it so AI crawlers can extract specific citable facts
- Return ONLY the raw JSON-LD string, no markdown code blocks, no explanation

Facts/Content:
"""${factText.substring(0, 6000)}"""
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

    const raw = typeof result.data === 'string' ? result.data : result.rawOutput || JSON.stringify(result.data);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ success: false, error: 'AI returned invalid JSON schema' }, { status: 500 });
    }

    return NextResponse.json({ success: true, schema: cleaned });
  } catch (err: any) {
    console.error('technical-schema error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
