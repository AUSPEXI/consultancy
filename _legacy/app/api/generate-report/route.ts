import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';

export async function POST(request: Request) {
  try {
    const { email, domain } = await request.json();
    if (!domain) return NextResponse.json({ error: "Missing domain" }, { status: 400 });

    const prompt = `
      You are an expert GEO Auditor.
      Domain: ${domain}
      Generate a professional, dense GEO Visibility Report.
      Include A-SOV estimates and cite-magnet opportunities.
    `;

    const result = await llmOrchestrator.executeCall<string>({
      userId: 'audit-user',
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      prompt
    });

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json({ success: true, report: result.rawOutput });
  } catch (error) {
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}
