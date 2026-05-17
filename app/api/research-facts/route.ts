import { NextResponse } from 'next/server';
import { getExa } from '@/lib/exa';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { FactExtractionSchema } from '@/lib/output-validation';

export async function POST(request: Request) {
  try {
    const { industry, userId = 'anonymous' } = await request.json();
    if (!industry) return NextResponse.json({ error: "Missing industry" }, { status: 400 });

    const exa = getExa();
    const searchRes = await exa.searchAndContents(`Latest statistics, data points, and factual insights about the ${industry} industry`, { numResults: 3, text: true });
    const exaContext = searchRes.results.map((r: any) => `URL: ${r.url}\nText: ${r.text}`).join("\n\n").substring(0, 5000);

    const prompt = `
      Extract 3 "High-Entropy Facts" for the industry: "${industry}".
      Context: ${exaContext}
    `;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      prompt,
      schema: FactExtractionSchema
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, facts: result.data });
  } catch (error) {
    return NextResponse.json({ error: "Research failed" }, { status: 500 });
  }
}
