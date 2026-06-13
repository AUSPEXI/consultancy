import { NextResponse } from 'next/server';
import { requireTier } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  const auth = await requireTier(request, 'Starter');
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  if (!dbAdmin) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const { id, platform, content, sourceTitle, sourceUrl, webhookUrl } = await request.json();

  if (!id || !platform || !content || !webhookUrl) {
    return NextResponse.json({ error: 'id, platform, content, webhookUrl required' }, { status: 400 });
  }

  // Verify the queue item belongs to this user
  const ref = dbAdmin.collection('social_queue').doc(id);
  const docSnap = await ref.get();
  if (!docSnap.exists || docSnap.data()?.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Forward to the user's CMS webhook server-side (avoids browser CORS on Apps Script URLs)
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'SOCIAL_PUBLISH',
        timestamp: new Date().toISOString(),
        payload: { platform, content, sourceTitle, sourceUrl },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ error: `Webhook returned ${res.status}`, detail: text }, { status: 502 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Webhook delivery failed', detail: err.message }, { status: 502 });
  }

  // Mark as published
  await ref.update({ status: 'published', updatedAt: new Date().toISOString() });

  return NextResponse.json({ success: true });
}
