import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/api-auth';

const UTM_PARAMS: Record<string, string> = {
  linkedin:  'utm_source=linkedin&utm_medium=social&utm_campaign=content',
  twitter:   'utm_source=twitter&utm_medium=social&utm_campaign=content',
  reddit:    'utm_source=reddit&utm_medium=social&utm_campaign=content',
  youtube:   'utm_source=youtube&utm_medium=social&utm_campaign=content',
  tiktok:    'utm_source=tiktok&utm_medium=social&utm_campaign=content',
  instagram: 'utm_source=instagram&utm_medium=social&utm_campaign=content',
};

function buildPlatformUrls(sourceUrl: string): Record<string, string> {
  const sep = sourceUrl.includes('?') ? '&' : '?';
  const result: Record<string, string> = {};
  for (const [platform, params] of Object.entries(UTM_PARAMS)) {
    result[platform] = `${sourceUrl}${sep}${params}`;
  }
  return result;
}

// Admin-only: patches platformUrls onto existing social_queue docs that predate UTM support.
// POST /api/admin/backfill-utm  (no body needed)
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  // Only the superuser account can run this
  if (!dbAdmin) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const userDoc = await dbAdmin.collection('users').doc(userId).get();
  if (userDoc.data()?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  // Find all social_queue docs belonging to this user that have a sourceUrl but no platformUrls
  const snap = await dbAdmin
    .collection('social_queue')
    .where('userId', '==', userId)
    .get();

  const toUpdate = snap.docs.filter(d => {
    const data = d.data();
    return data.sourceUrl && !data.platformUrls;
  });

  if (toUpdate.length === 0) {
    return NextResponse.json({ message: 'Nothing to update — all docs already have platformUrls', updated: 0 });
  }

  // Batch write in groups of 500 (Firestore limit)
  let updated = 0;
  const BATCH_SIZE = 500;
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const batch = dbAdmin.batch();
    for (const docSnap of toUpdate.slice(i, i + BATCH_SIZE)) {
      const { sourceUrl } = docSnap.data();
      batch.update(docSnap.ref, { platformUrls: buildPlatformUrls(sourceUrl) });
    }
    await batch.commit();
    updated += Math.min(BATCH_SIZE, toUpdate.length - i);
  }

  return NextResponse.json({ message: `Patched ${updated} social_queue docs with UTM platformUrls`, updated });
}
