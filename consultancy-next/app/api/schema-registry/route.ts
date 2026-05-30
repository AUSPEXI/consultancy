import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

// GET — return all schemas for a domain (used by layout to inject JSON-LD)
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain');
  if (!domain || !dbAdmin) return NextResponse.json({ schemas: [] });
  try {
    const snap = await dbAdmin.collection('schema_registry')
      .where('domain', '==', domain)
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();
    const schemas = snap.docs.map(d => d.data().schema);
    return NextResponse.json({ schemas }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } });
  } catch (e: any) {
    return NextResponse.json({ schemas: [], error: e.message });
  }
}

// POST — save a schema to the registry
export async function POST(req: NextRequest) {
  if (!dbAdmin) return NextResponse.json({ error: 'Admin SDK not available' }, { status: 503 });
  try {
    const { userId, domain, schema, factId } = await req.json();
    if (!userId || !domain || !schema) return NextResponse.json({ error: 'userId, domain, schema required' }, { status: 400 });

    await dbAdmin.collection('schema_registry').add({
      userId,
      domain,
      schema,
      factId: factId || null,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
