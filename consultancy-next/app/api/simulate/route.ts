import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { SimulatorSchema } from '@/lib/output-validation';

export async function POST(request: Request) {
  try {
    const { query, brand, userId = 'anonymous' } = await request.json();
    if (!query || !brand) {
      return NextResponse.json({ error: 'Missing query or brand' }, { status: 400 });
    }

    const prompt = `
      You are an advanced AI simulation engine.
      Simulate how 4 different AI engines (ChatGPT, Claude, Gemini, Perplexity) would answer the following high-intent query: "${query}".
      The brand we are tracking is: "${brand}".
      
      For each engine, write a realistic 2-3 sentence response to the query. 
      Decide randomly if the engine should mention the brand or a competitor. 
      
      Return a JSON object with:
      - chatgpt: { response: string, mentionedBrand: boolean }
      - claude: { response: string, mentionedBrand: boolean }
      - gemini: { response: string, mentionedBrand: boolean }
      - perplexity: { response: string, mentionedBrand: boolean }
      - sovScore: number (0 to 100, based on how many mentioned the brand)
    `;

    const result = await llmOrchestrator.executeCall<any>({
      userId,
      provider: 'gemini',
      model: 'gemini-3.1-pro-preview',
      prompt,
      schema: SimulatorSchema,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, result: result.data });
  } catch (error: any) {
    console.error('Simulation endpoint error:', error);
    return NextResponse.json({ error: 'Failed to run simulation' }, { status: 500 });
  }
}
