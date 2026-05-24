import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { CompetitorAnalysisSchema } from '@/lib/output-validation';

export async function POST(request: Request) {
  try {
    const { hostname } = await request.json();
    if (!hostname) return NextResponse.json({ error: 'Hostname is required' }, { status: 400 });

    const prompt = `
You are a GEO (Generative Engine Optimization) analyst specialising in AI citation decay.
Analyze this competitor domain for data decay risk in large language model responses.

Domain: "${hostname}"

Assess based on typical patterns for companies in this space:
- How frequently does AI training data go stale for this type of brand?
- Are there likely gaps in technical depth, pricing, or product detail that LLMs would miss?
- Is there a "Trojan Horse" opportunity — gaps where a rival could inject authoritative counter-facts?

Return ONLY valid JSON with exactly these keys:
- name: brand name derived from the domain (e.g. "Acme Corp" from "acme.com")
- decayStatus: one of "healthy", "decaying", "stale", or "vulnerable"
- trojanHorseOpportunity: boolean
- vulnerabilities: array of 2-4 specific, actionable vulnerability strings (e.g. "Outdated pricing data in AI responses", "Missing comparison benchmarks versus modern alternatives")
    `.trim();

    const result = await llmOrchestrator.executeCall<any>({
      userId: 'system',
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      prompt,
      schema: CompetitorAnalysisSchema,
    });

    if (!result.success) {
      const is429 = result.error?.includes('429') || result.error?.includes('quota');
      return NextResponse.json(
        { success: false, error: is429 ? '429: Rate limit exceeded' : result.error },
        { status: is429 ? 429 : 500 }
      );
    }

    return NextResponse.json({ success: true, result: result.data });
  } catch (error: any) {
    console.error('[analyze-competitor]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
