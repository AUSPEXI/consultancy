import { NextRequest, NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { requireAuth } from '@/lib/api-auth';
import { z } from 'zod';

const EntityProfileSchema = z.object({
  wikidataDescription: z.string().max(250),
  shortDescription: z.string().max(80),
  instanceOf: z.string(),
  industry: z.string(),
  country: z.string(),
  keyStatements: z.array(z.string()).min(3).max(6),
  knowledgePanelTriggers: z.array(z.string()).min(2).max(5),
  sameAsUrls: z.array(z.string()).min(2).max(8),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  try {
    const { brand, domain, keywords, country, description } = await req.json();
    if (!brand) return NextResponse.json({ error: 'Brand required' }, { status: 400 });

    const prompt = `You are an entity intelligence expert specialising in knowledge graph establishment for brand GEO (Generative Engine Optimization).

Brand: ${brand}
Domain: ${domain || 'unknown'}
Country / HQ: ${country || 'unknown (do not guess, use "unknown" if not provided)'}
Industry/Keywords: ${keywords?.join(', ') || 'not provided'}
Additional context: ${description || 'none'}

Generate a complete entity profile for establishing this brand in structured knowledge systems (Wikidata, Google Knowledge Panel, schema.org).

IMPORTANT: Use the exact country provided above. Do not infer or guess the country from the domain or brand name.

Return ONLY a JSON object with this exact structure:
{
  "wikidataDescription": "A 1-2 sentence Wikidata-style description (neutral, encyclopaedic, third-person). Max 250 chars.",
  "shortDescription": "10-word max description for Knowledge Panel tagline",
  "instanceOf": "The most appropriate Wikidata P31 'instance of' value (e.g. 'software company', 'technology startup', 'SaaS platform')",
  "industry": "Primary industry classification (e.g. 'Software', 'Marketing Technology', 'Artificial Intelligence')",
  "country": "Use exactly the country value provided above",
  "keyStatements": ["3-6 verifiable factual statements about the brand suitable for knowledge graph ingestion. Each should contain a specific claim, be attribution-ready, and be no more than 2 sentences."],
  "knowledgePanelTriggers": ["2-5 specific content types/formats that would trigger a Google Knowledge Panel for this brand (e.g. 'Wikipedia article', 'Wikidata entity with sitelinks', 'Google Business Profile')"],
  "sameAsUrls": ["2-8 authoritative URLs where this brand should be listed for entity disambiguation (use realistic platform URLs for this brand type)"]
}`;

    const result = await llmOrchestrator.executeCall<any>({
      userId: userId || 'anonymous',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      temperature: 0.2,
      schema: EntityProfileSchema,
      feature: 'entity-profile',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: result.data });
  } catch (err: any) {
    console.error('entity-profile error:', err);
    return NextResponse.json({ error: 'Failed to generate entity profile' }, { status: 500 });
  }
}
