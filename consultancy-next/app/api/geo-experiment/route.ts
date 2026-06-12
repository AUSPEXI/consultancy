import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { dbAdmin } from '@/lib/firebase-admin';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import {
  runHeadToHead, getLever, estimateExperimentCost,
  EXPERIMENT_ENGINES, type PlatformKey,
} from '@/lib/geo-experiment-core';

export const maxDuration = 800;

// Hard caps so a self-serve run can't blow the budget or time out.
const MAX_TRIALS_PER_QUERY = 3;
const MAX_QUERIES = 5;
const MONTHLY_CEILING_USD = Number(process.env.EXPERIMENT_MONTHLY_CEILING_USD || 15);

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  if (!dbAdmin) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const content: string = (body.content || '').trim();
    const leverId: string = body.leverId || '';
    const topic: string = (body.topic || '').trim();
    const brand: string = (body.brand || '').trim();
    let queries: string[] = Array.isArray(body.queries) ? body.queries.filter(Boolean) : [];
    let engines: PlatformKey[] = Array.isArray(body.engines) && body.engines.length
      ? body.engines.filter((e: string) => EXPERIMENT_ENGINES.includes(e as PlatformKey))
      : EXPERIMENT_ENGINES.filter(e => e !== 'perplexity'); // Perplexity opt-in (dominant cost)
    const trialsPerQuery = Math.min(Math.max(1, Number(body.trialsPerQuery) || 2), MAX_TRIALS_PER_QUERY);

    const lever = getLever(leverId);
    if (!content || content.length < 120) {
      return NextResponse.json({ error: 'Provide a draft of at least ~120 characters' }, { status: 400 });
    }
    if (!lever) {
      return NextResponse.json({ error: 'Unknown lever' }, { status: 400 });
    }
    if (!topic && queries.length === 0) {
      return NextResponse.json({ error: 'Provide a topic or at least one query' }, { status: 400 });
    }

    // Monthly budget guard
    const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
    const spendSnap = await dbAdmin.collection('cost_audit')
      .where('feature', '==', 'geo-experiment')
      .where('timestamp', '>=', monthStart.toISOString())
      .get();
    const spent = spendSnap.docs.reduce((s, d) => s + (d.data().cost || 0), 0);
    if (spent >= MONTHLY_CEILING_USD) {
      return NextResponse.json({ error: 'Monthly experiment budget reached. Try again next month.' }, { status: 429 });
    }

    // 1. Generate the query set if not supplied (3–4 paraphrases of the topic)
    if (queries.length === 0) {
      const qRes = await llmOrchestrator.executeCall<string>({
        userId, provider: 'gemini', model: 'gemini-2.5-flash', feature: 'geo-experiment',
        prompt: `Generate 4 distinct natural-language questions a real person would ask an AI engine about "${topic}". Vary the phrasing. Return ONLY the questions, one per line, no numbering.`,
      });
      const raw = typeof qRes.data === 'string' ? qRes.data : qRes.rawOutput || '';
      queries = raw.split('\n').map(s => s.replace(/^[\d.\-)\s]+/, '').trim()).filter(Boolean).slice(0, MAX_QUERIES);
    }
    queries = queries.slice(0, MAX_QUERIES);
    if (queries.length === 0) {
      return NextResponse.json({ error: 'Could not derive any queries' }, { status: 400 });
    }

    // 2. Generate variant B by applying the lever (one variable changed)
    const bRes = await llmOrchestrator.executeCall<string>({
      userId, provider: 'gemini', model: 'gemini-2.5-flash', feature: 'geo-experiment',
      prompt: `You are editing an article to apply ONE specific change for an A/B test. Apply exactly this change and nothing else:

CHANGE: ${lever.transform}

Do not add, remove or alter any factual claims beyond what the change requires. Return ONLY the edited article in markdown. No preamble.

ARTICLE:
"""
${content.substring(0, 8000)}
"""`,
    });
    const variantB = (typeof bRes.data === 'string' ? bRes.data : bRes.rawOutput || '').trim();
    if (!variantB || variantB.length < 80) {
      return NextResponse.json({ error: 'Variant generation failed' }, { status: 500 });
    }

    // 3. Run the fast-mode head-to-head
    const result = await runHeadToHead({
      variantA: content, variantB, queries, engines, trialsPerQuery,
    });

    // 4. Log cost + persist the run
    const cost = estimateExperimentCost(engines, queries.length, trialsPerQuery);
    dbAdmin.collection('cost_audit').add({
      userId, feature: 'geo-experiment', cost, timestamp: new Date().toISOString(),
    }).catch(() => {});

    const docRef = await dbAdmin.collection('geo_experiments').add({
      userId, leverId, leverLabel: lever.label, topic, brand,
      queries, engines, trialsPerQuery,
      result, variantB, cost,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      experimentId: docRef.id,
      lever: { id: lever.id, label: lever.label, description: lever.description },
      queries, engines, trialsPerQuery,
      result, variantB, cost,
    });
  } catch (err: any) {
    console.error('geo-experiment error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
