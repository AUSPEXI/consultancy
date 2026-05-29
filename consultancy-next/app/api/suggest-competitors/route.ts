import { NextRequest, NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { CompetitorSuggestSchema } from '@/lib/output-validation';

export async function POST(req: NextRequest) {
  try {
    const { userId, brand, domain, keywords } = await req.json();

    if (!brand) {
      return NextResponse.json({ error: 'Brand name required' }, { status: 400 });
    }

    const keywordStr = Array.isArray(keywords) && keywords.length
      ? keywords.filter(Boolean).join(', ')
      : 'not provided';

    const prompt = `You are a competitive intelligence expert specialising in Generative Engine Optimization (GEO).

Brand: ${brand}
Domain: ${domain || 'unknown'}
Target keywords: ${keywordStr}

Identify the 6 most important competitor domains this brand should benchmark against for AI search visibility and citation share.

Think about:
- Direct competitors offering similar products or services
- Brands that dominate AI responses when someone queries this topic
- Established players the target audience would compare this brand against
- Platforms or tools that solve the same problem

Return ONLY a JSON object in this exact shape (no markdown, no explanation):
{ "competitors": ["domain1.com", "domain2.com", "domain3.com", "domain4.com", "domain5.com", "domain6.com"] }

Rules: bare domains only (no https://, no paths, no www), real domains only, exactly 6 entries.`;

    const result = await llmOrchestrator.executeCall<{ competitors: string[] }>({
      userId: userId || 'anonymous',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      schema: CompetitorSuggestSchema,
      feature: 'competitor-discovery',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, competitors: result.data!.competitors });
  } catch (err: any) {
    console.error('Suggest competitors error:', err);
    return NextResponse.json({ error: 'Failed to discover competitors' }, { status: 500 });
  }
}
