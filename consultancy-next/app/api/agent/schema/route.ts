import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  try {
    const { facts } = await request.json();
    if (!facts?.trim()) {
      return NextResponse.json({ error: 'facts is required' }, { status: 400 });
    }

    const prompt = `You are a JSON-LD Schema Agent specializing in Generative Engine Optimization (GEO).

Given the following extracted facts, generate a JSON-LD schema that maximizes AI citation probability.

Choose the most appropriate Schema.org type(s) from: FAQPage, HowTo, Article, Product, Organization, Person, Event, or a combination.

Requirements:
- Use "@context": "https://schema.org"
- Embed concrete statistics and named entities as schema properties
- Structure so AI crawlers can extract specific citable facts
- Return ONLY the raw JSON-LD string. No markdown code blocks, no explanation

Extracted Facts:
"""
${facts.substring(0, 6000)}
"""`;

    const result = await llmOrchestrator.executeCall<string>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      feature: 'agent-schema',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    const raw = typeof result.data === 'string' ? result.data : result.rawOutput || JSON.stringify(result.data);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ success: false, error: 'Schema agent returned invalid JSON' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: cleaned });
  } catch (err: any) {
    console.error('agent/schema error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
