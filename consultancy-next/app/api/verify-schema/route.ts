import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { domain, factStatement } = await req.json();
    if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 });

    const url = domain.startsWith('http') ? domain : `https://${domain}`;

    let html = '';
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuspexiBot/1.0; +https://auspexi.com)' },
        signal: AbortSignal.timeout(10000),
      });
      html = await res.text();
    } catch (e: any) {
      return NextResponse.json({ error: `Could not fetch ${url}: ${e.message}` }, { status: 502 });
    }

    // Extract all JSON-LD blocks
    const scriptMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const schemas: any[] = [];
    for (const match of scriptMatches) {
      try { schemas.push(JSON.parse(match[1].trim())); } catch (_) {}
    }

    // Flatten @graph arrays
    const flatSchemas: any[] = [];
    for (const s of schemas) {
      if (s['@graph']) flatSchemas.push(...s['@graph']);
      else flatSchemas.push(s);
    }

    const types = flatSchemas.map(s => s['@type']).filter(Boolean);
    const hasOrganization = flatSchemas.some(s => ['Organization', 'Corporation', 'LocalBusiness'].includes(s['@type']));
    const hasClaim = flatSchemas.some(s => s['@type'] === 'Claim');
    const hasWebSite = flatSchemas.some(s => s['@type'] === 'WebSite');
    const hasBreadcrumb = flatSchemas.some(s => s['@type'] === 'BreadcrumbList');

    // Check if the specific fact text appears in any schema
    const factFound = factStatement
      ? flatSchemas.some(s => JSON.stringify(s).toLowerCase().includes(factStatement.substring(0, 60).toLowerCase()))
      : null;

    // Check for sameAs links
    const sameAsLinks: string[] = [];
    for (const s of flatSchemas) {
      if (s.sameAs) {
        if (Array.isArray(s.sameAs)) sameAsLinks.push(...s.sameAs);
        else sameAsLinks.push(s.sameAs);
      }
    }

    return NextResponse.json({
      success: true,
      url,
      schemasFound: flatSchemas.length,
      types,
      hasOrganization,
      hasClaim,
      hasWebSite,
      hasBreadcrumb,
      sameAsLinks,
      factFound,
      schemas: flatSchemas.slice(0, 10),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
