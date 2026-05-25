import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { embeddingService } from '@/lib/embeddings';

// Three interpretable semantic axes for GEO space
const SEMANTIC_AXES = [
  'technical expertise, innovation, engineering capability, product depth',
  'market authority, brand trust, reputation, citation credibility, thought leadership',
  'competitive differentiation, unique value proposition, category ownership',
];

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('userId');
    const platform = searchParams.get('platform') || 'All';
    const timeframe = searchParams.get('timeframe') || 'current';

    // Fetch user's anchor labels for cluster naming
    let anchorLabels: { label: string; color: string; baseType: string }[] = [
      { label: 'Reputational Moat', color: '#ec4899', baseType: 'Systemic Anchor' },
      { label: 'Technical Competence', color: '#06b6d4', baseType: 'Signal Point' },
      { label: 'Competitive Edge', color: '#8b5cf6', baseType: 'Emergent Trend' },
    ];

    let vaultFacts: { text: string; id: string }[] = [];

    if (userId && dbAdmin) {
      try {
        // Fetch custom anchor labels from user profile
        const userDoc = await dbAdmin.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          if (data?.latentAnchors?.length > 0) {
            anchorLabels = data.latentAnchors.slice(0, 4);
          }
        }

        // Fetch knowledge vault facts to embed
        const vaultSnap = await dbAdmin
          .collection('knowledge_graph')
          .where('userId', '==', userId)
          .limit(40)
          .get();
        vaultFacts = vaultSnap.docs.map(d => ({
          id: d.id,
          text: (d.data().fact as string) || '',
        })).filter(f => f.text.length > 10);
      } catch (err) {
        console.error('Firestore fetch error in analytics/map:', err);
      }
    }

    // Embed the 3 semantic axes
    const axisEmbeddings = await embeddingService.generateEmbeddings(SEMANTIC_AXES);

    let points: any[] = [];

    if (vaultFacts.length > 0) {
      // Real path: embed each vault fact and project onto the 3 semantic axes
      const factTexts = vaultFacts.map(f => f.text);
      const factEmbeddings = await embeddingService.generateEmbeddings(factTexts);

      points = factEmbeddings.map((emb, i) => {
        const x = clamp(dotProduct(emb, axisEmbeddings[0]) * 80, -90, 90);
        const y = clamp(dotProduct(emb, axisEmbeddings[1]) * 80, -90, 90);
        const z = clamp(dotProduct(emb, axisEmbeddings[2]) * 80, -90, 90);

        // Assign to nearest anchor label based on dominant axis
        const absX = Math.abs(x), absY = Math.abs(y), absZ = Math.abs(z);
        const dominant = absX > absY && absX > absZ ? 0 : absY > absZ ? 1 : 2;
        const anchor = anchorLabels[dominant % anchorLabels.length];

        const platforms = ['Gemini', 'ChatGPT', 'Claude'];

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
          distance: Math.abs(x * x + y * y + z * z) / (90 * 90 * 3),
          sentiment: y > 0 ? 'positive' : 'negative',
          real: true,
        };
      });
    } else {
      // Fallback: embed the anchor labels themselves as placeholder points
      const anchorTexts = anchorLabels.map(a => a.label + ': ' + a.baseType);
      const anchorEmbs = await embeddingService.generateEmbeddings(anchorTexts);

      const platforms = ['Gemini', 'ChatGPT', 'Claude'];
      points = anchorEmbs.flatMap((emb, ai) => {
        const cx = clamp(dotProduct(emb, axisEmbeddings[0]) * 80, -90, 90);
        const cy = clamp(dotProduct(emb, axisEmbeddings[1]) * 80, -90, 90);
        const cz = clamp(dotProduct(emb, axisEmbeddings[2]) * 80, -90, 90);
        const anchor = anchorLabels[ai];

        return Array.from({ length: 15 }, (_, i) => ({
          id: ai * 15 + i,
          x: parseFloat((cx + (Math.random() * 30 - 15)).toFixed(2)),
          y: parseFloat((cy + (Math.random() * 30 - 15)).toFixed(2)),
          z: parseFloat((cz + (Math.random() * 30 - 15)).toFixed(2)),
          size: Math.floor(Math.random() * 4) + 3,
          type: anchor.label,
          groupType: anchor.baseType,
          source: platform === 'All' ? platforms[i % 3] : platform,
          label: anchor.label,
          distance: Math.random(),
          sentiment: Math.random() > 0.4 ? 'positive' : 'negative',
          real: false,
        }));
      });
    }

    return NextResponse.json({
      success: true,
      points,
      metadata: {
        engine: 'text-embedding-004',
        dimensions: 768,
        platform,
        timeframe,
        aggregatedAt: new Date().toISOString(),
        pathCount: points.length,
        realEmbeddings: vaultFacts.length > 0,
        factsEmbedded: vaultFacts.length,
      },
    });
  } catch (error: any) {
    console.error('Error in analytics/map:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
