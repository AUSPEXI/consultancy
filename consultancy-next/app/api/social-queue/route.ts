import { NextResponse } from 'next/server';
import { requireTier } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const auth = await requireTier(request, 'Starter');
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  if (!dbAdmin) return NextResponse.json({ items: [] });

  const snap = await dbAdmin
    .collection('social_queue')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  const auth = await requireTier(request, 'Starter');
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  if (!dbAdmin) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const { id, status } = await request.json();
  if (!id || !['published', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'id and status (published|dismissed) required' }, { status: 400 });
  }

  const ref = dbAdmin.collection('social_queue').doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await ref.update({ status, updatedAt: new Date().toISOString() });
  return NextResponse.json({ success: true });
}
