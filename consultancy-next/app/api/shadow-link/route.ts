import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { originalUrl, userId } = await req.json();

    if (!originalUrl) {
      return NextResponse.json({ error: 'Original URL is required' }, { status: 400 });
    }

    // Normalise the URL
    const urlString = originalUrl.startsWith('http') ? originalUrl : `https://${originalUrl}`;
    const url = new URL(urlString);

    // Add standard GEO tracking parameters
    url.searchParams.set('utm_source', 'llm_ingest');
    url.searchParams.set('utm_medium', 'ai_chat');
    url.searchParams.set('utm_campaign', 'fact_vault_magnet');

    // Add a unique tracking ID for database correlation
    const trackingId = Math.random().toString(36).substring(2, 15);
    url.searchParams.set('geo_trk', trackingId);

    return NextResponse.json({ success: true, shadowUrl: url.toString(), trackingId });
  } catch (error: any) {
    console.error('Error generating shadow link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
