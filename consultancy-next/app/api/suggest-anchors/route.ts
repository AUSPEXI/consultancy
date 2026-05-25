import { NextRequest, NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { AnchorsSchema } from '@/lib/output-validation';

export async function POST(req: NextRequest) {
  try {
    const { userId, brand, domain, domainContext } = await req.json();

    if (!brand || !domain) {
      return NextResponse.json({ error: 'Brand and domain required' }, { status: 400 });
    }

    const prompt = `
        You are an expert Generative Engine Optimization (GEO) strategist.
        Analyze the following brand and domain data to suggest 3-5 "Semantic Anchors" for their Latent Space Map.

        Brand: ${brand}
        Domain: ${domain}
        Context (if available): ${domainContext || 'No additional context provided.'}

        Semantic Anchors are the primary concepts LLMs associate with a brand. They represent stable, high-confidence clusters of information.

        Suggest 3-5 anchors. Each should have:
        - label: A short (1-3 words) name for the anchor (e.g., "Technical Reliability", "Premium Pricing", "Customer Ease").
        - color: A hex code representing the "vibe" (use: #ec4899 for positive/moat, #06b6d4 for signals, #8b5cf6 for trends, #f59e0b for risks).
        - baseType: "Systemic Anchor", "Signal Point", "Emergent Trend", or "Risk Vector".

        Return ONLY a JSON array of anchor objects.
      `;

    const result = await llmOrchestrator.executeCall<any>({
      userId: userId || 'anonymous',
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      prompt,
      schema: AnchorsSchema,
      feature: 'vault-anchors',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, anchors: result.data });
  } catch (err: any) {
    console.error('Suggest anchors error:', err);
    return NextResponse.json({ error: 'Failed to suggest anchors' }, { status: 500 });
  }
}
