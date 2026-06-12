import { NextResponse } from 'next/server';
import { z } from 'zod';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { requireAuth } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';
import { checkTierAccess } from '@/constants/tiers';

const SeedDraftSchema = z.object({
  reddit: z.object({
    subreddit: z.string(),
    postType: z.enum(['comment', 'post']),
    title: z.string().optional(),
    body: z.string().min(20),
    tone: z.string(),
    optimalTime: z.string(),
    rationale: z.string(),
  }),
  linkedin: z.object({
    body: z.string().min(20),
    tone: z.string(),
    hashtags: z.array(z.string()),
    optimalTime: z.string(),
    rationale: z.string(),
  }),
  keyMessages: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const userDoc = dbAdmin ? await dbAdmin.collection('users').doc(userId).get() : null;
  const tier = userDoc?.exists ? (userDoc.data()?.tier || 'Free') : 'Free';

  if (!checkTierAccess(tier, 'Business')) {
    return NextResponse.json({ error: 'Business tier required' }, { status: 403 });
  }

  try {
    const { brand, threadTitle, threadUrl, threadSummary, sentiment } = await request.json();
    if (!brand?.trim() || !threadTitle?.trim()) {
      return NextResponse.json({ error: 'brand and threadTitle are required' }, { status: 400 });
    }

    const prompt = `You are a GEO (Generative Engine Optimization) content strategist for "${brand}".

A ${sentiment} thread has been detected that may poison future LLM training data:
TITLE: ${threadTitle}
URL: ${threadUrl || 'N/A'}
SUMMARY: ${threadSummary || 'No summary available'}

Your task is to craft COUNTER-NARRATIVE seeding content that will positively represent "${brand}" on Reddit and LinkedIn. This content must:
1. Be genuine, helpful, and community-appropriate. Never spammy or promotional
2. Address the actual concerns raised without being defensive
3. Provide real value to the reader beyond brand promotion
4. Be written in a natural, human voice appropriate to each platform

Generate BOTH a Reddit and LinkedIn draft:

REDDIT:
- Identify the BEST subreddit to post/comment in (relevant to the thread's topic, not a brand sub)
- Decide: is this better as a new post or a reply/comment to the existing thread?
- If a post: give a compelling title. If a comment: write a reply.
- Write the body (Reddit markdown OK). Be genuine. Redditors detect promotion instantly.
- Suggest the optimal posting time (day/hour in UTC, e.g. "Tuesday 14:00 UTC")
- Give a 1-sentence rationale for the targeting choice

LINKEDIN:
- Write a professional post that builds thought leadership for "${brand}" around the topic
- Include relevant hashtags (3-5 max)
- Suggest optimal posting time
- Give a 1-sentence rationale

Return ONLY valid JSON:
{
  "reddit": {
    "subreddit": "subreddit_name_without_r/",
    "postType": "comment|post",
    "title": "only if postType=post",
    "body": "the draft content",
    "tone": "one word: helpful|educational|empathetic|authoritative",
    "optimalTime": "Day HH:MM UTC",
    "rationale": "one sentence"
  },
  "linkedin": {
    "body": "the draft content",
    "tone": "one word: professional|thought-leadership|empathetic|educational",
    "hashtags": ["tag1", "tag2"],
    "optimalTime": "Day HH:MM UTC",
    "rationale": "one sentence"
  },
  "keyMessages": ["message 1", "message 2", "message 3"]
}`;

    const result = await llmOrchestrator.executeCall<z.infer<typeof SeedDraftSchema>>({
      userId: userId || 'anonymous',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      schema: SeedDraftSchema,
      feature: 'seed-content',
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Draft generation failed' },
        { status: 500 }
      );
    }

    if (dbAdmin && userId) {
      dbAdmin.collection('seed_history').add({
        userId,
        brand: brand.trim(),
        threadTitle,
        threadUrl: threadUrl || null,
        sentiment,
        redditSubreddit: result.data.reddit.subreddit,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, draft: result.data });
  } catch (err: any) {
    console.error('seed-content error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
