import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';

// Entity Grounding Audit
//
// AI models are grounded in structured knowledge sources (Wikidata, Wikipedia,
// Crunchbase). A brand that doesn't appear in any of them is opaque to the
// model's world-model, reducing citability regardless of content quality.
//
// This route checks:
//   1. Wikidata — SPARQL search for brand label
//   2. Wikipedia — REST API article search
//   3. Crunchbase — organisation search (public API, free tier)
//   4. schema.org sameAs — fetches homepage, extracts JSON-LD sameAs links, and
//      checks whether they point to the above sources
//
// Returns gaps with specific recommended actions.

interface EntitySource {
  name: string;
  found: boolean;
  url: string | null;
  note: string | null;
}

interface AuditResult {
  brand: string;
  domain: string;
  sources: EntitySource[];
  sameAsLinks: string[];
  sameAsGaps: string[];
  score: number; // 0–100
  recommendations: string[];
  auditedAt: string;
}

// Search Wikidata for an entity matching the brand label.
async function checkWikidata(brand: string): Promise<EntitySource> {
  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(brand)}&language=en&format=json&limit=3`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8_000) });
    const data = await res.json();
    const items: any[] = data.search ?? [];
    const match = items.find((i: any) =>
      i.label?.toLowerCase() === brand.toLowerCase() ||
      i.aliases?.some((a: string) => a.toLowerCase() === brand.toLowerCase())
    ) ?? items[0] ?? null;
    if (match) {
      return { name: 'Wikidata', found: true, url: `https://www.wikidata.org/wiki/${match.id}`, note: match.description ?? null };
    }
    return { name: 'Wikidata', found: false, url: null, note: 'No entity found matching this brand name' };
  } catch (e: any) {
    return { name: 'Wikidata', found: false, url: null, note: `Check failed: ${e.message}` };
  }
}

// Search Wikipedia for a matching article.
async function checkWikipedia(brand: string): Promise<EntitySource> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(brand)}&format=json&srlimit=3`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8_000) });
    const data = await res.json();
    const results: any[] = data.query?.search ?? [];
    const match = results.find((r: any) => r.title.toLowerCase() === brand.toLowerCase()) ?? null;
    if (match) {
      const slug = encodeURIComponent(match.title.replace(/ /g, '_'));
      return { name: 'Wikipedia', found: true, url: `https://en.wikipedia.org/wiki/${slug}`, note: null };
    }
    return { name: 'Wikipedia', found: false, url: null, note: results.length > 0 ? `Similar: "${results[0].title}"` : 'No article found' };
  } catch (e: any) {
    return { name: 'Wikipedia', found: false, url: null, note: `Check failed: ${e.message}` };
  }
}

// Check Crunchbase via their public organisations search autocomplete endpoint.
// This is an unauthenticated endpoint that returns basic org data.
async function checkCrunchbase(brand: string, domain: string): Promise<EntitySource> {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
    // Crunchbase's public autocomplete — no API key needed for basic lookups.
    const url = `https://autocomplete.crunchbase.com/v1/autocomplete?query=${encodeURIComponent(brand)}&collection_ids=organizations&limit=5`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      return { name: 'Crunchbase', found: false, url: null, note: 'Autocomplete unavailable' };
    }
    const data = await res.json();
    const entities: any[] = data.entities ?? [];
    const match = entities.find((e: any) =>
      e.identifier?.value?.toLowerCase() === brand.toLowerCase() ||
      (e.short_description ?? '').toLowerCase().includes(cleanDomain)
    ) ?? null;
    if (match) {
      const permalink = match.identifier?.permalink ?? match.identifier?.value?.toLowerCase().replace(/\s+/g, '-');
      return { name: 'Crunchbase', found: true, url: permalink ? `https://www.crunchbase.com/organization/${permalink}` : null, note: match.short_description ?? null };
    }
    return { name: 'Crunchbase', found: false, url: null, note: entities.length > 0 ? `Similar: "${entities[0].identifier?.value}"` : 'No organisation found' };
  } catch (e: any) {
    return { name: 'Crunchbase', found: false, url: null, note: `Check failed: ${e.message}` };
  }
}

