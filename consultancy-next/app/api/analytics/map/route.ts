import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { embeddingService } from '@/lib/embeddings';

// TEO semantic axes — the three philosophical dimensions of brand latent space
// Axis 1 (x): Ontological     — what the brand fundamentally IS
// Axis 2 (y): Epistemological — what the brand KNOWS and can prove
// Axis 3 (z): Teleological    — what the brand IS FOR, its purpose and direction
const SEMANTIC_AXES = [
  'ontological brand identity: core being, fundamental nature, what this brand essentially is in the market',
  'epistemological authority: knowledge claims, verified facts, citation credibility, demonstrated expertise, thought leadership',
  'teleological purpose: strategic goals, value proposition, competitive differentiation, where this brand is headed',
];

// Default fallback anchors — one per TEO axis, covering all types
const DEFAULT_ANCHORS = [
  { label: 'Core Brand Identity',     color: '#ec4899', baseType: 'Systemic Anchor',  axisAlignment: 1 },
  { label: 'Knowledge Authority',     color: '#ec4899', baseType: 'Systemic Anchor',  axisAlignment: 1 },
  { label: 'Verifiable Claims',       color: '#06b6d4', baseType: 'Signal Point',     axisAlignment: 2 },
  { label: 'Citation Credibility',    color: '#06b6d4', baseType: 'Signal Point',     axisAlignment: 2 },
  { label: 'Strategic Direction',     color: '#8b5cf6', baseType: 'Emergent Trend',   axisAlignment: 3 },
  { label: 'Market Differentiation',  color: '#8b5cf6', baseType: 'Emergent Trend',   axisAlignment: 3 },
  { label: 'Competitive Threat',      color: '#f59e0b', baseType: 'Risk Vector',      axisAlignment: 2 },
];

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// Map baseType to its TEO axis for legacy anchors without axisAlignment
function inferAxis(baseType: string): 1 | 2 | 3 {
  if (baseType === 'Systemic Anchor') return 1;
  if (baseType === 'Signal Point') return 2;
  if (baseType === 'Emergent Trend') return 3;
  return 2;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');
    const platform = searchParams.get('platform') || 'All';
    const timeframe = searchParams.get('timeframe') || 'current';

    let anchorLabels: { label: string; color: string; baseType: string; axisAlignment?: number }[] = DEFAULT_ANCHORS;
    let vaultFacts: { text: string; id: string; embedding?: number[]; collection: 'facts' | 'knowledge_graph' }[] = [];

    if (userId && dbAdmin) {
      try {
        const userDoc = await dbAdmin.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          if (data?.latentAnchors?.length > 0) {
            anchorLabels = data.latentAnchors;
          }
        }

        // Primary source: facts collection (field: statement)
        const factsSnap = await dbAdmin
          .collection('facts')
          .where('userId', '==', userId)
          .limit(40)
          .get();
        vaultFacts = factsSnap.docs.map(d => ({
          id: d.id,
          text: (d.data().statement as string) || '',
          embedding: (d.data().embedding as number[] | undefined),
          collection: 'facts' as const,
        })).filter(f => f.text.length > 10);

        // Fallback: knowledge_graph (Perplexity-synced facts)
        if (vaultFacts.length === 0) {
          const kgSnap = await dbAdmin
            .collection('knowledge_graph')
            .where('userId', '==', userId)
            .limit(40)
            .get();
          vaultFacts = kgSnap.docs.map(d => ({
            id: d.id,
            text: (d.data().fact as string) || '',
            embedding: (d.data().embedding as number[] | undefined),
            collection: 'knowledge_graph' as const,
          })).filter(f => f.text.length > 10);
        }
      } catch (err) {
        console.error('Firestore fetch error in analytics/map:', err);
      }
    }

    // Group anchors by TEO axis
    const anchorsByAxis: Record<number, typeof anchorLabels> = { 1: [], 2: [], 3: [] };
    anchorLabels.forEach(a => {
      const axis = (a as any).axisAlignment ?? inferAxis(a.baseType);
      anchorsByAxis[axis].push(a);
    });

    // TEO axis embeddings — static strings, cache in Firestore to avoid re-embedding on every request
    let axisEmbeddings: number[][];
    let axisEmbeddingsWereNew = false;
    if (dbAdmin) {
      const axisCacheRef = dbAdmin.collection('_embeddings_cache').doc('teo_axes_v1');
      const axisCacheDoc = await axisCacheRef.get().catch(() => null);
      const cached = axisCacheDoc?.data()?.embeddings as number[][] | undefined;
      if (cached?.length === 3) {
        axisEmbeddings = cached;
      } else {
        axisEmbeddings = await embeddingService.generateEmbeddings(SEMANTIC_AXES);
        axisEmbeddingsWereNew = true;
        axisCacheRef.set({ embeddings: axisEmbeddings, cachedAt: new Date().toISOString() }).catch(() => {});
      }
    } else {
      axisEmbeddings = await embeddingService.generateEmbeddings(SEMANTIC_AXES);
      axisEmbeddingsWereNew = true;
    }

    const platforms = ['Gemini', 'ChatGPT', 'Claude'];
    let points: any[] = [];
    let newlyEmbeddedCount = 0;

    if (vaultFacts.length > 0) {
      // Split facts into cached (have stored embedding) and uncached (need embedding API call)
      const needsEmbedding = vaultFacts.filter(f => !f.embedding || f.embedding.length === 0);
      const hasCached      = vaultFacts.filter(f =>  f.embedding && f.embedding.length > 0);

      let freshEmbeddings: number[][] = [];
      if (needsEmbedding.length > 0) {
        freshEmbeddings = await embeddingService.generateEmbeddings(needsEmbedding.map(f => f.text));
        newlyEmbeddedCount = needsEmbedding.length;

        // Write new embeddings back to their source collection — fire-and-forget
        if (dbAdmin) {
          const batch = dbAdmin.batch();
          needsEmbedding.forEach((f, i) => {
            batch.update(dbAdmin!.collection(f.collection).doc(f.id), { embedding: freshEmbeddings[i] });
          });
          batch.commit().catch(() => {});
        }
      }

      // Build id → embedding map and reconstruct in original order
      const embMap = new Map<string, number[]>();
      hasCached.forEach(f    => embMap.set(f.id, f.embedding!));
      needsEmbedding.forEach((f, i) => embMap.set(f.id, freshEmbeddings[i]));
      const factEmbeddings = vaultFacts.map(f => embMap.get(f.id)!);

      points = factEmbeddings.map((emb, i) => {
        const x = clamp(dotProduct(emb, axisEmbeddings[0]) * 80, -90, 90);
        const y = clamp(dotProduct(emb, axisEmbeddings[1]) * 80, -90, 90);
        const z = clamp(dotProduct(emb, axisEmbeddings[2]) * 80, -90, 90);

        const absX = Math.abs(x), absY = Math.abs(y), absZ = Math.abs(z);
        const dominantAxis = absX > absY && absX > absZ ? 1 : absY > absZ ? 2 : 3;
        const candidates = anchorsByAxis[dominantAxis];
        const anchor = candidates.length > 0
          ? candidates[i % candidates.length]
          : anchorLabels[i % anchorLabels.length];

        return {
          id: i,
          x: parseFloat(x.toFixed(2)),
          y: parseFloat(y.toFixed(2)),
          z: parseFloat(z.toFixed(2)),
          size: Math.floor(Math.random() * 4) + 4,
          type: anchor.label,
          groupType: anchor.baseType,
          source: platform === 'All' ? platforms[i % 3] : platform,
          label: vaultFacts[i].text.substring(0, 60),
          distance: parseFloat((Math.sqrt(x * x + y * y + z * z) / (90 * Math.sqrt(3))).toFixed(4)),
          sentiment: y > 0 ? 'positive' : 'negative',
          real: true,
        };
      });
    } else {
      // Fallback: embed anchor labels as placeholder point clouds
      const anchorTexts = anchorLabels.map(a => `${a.label}: ${a.baseType}`);
      const anchorEmbs = await embeddingService.generateEmbeddings(anchorTexts);
      newlyEmbeddedCount = anchorTexts.length;

      points = anchorEmbs.flatMap((emb, ai) => {
        const cx = clamp(dotProduct(emb, axisEmbeddings[0]) * 80, -90, 90);
        const cy = clamp(dotProduct(emb, axisEmbeddings[1]) * 80, -90, 90);
        const cz = clamp(dotProduct(emb, axisEmbeddings[2]) * 80, -90, 90);
        const anchor = anchorLabels[ai];

        return Array.from({ length: 10 }, (_, i) => ({
          id: ai * 10 + i,
          x: parseFloat((cx + (Math.random() * 24 - 12)).toFixed(2)),
          y: parseFloat((cy + (Math.random() * 24 - 12)).toFixed(2)),
          z: parseFloat((cz + (Math.random() * 24 - 12)).toFixed(2)),
          size: Math.floor(Math.random() * 4) + 3,
          type: anchor.label,
          groupType: anchor.baseType,
          source: platform === 'All' ? platforms[i % 3] : platform,
          label: anchor.label,
          distance: Math.random(),
          sentiment: anchor.baseType === 'Risk Vector' ? 'negative' : (Math.random() > 0.3 ? 'positive' : 'negative'),
          real: false,
        }));
      });
    }

    const engineInfo = embeddingService.getActiveEngine();

    // Log cost only for texts that actually hit the embedding API this request
    const billableTexts = newlyEmbeddedCount + (axisEmbeddingsWereNew ? 3 : 0);
    if (userId && dbAdmin && billableTexts > 0) {
      const estimatedTokens = billableTexts * 20;
      const costUsd = engineInfo.name === 'openai'
        ? (estimatedTokens / 1_000_000) * 0.02
        : (estimatedTokens / 1_000_000) * 0.025;
      dbAdmin.collection('cost_audit').add({
        userId,
        feature: 'latent-space-map',
        model: engineInfo.model,
        provider: engineInfo.name,
        inputTokens: estimatedTokens,
        outputTokens: 0,
        estimatedCostUsd: costUsd,
        totalCostUsd: costUsd,
        textsEmbedded: billableTexts,
        cachedFacts: vaultFacts.length - newlyEmbeddedCount,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      points,
      metadata: {
        engine: engineInfo.model,
        provider: engineInfo.name,
        dimensions: engineInfo.dimensions,
        axes: ['Ontological', 'Epistemological', 'Teleological'],
        platform,
        timeframe,
        aggregatedAt: new Date().toISOString(),
        pathCount: points.length,
        anchorCount: anchorLabels.length,
        realEmbeddings: vaultFacts.length > 0,
        factsEmbedded: vaultFacts.length,
        cachedEmbeddings: vaultFacts.length - newlyEmbeddedCount,
        newlyEmbedded: newlyEmbeddedCount,
      },
    });
  } catch (error: any) {
    console.error('Error in analytics/map:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
