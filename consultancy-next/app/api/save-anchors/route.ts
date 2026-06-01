import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { anchors } = await request.json();
    if (!Array.isArray(anchors)) {
      return NextResponse.json({ error: 'anchors array required' }, { status: 400 });
    }
    if (!dbAdmin) {
      return NextResponse.json({ error: 'Admin DB not available' }, { status: 503 });
    }
    await dbAdmin.collection('users').doc(userId).update({ latentAnchors: anchors });
    return NextResponse.json({ success: true, count: anchors.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
