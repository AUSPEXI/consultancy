import { NextRequest, NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { AnchorsTEOSchema } from '@/lib/output-validation';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { brand, domain, domainContext } = await req.json();

    if (!brand || !domain) {
      return NextResponse.json({ error: 'Brand and domain required' }, { status: 400 });
    }

    // TEO framework: the three dimensions that define how AI engines perceive a brand.
    // Teleology (Purpose) · Epistemology (Knowledge) · Ontology (Being)
    // The anchor generator enforces the full 2-2-2-1 contract — no partial sets,
    // no colour drift, no output that changes between identical inputs.
    const prompt = `You are an expert GEO (Generative Engine Optimization) strategist.
Your task is to map the latent space position of a brand across three philosophical axes
that define how AI language models perceive and cite it.

Brand: ${brand}
Domain: ${domain}
Additional context: ${domainContext || 'None provided.'}

You will generate EXACTLY 7 semantic anchors structured by the TEO framework:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AXIS 1 — ONTOLOGICAL  (What this brand fundamentally IS in AI minds)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate 2 × "Systemic Anchor"  (color: #ec4899)
These are the load-bearing identity concepts AI engines co-activate when reasoning
about this brand. They are stable across all query types and model versions.
Everything else in the latent space orbits around them.
axisAlignment: 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AXIS 2 — EPISTEMOLOGICAL  (What this brand KNOWS and can prove)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate 2 × "Signal Point"  (color: #06b6d4)
These are specific, verifiable claims, methodologies, or data points the brand has
established in the public knowledge base. Citation fuel — the concrete, citable
facts that AI training data can anchor to.
axisAlignment: 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AXIS 3 — TELEOLOGICAL  (What this brand IS FOR / where it is going)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate 2 × "Emergent Trend"  (color: #8b5cf6)
These are growing associations forming in newer model iterations — conceptual
territory the brand is actively claiming but has not yet fully locked in.
Strategic opportunities before competitors occupy the space.
axisAlignment: 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RISK DIMENSION  (What threatens TEO coherence)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate 1 × "Risk Vector"  (color: #f59e0b)
The most significant threat to this brand's latent space position — a competitor
bleed-in, negative association cluster, conceptual misclassification, or market
perception gap that could erode brand authority or divert citations.
axisAlignment: whichever axis (1, 2, or 3) is most at risk for this brand.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY a JSON array of exactly 7 objects. No markdown. No explanation. No wrapper object.

Schema for each object:
{
  "label": "2–4 word concept, specific to THIS brand — not generic marketing language",
  "color": "#ec4899 | #06b6d4 | #8b5cf6 | #f59e0b",
  "baseType": "Systemic Anchor | Signal Point | Emergent Trend | Risk Vector",
  "axisAlignment": 1 | 2 | 3,
  "description": "One sentence: what this anchor means for this brand's specific GEO strategy."
}

Hard rules:
- Exactly 7 objects
- Exactly 2 with baseType "Systemic Anchor" and axisAlignment 1
- Exactly 2 with baseType "Signal Point" and axisAlignment 2
- Exactly 2 with baseType "Emergent Trend" and axisAlignment 3
- Exactly 1 with baseType "Risk Vector"
- Labels must be specific to this brand — no generic terms like "Market Leader" or "Innovation"
- Think carefully about what AI models trained on public web data actually associate with this brand`;

    const result = await llmOrchestrator.executeCall<any>({
      userId: userId || 'anonymous',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      temperature: 0.1,
      schema: AnchorsTEOSchema,
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
