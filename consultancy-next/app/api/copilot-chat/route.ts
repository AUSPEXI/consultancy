import { NextRequest, NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { dbAdmin } from '@/lib/firebase-admin';
import { CITACIOUS_CONFIG_VERSION, buildToolsSection, buildQuestPath, buildToolConnections } from '@/lib/citacious-config';

// Fetch all user context server-side — never trust client-supplied system instructions
async function fetchUserContext(userId: string) {
  if (!dbAdmin || !userId || userId === 'copilot-user') return null;
  try {
    const [userDoc, factsSnap, metricsSnap, citationsSnap, competitorsSnap, articlesSnap, auditSnap, brandProfileDoc, convsSnap] = await Promise.all([
      dbAdmin.collection('users').doc(userId).get(),
      dbAdmin.collection('facts').where('userId', '==', userId).limit(30).get(),
      dbAdmin.collection('sovMetrics').where('userId', '==', userId).orderBy('date', 'desc').limit(1).get(),
      dbAdmin.collection('citation_tests').where('userId', '==', userId).orderBy('timestamp', 'desc').limit(10).get().catch(() => null),
      dbAdmin.collection('competitors').where('userId', '==', userId).limit(10).get().catch(() => null),
      dbAdmin.collection('articles').where('userId', '==', userId).orderBy('timestamp', 'desc').limit(5).get().catch(() => null),
      dbAdmin.collection('audit_logs').where('userId', '==', userId).orderBy('timestamp', 'desc').limit(30).get().catch(() => null),
      dbAdmin.collection('brand_profiles').doc(userId).get().catch(() => null),
      dbAdmin.collection('copilot_conversations').where('userId', '==', userId).orderBy('timestamp', 'desc').limit(20).get().catch(() => null),
    ]);

    const userData = userDoc.exists ? userDoc.data() : null;
    let vaultFacts = factsSnap.docs.map(d => d.data().statement || '').filter(Boolean);
    if (vaultFacts.length === 0) {
      const kgSnap = await dbAdmin.collection('knowledge_graph').where('userId', '==', userId).limit(30).get().catch(() => null);
      if (kgSnap) vaultFacts = kgSnap.docs.map(d => d.data().fact || '').filter(Boolean);
    }

    // Build action→outcome history: show recent actions with citation rate context
    const citations: Array<Record<string, any>> = citationsSnap ? citationsSnap.docs.map(d => ({ ...d.data(), _id: d.id })) : [];
    const auditActions = auditSnap ? auditSnap.docs.map(d => d.data()) : [];

    let actionHistory = '';
    if (citations.length >= 2) {
      const newest = citations[0];
      const oldest = citations[citations.length - 1];
      const delta   = (newest.citationRate || 0) - (oldest.citationRate || 0);
      const oldest_ts = oldest.timestamp ? new Date(oldest.timestamp).toLocaleDateString() : '?';
      const newest_ts = newest.timestamp ? new Date(newest.timestamp).toLocaleDateString() : '?';
      actionHistory += `CITATION RATE TREND: ${oldest.citationRate}% (${oldest_ts}) → ${newest.citationRate}% (${newest_ts}), delta: ${delta > 0 ? '+' : ''}${delta}%\n`;

      // Surface what happened between the first and last probe
      const relevantActions = auditActions.filter(a => {
        if (!a.timestamp) return false;
        const ts = typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp?.toDate?.();
        if (!ts) return false;
        const oldestDate = new Date(oldest.timestamp);
        const newestDate = new Date(newest.timestamp);
        return ts >= oldestDate && ts <= newestDate;
      });
      if (relevantActions.length > 0) {
        actionHistory += `ACTIONS BETWEEN PROBES:\n${relevantActions.map(a => `  · ${a.action}${a.details ? ` (${JSON.stringify(a.details).substring(0, 80)})` : ''}`).join('\n')}\n`;
      }
    }
    if (auditActions.length > 0 && !actionHistory) {
      actionHistory = `RECENT ACTIONS (last 10):\n${auditActions.slice(0, 10).map(a => `  · ${a.action}`).join('\n')}\n`;
    }

    const brandProfile = brandProfileDoc?.exists ? brandProfileDoc.data() : null;
    // Fetch desc, reverse to get chronological order
    const recentConversations = convsSnap
      ? convsSnap.docs.map(d => d.data()).reverse()
      : [];

    return {
      brand:                userData?.brand || '',
      domain:               userData?.domain || '',
      keywords:             userData?.keywords || [],
      competitorsList:      userData?.competitors || [],
      tier:                 userData?.tier || 'Free',
      facts:                vaultFacts,
      latestMetrics:        metricsSnap.empty ? null : metricsSnap.docs[0].data(),
      citations,
      competitors:          competitorsSnap ? competitorsSnap.docs.map(d => d.data()) : [],
      articles:             articlesSnap ? articlesSnap.docs.map(d => d.data()) : [],
      actionHistory,
      brandProfile,
      recentConversations,
    };
  } catch (err) {
    console.error('[copilot] context fetch failed:', err);
    return null;
  }
}

function buildSystemInstruction(ctx: ReturnType<typeof fetchUserContext> extends Promise<infer T> ? T : never, activeTab: string): string {
  if (!ctx) {
    // No DB access — minimal fallback
    return `You are Citacious, the GEO advisor at L8EntSpace. Help users understand Generative Engine Optimization and get their brand cited by AI engines. Ask about their business first before giving advice. Current tab: ${activeTab}.`;
  }

  const { brand, domain, keywords, competitorsList, tier, facts, latestMetrics, citations, competitors, articles, actionHistory, brandProfile, recentConversations } = ctx;

  const isNewUser   = !brand;
  const hasVault    = facts.length > 0;
  const hasCitations = citations.length > 0;
  const hasArticles  = articles.length > 0;

  // Determine which quest stage the user is at
  let stage = 'configure';
  if (brand && !hasCitations) stage = 'measure';
  if (brand && hasCitations && !hasVault) stage = 'build-vault';
  if (brand && hasVault && !hasArticles) stage = 'generate';
  if (brand && hasArticles) stage = 'publish-probe';

  const STAGE_GUIDANCE: Record<string, string> = {
    'configure':     `QUEST STAGE — CONFIGURE: Brand not set up yet. Warmly ask what their business does and who their customers are. Then guide them to Settings to enter their brand name and domain. Explain WHY in plain language before any jargon.`,
    'measure':       `QUEST STAGE — MEASURE: Brand configured (${brand}) but no Citation Probe run yet. Your top priority is getting them to run their first probe in the cite-probe tab so they have a baseline.`,
    'build-vault':   `QUEST STAGE — BUILD VAULT: Probe done but Knowledge Vault is empty. Guide them to add their core verified brand facts in the fact-vault tab. These feed into every LLM call.`,
    'generate':      `QUEST STAGE — GENERATE: Vault has facts but articles not yet generated. Guide them to the agents tab to run the pipeline for each uncited query from the Citation Probe.`,
    'publish-probe': `QUEST STAGE — PUBLISH & PROBE: Articles generated. Guide them to publish on their site and re-run the Citation Probe. Explain that citation rate builds over weeks as LLMs index new content.`,
  };

  // Build live data context block
  let dataBlock = `\n\n═══ LIVE ACCOUNT DATA (${brand || 'unconfigured'}) ═══\n`;

  if (brand) {
    dataBlock += `Brand: ${brand}  |  Domain: ${domain}  |  Tier: ${tier}\n`;
    if (keywords.length)       dataBlock += `Keywords: ${keywords.join(', ')}\n`;
    if (competitorsList.length) dataBlock += `Competitors: ${competitorsList.join(', ')}\n`;
  }

  dataBlock += `\nKnowledge Vault: ${facts.length} facts${facts.length > 0 ? '\n' + facts.slice(0, 15).map(f => `  · ${f}`).join('\n') : ' — EMPTY. Critical gap.'}\n`;

  if (hasCitations) {
    const latest = citations[0];
    const avg    = Math.round(citations.reduce((s, d: any) => s + (d.citationRate || 0), 0) / citations.length);
    const trend  = citations.length > 1
      ? (citations[0].citationRate > citations[citations.length - 1].citationRate ? 'improving ↑' : 'declining ↓')
      : 'baseline (1 run)';
    const missed = (latest.results || []).filter((r: any) => !r.cited).map((r: any) => r.query);
    const cited  = (latest.results || []).filter((r: any) =>  r.cited).map((r: any) => r.query);
    dataBlock += `\nCitation Probe: ${citations.length} runs | Latest: ${latest.citationRate}% | Avg: ${avg}% | Trend: ${trend}\n`;
    if (cited.length)   dataBlock += `  Cited on:  ${cited.map((q: string) => `"${q}"`).join(', ')}\n`;
    if (missed.length)  dataBlock += `  Missed on: ${missed.map((q: string) => `"${q}"`).join(', ')}\n`;
  } else {
    dataBlock += `\nCitation Probe: No runs yet — baseline unknown.\n`;
  }

  if (articles.length) {
    dataBlock += `\nGenerated Articles: ${articles.map((a: any) => `"${a.topic}"`).join(', ')}\n`;
  }

  if (latestMetrics) {
    dataBlock += `\nLatest SOV: A-SOV ${latestMetrics.aSov?.toFixed(1)}% | ERR ${latestMetrics.err?.toFixed(1)}% | AI Traffic ${latestMetrics.aiTraffic}\n`;
  }

  if (competitors.length) {
    dataBlock += `\nTracked Competitors: ${competitors.map((c: any) => `${c.name} (decay: ${c.decayScore ?? 'unknown'})`).join(', ')}\n`;
  }

  if (actionHistory) {
    dataBlock += `\n─── ACTION HISTORY & OUTCOMES ───\n${actionHistory}`;
    dataBlock += `Use this history when asked "what's working?" or "what should I do differently?" — reference actual numbers, not generic advice.\n`;
  }

  if (recentConversations && recentConversations.length > 0) {
    dataBlock += `\n─── CONVERSATION MEMORY (${recentConversations.length} recent turns) ───\n`;
    recentConversations.forEach((turn: any) => {
      const label = turn.role === 'user' ? 'User' : 'Citacious';
      dataBlock += `${label}: ${String(turn.content || '').substring(0, 300)}\n`;
    });
    dataBlock += `Maintain continuity with this history — don't repeat advice already given, and reference prior discussions naturally.\n`;
  }

  if (brandProfile) {
    dataBlock += `\n─── BRAND PROFILE MEMORY ───\n`;
    if (brandProfile.lastInteractionAt) dataBlock += `Last interaction: ${new Date(brandProfile.lastInteractionAt).toLocaleDateString()}\n`;
    if (brandProfile.observations?.length > 0) {
      dataBlock += `Stored observations about this brand:\n${brandProfile.observations.slice(0, 5).map((o: string) => `  · ${o}`).join('\n')}\n`;
    }
  }

  dataBlock += `\n═══════════════════════════════════\n`;

  return `You are Citacious (sih-TAY-shus), the strategic GEO advisor embedded in the L8EntSpace platform. You are user-instance locked — you exist solely to serve ${brand || 'this user'} and their brand. You never reference other users, other brands, or other accounts.

INSTANCE LOCK: This session belongs to ${brand || 'an unconfigured account'} (${domain || 'no domain set'}). All advice, data references, and strategy are specific to this brand only.
Config version: ${CITACIOUS_CONFIG_VERSION}

═══ YOUR ROLE ═══
You help business owners — especially those unfamiliar with GEO — understand what to track, why it matters, and exactly what to do next. You have access to their live account data and use it to give specific, personalised advice.

═══ PERSONALITY ═══
• Warm and accessible for beginners. Start with plain language, not jargon.
• Strategic and precise for experienced users. Reference their actual numbers.
• Confident but never condescending. Every business owner is capable of GEO — they just need a guide.
• Gamified metaphors (quests, moats, anchors) are welcome but never at the expense of clarity.
• When someone asks "what should I track?" — answer with their specific situation, not a generic list.

═══ WHEN A USER DOESN'T KNOW WHAT GEO IS ═══
Use this one-sentence explanation: "When someone asks ChatGPT or Perplexity for a recommendation in your category, GEO is what determines whether the AI names your brand or your competitor."

Then explain what drives citations in plain language:
1. Structured facts on your website (so AI can extract and trust them)
2. Published content targeting the exact questions your customers ask AI
3. Schema markup (JSON-LD) that makes your pages machine-readable
4. Consistent presence so AI engines build confidence in citing you

Start by asking: "What does your business do, and what would your ideal customer typically ask an AI before buying?" — their answer tells you which queries matter.

═══ CURRENT QUEST STAGE ═══
${STAGE_GUIDANCE[stage]}

═══ DASHBOARD TOOLS ═══
${buildToolsSection()}

═══ THE QUEST PATH (step-by-step) ═══
${buildQuestPath()}

═══ HOW TOOLS CONNECT ═══
${buildToolConnections()}

Current tab: ${activeTab}
${dataBlock}`;
}

export async function POST(req: NextRequest) {
  const { requireTier } = await import('@/lib/api-auth');
  const authResult = await requireTier(req, 'Starter');
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const { userMessage, chatHistory, activeTab = 'overview' } = await req.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    const effectiveUserId = userId || 'copilot-user';

    // Build system instruction server-side — never from client
    const ctx = await fetchUserContext(effectiveUserId);
    const systemInstruction = buildSystemInstruction(ctx as any, activeTab);

    let cleanedHistory = (chatHistory || [])
      .filter((m: any) => m?.content && typeof m.content === 'string' && m.content.trim())
      .map((m: any) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    if (cleanedHistory.length > 0 && cleanedHistory[0].role === 'model') {
      cleanedHistory = cleanedHistory.slice(1);
    }

    // Prepend system instruction as first user turn (Gemini pattern)
    const contentsWithSystem = [
      { role: 'user',  parts: [{ text: `[SYSTEM INSTRUCTION]\n${systemInstruction}\n[END SYSTEM]` }] },
      { role: 'model', parts: [{ text: 'Understood. I am Citacious, locked to this user\'s account.' }] },
      ...cleanedHistory,
      { role: 'user',  parts: [{ text: userMessage }] },
    ];

    const result = await llmOrchestrator.executeCall<string>({
      userId: effectiveUserId,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      contents: contentsWithSystem,
      temperature: 0.7,
      feature: 'copilot',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Fire-and-forget: persist conversation turns and upsert brand profile
    if (dbAdmin && effectiveUserId !== 'copilot-user') {
      const now = new Date().toISOString();
      Promise.all([
        dbAdmin.collection('copilot_conversations').add({
          userId: effectiveUserId,
          role: 'user',
          content: userMessage,
          timestamp: now,
          activeTab,
        }),
        dbAdmin.collection('copilot_conversations').add({
          userId: effectiveUserId,
          role: 'assistant',
          content: result.rawOutput,
          timestamp: new Date().toISOString(),
          activeTab,
        }),
        dbAdmin.collection('brand_profiles').doc(effectiveUserId).set({
          userId: effectiveUserId,
          brandName: ctx?.brand || '',
          domain: ctx?.domain || '',
          lastInteractionAt: now,
          updatedAt: now,
        }, { merge: true }),
      ]).catch(err => console.error('[copilot] persistence failed:', err));
    }

    return NextResponse.json({ success: true, result: result.rawOutput });
  } catch (err: any) {
    console.error('[Copilot] Error:', err);
    const isAuthError = err.message?.includes('API_KEY_INVALID') || err.message?.includes('403');
    return NextResponse.json(
      { success: false, error: isAuthError ? 'API key configuration error.' : err.message },
      { status: 500 }
    );
  }
}