// Fetch the homepage and extract JSON-LD sameAs links from schema markup.
async function extractSameAs(domain: string): Promise<string[]> {
  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GEO-EntityAudit/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });
    const html = await res.text();

    const sameAsLinks: string[] = [];
    const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    while ((m = scriptRe.exec(html)) !== null) {
      try {
        const json = JSON.parse(m[1]);
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          const sa = item.sameAs;
          if (typeof sa === 'string') sameAsLinks.push(sa);
          if (Array.isArray(sa)) sameAsLinks.push(...sa.filter((s: any) => typeof s === 'string'));
        }
      } catch { /* malformed JSON-LD */ }
    }
    return [...new Set(sameAsLinks)];
  } catch {
    return [];
  }
}

function buildRecommendations(sources: EntitySource[], sameAsGaps: string[]): string[] {
  const recs: string[] = [];
  for (const src of sources) {
    if (!src.found) {
      if (src.name === 'Wikidata') recs.push('Create a Wikidata entity for your brand — include founder, founding date, website, and industry. This directly feeds the knowledge graph ChatGPT and Gemini draw on.');
      if (src.name === 'Wikipedia') recs.push('A Wikipedia article (even a stub) significantly increases AI citability. Build notability through press coverage first, then submit a draft.');
      if (src.name === 'Crunchbase') recs.push('Claim or create your Crunchbase profile — it is a primary entity-resolution source for Perplexity and Google AIO for company questions.');
    }
  }
  for (const gap of sameAsGaps) {
    recs.push(`Add "@sameAs": "${gap}" to your homepage JSON-LD schema markup to link your entity to its ${new URL(gap).hostname} profile.`);
  }
  if (recs.length === 0) recs.push('Entity grounding looks solid across checked sources. Consider adding schema.org/knowsAbout and schema.org/description for richer entity context.');
  return recs;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const body = await req.json();
  const brand: string = (body.brand ?? '').trim();
  const domain: string = (body.domain ?? '').trim();

  if (!brand || !domain) {
    return NextResponse.json({ error: 'brand and domain are required' }, { status: 400 });
  }

  try {
    const auditedAt = new Date().toISOString();

    const [wikidata, wikipedia, crunchbase, sameAsLinks] = await Promise.all([
      checkWikidata(brand),
      checkWikipedia(brand),
      checkCrunchbase(brand, domain),
      extractSameAs(domain),
    ]);

    const sources: EntitySource[] = [wikidata, wikipedia, crunchbase];

    // Identify sameAs gaps: known entity URLs that are NOT already in sameAs markup.
    const knownUrls = sources.filter(s => s.found && s.url).map(s => s.url as string);
    const sameAsSet = new Set(sameAsLinks.map(u => u.toLowerCase()));
    const sameAsGaps = knownUrls.filter(u => !sameAsSet.has(u.toLowerCase()));

    const foundCount = sources.filter(s => s.found).length;
    const sameAsBonus = sameAsGaps.length === 0 && sameAsLinks.length > 0 ? 10 : 0;
    const score = Math.round((foundCount / sources.length) * 90) + sameAsBonus;

    const recommendations = buildRecommendations(sources, sameAsGaps);

    const result: AuditResult = {
      brand, domain, sources, sameAsLinks, sameAsGaps, score, recommendations, auditedAt,
    };

    if (dbAdmin) {
      dbAdmin.collection('entity_audits').add({ userId, ...result }).catch(() => {});
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  if (!dbAdmin) return NextResponse.json({ audits: [] });

  const snap = await dbAdmin
    .collection('entity_audits')
    .where('userId', '==', userId)
    .orderBy('auditedAt', 'desc')
    .limit(10)
    .get();

  const audits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ audits });
}
