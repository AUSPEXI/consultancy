import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { secretsMatch } from '@/lib/api-auth';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { AmplifySchema } from '@/lib/output-validation';

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

      // Auto-amplify: generate 6-platform social posts and add to the social queue.
      // Non-fatal — ingest always succeeds even if amplification fails.
      try {
        const snippet = content.slice(0, 800);
        const fact = title ? `${title}: ${snippet}` : snippet;

        // Build per-platform UTM URLs so attribution is baked into each post
        const UTM_PARAMS: Record<string, string> = {
          linkedin:  'utm_source=linkedin&utm_medium=social&utm_campaign=content',
          twitter:   'utm_source=twitter&utm_medium=social&utm_campaign=content',
          reddit:    'utm_source=reddit&utm_medium=social&utm_campaign=content',
          youtube:   'utm_source=youtube&utm_medium=social&utm_campaign=content',
          tiktok:    'utm_source=tiktok&utm_medium=social&utm_campaign=content',
          instagram: 'utm_source=instagram&utm_medium=social&utm_campaign=content',
        };
        const platformUrls: Record<string, string> = {};
        if (url) {
          const sep = url.includes('?') ? '&' : '?';
          for (const [platform, params] of Object.entries(UTM_PARAMS)) {
            platformUrls[platform] = `${url}${sep}${params}`;
          }
        }

        const utmUrlBlock = url
          ? `\n\nPer-platform links to include in each post:\n` +
            Object.entries(platformUrls).map(([p, u]) => `- ${p}: ${u}`).join('\n')
          : '';

        const prompt = `You are a GEO Expert. Take this core brand fact and rewrite it for 6 social channels (LinkedIn, Twitter, Reddit, YouTube, TikTok, Instagram) to maximize semantic authority and citation probability. Include the platform-specific link naturally in the post copy.${utmUrlBlock}\n\nFact: "${fact}"\n\nReturn ONLY valid JSON with exactly these keys: linkedin, twitter, reddit, youtube, tiktok, instagram.`;
        const result = await llmOrchestrator.executeCall<any>({
          userId,
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          prompt,
          schema: AmplifySchema,
          feature: 'amplify',
        });
        if (result.success && result.data) {
          await dbAdmin.collection('social_queue').add({
            userId,
            sourceTitle: title || 'Inbound content',
            sourceUrl: url || null,
            platformUrls: Object.keys(platformUrls).length > 0 ? platformUrls : null,
            sourceType: type,
            platforms: result.data,
            status: 'pending',
            createdAt: timestamp,
          });
        }
      } catch (ampErr: any) {
        console.warn('[webhook/l8entspace] auto-amplify failed (non-fatal):', ampErr.message);
      }
    }

    return NextResponse.json({ success: true, type, timestamp });
  } catch (err: any) {
    console.error('[webhook/l8entspace]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
