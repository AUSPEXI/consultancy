import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';

export async function POST(request: Request) {
  try {
    const { email, domain } = await request.json();
    if (!domain) return NextResponse.json({ error: 'Missing domain' }, { status: 400 });

    const prompt = `
      You are an expert GEO Auditor. A user has submitted their domain for a free GEO Visibility Report.
      Domain: ${domain}

      Write a professional, dense, 400-word GEO Visibility Report covering:
      1. Estimated AI Share of Voice (A-SOV) for this domain category
      2. Top 3 cite-magnet opportunities (specific facts they should publish)
      3. Which AI platforms (ChatGPT, Gemini, Claude, Perplexity) they are likely visible on
      4. Two immediate actions to improve AI citation likelihood

      Be specific and data-driven. This is a public-facing report.
    `;

    const result = await llmOrchestrator.executeCall<string>({
      userId: email || 'anonymous',
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      prompt,
    });

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json({ success: true, report: result.rawOutput });
  } catch (error) {
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}
