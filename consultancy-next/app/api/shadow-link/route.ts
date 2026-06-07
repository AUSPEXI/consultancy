import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAuth } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';

// "Dark AI" Shadow Link generator.
//
// AI engines strip referral headers, so AI-driven clicks land in Google
// Analytics as "Direct" — invisible. Embedding a UTM-tagged URL in the site's
// JSON-LD lets the customer's OWN analytics attribute that traffic to AI.
//
// The UTM mechanism is real (GA does the attribution). What was missing was
// persistence: the old route minted a Math.random() tracking id and threw it
// away, so the platform kept no record and couldn't show a history or prove the
// link was ever issued. Now every link is persisted under a strong id so it can
// be listed, audited, and correlated.

interface ShadowLinkDoc {
  trackingId: string;
  userId: string;
  originalUrl: string;
  shadowUrl: string;
  utm: { source: string; medium: string; campaign: string };
  createdAt: string;
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { originalUrl, campaign } = await request.json();
    if (!originalUrl?.trim()) {
      return NextResponse.json({ error: 'Original URL is required' }, { status: 400 });
    }

    // Normalise then validate the URL up front so we never persist garbage.
    let url: URL;
    try {
      const raw = originalUrl.trim();
      url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Collision-resistant tracking id (Math.random() is neither).
    const trackingId = randomUUID().replace(/-/g, '').slice(0, 16);
    const utm = {
      source: 'llm_ingest',
      medium: 'ai_chat',
      campaign: (campaign?.trim() || 'fact_vault_magnet').slice(0, 64),
    };

    url.searchParams.set('utm_source', utm.source);
    url.searchParams.set('utm_medium', utm.medium);
    url.searchParams.set('utm_campaign', utm.campaign);
    url.searchParams.set('geo_trk', trackingId);

    const shadowUrl = url.toString();

    const doc: ShadowLinkDoc = {
      trackingId,
      userId,
      originalUrl: url.origin + url.pathname,
      shadowUrl,
      utm,
      createdAt: new Date().toISOString(),
    };

    if (dbAdmin && userId) {
      await dbAdmin.collection('shadow_links').doc(trackingId).set(doc);
      dbAdmin.collection('audit_logs').add({
        userId,
        action: 'Generated Shadow Link',
        details: { trackingId, originalUrl: doc.originalUrl, campaign: utm.campaign },
        timestamp: doc.createdAt,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, shadowUrl, trackingId });
  } catch (error: any) {
    console.error('Error generating shadow link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// History of a user's generated shadow links (most recent first).
export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    if (!dbAdmin) return NextResponse.json({ success: true, links: [] });
    const limit = Math.min(Number(new URL(request.url).searchParams.get('limit')) || 25, 100);
    const snap = await dbAdmin
      .collection('shadow_links')
      .where('userId', '==', userId)
      .get();

    const links = snap.docs
      .map((d) => d.data() as ShadowLinkDoc)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return NextResponse.json({ success: true, links });
  } catch (error: any) {
    console.error('Shadow link history error:', error);
    return NextResponse.json({ success: false, error: error.message, links: [] }, { status: 500 });
  }
}
