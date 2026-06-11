import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { secretsMatch } from '@/lib/api-auth';

/**
 * Inbound webhook — receives content from the l8entspace.com internal server.
 * Authenticate with header: x-l8entspace-secret: <L8ENTSPACE_WEBHOOK_SECRET env var>
 *
 * Payload shape:
 * {
 *   userId: string,          // Firestore UID of the account to write to
 *   type: 'article' | 'fact' | 'page',
 *   title: string,
 *   content: string,         // full article markdown or fact statement
 *   url?: string,            // canonical URL of the page/post
 *   schema?: string,         // optional JSON-LD string to attach
 * }
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-l8entspace-secret') || '';
  if (!secretsMatch(secret, process.env.L8ENTSPACE_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!dbAdmin) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { userId, type = 'article', title, content, url, schema } = body;

    if (!userId || !content) {
      return NextResponse.json({ error: 'userId and content are required' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    if (type === 'fact') {
      await dbAdmin.collection('knowledge_graph').add({
        userId,
        topic: title || 'Inbound fact',
        fact: content,
        source: url || 'l8entspace-internal',
        createdAt: timestamp,
      });
    } else {
      // article or page — goes into the articles collection
      await dbAdmin.collection('articles').add({
        userId,
        topic: title || 'Inbound content',
        article: content,
        schema: schema || '',
        source: url || 'l8entspace-internal',
        brand: 'L8EntSpace',
        timestamp,
      });
    }

    return NextResponse.json({ success: true, type, timestamp });
  } catch (err: any) {
    console.error('[webhook/l8entspace]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
