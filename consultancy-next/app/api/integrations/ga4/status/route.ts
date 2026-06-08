import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';
import { ga4Configured } from '@/lib/ga4';

// GET — connection status + available properties + selected property.
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  if (!dbAdmin) return NextResponse.json({ error: 'Database not available' }, { status: 500 });

  const snap = await dbAdmin.collection('ga4_integrations').doc(userId).get();
  if (!snap.exists) {
    return NextResponse.json({ configured: ga4Configured(), connected: false });
  }
  const d = snap.data() as any;
  return NextResponse.json({
    configured: ga4Configured(),
    connected: true,
    connectedAt: d.connectedAt || null,
    propertyId: d.propertyId || null,
    properties: d.properties || [],
  });
}

// POST — set the selected property, or disconnect.
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  if (!dbAdmin) return NextResponse.json({ error: 'Database not available' }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const ref = dbAdmin.collection('ga4_integrations').doc(userId);

  if (body.disconnect) {
    await ref.delete().catch(() => {});
    return NextResponse.json({ ok: true, connected: false });
  }
  if (typeof body.propertyId === 'string') {
    await ref.set({ propertyId: body.propertyId }, { merge: true });
    return NextResponse.json({ ok: true, propertyId: body.propertyId });
  }
  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
}
