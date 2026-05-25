import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { userId, anchors } = await request.json();
    if (!userId || !Array.isArray(anchors)) {
      return NextResponse.json({ error: 'userId and anchors array required' }, { status: 400 });
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
