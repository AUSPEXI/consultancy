// Fact-to-query geometry — shared by the cite-probe route (training-data
// logging) and the content-gap engine (/api/analytics/gaps).
//
// All vectors must live in the SAME embedding space (the embeddings service
// guarantees this within a single process call). Embeddings are unit-normalised
// by the service, so dot product == cosine similarity.

import type { dbAdmin as DbAdmin } from '@/lib/firebase-admin';

export const GEOMETRY_SIM_THRESHOLD = 0.5; // sim above this = fact "covers" the query

export interface QueryGeometry {
  /** 1 − max cosine similarity to any vault fact. 1 = nothing remotely close. */
  minFactDistance: number | null;
  /** Number of vault facts with cosine similarity > GEOMETRY_SIM_THRESHOLD. */
  factDensityNearQuery: number;
  /** Text of the single nearest fact (for explainability in the UI). */
  nearestFactText: string | null;
  /** Cosine similarity of that nearest fact. */
  nearestFactSimilarity: number | null;
}

export function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

/**
 * Computes per-query geometry against the fact corpus. Order of the returned
 * array matches `queryEmbeddings`.
 */
export function computeQueryGeometry(
  queryEmbeddings: number[][],
  facts: { text: string; embedding: number[] }[],
): QueryGeometry[] {
  return queryEmbeddings.map(qEmb => {
    if (facts.length === 0 || !qEmb?.length) {
      return { minFactDistance: null, factDensityNearQuery: 0, nearestFactText: null, nearestFactSimilarity: null };
    }
    let bestSim = -Infinity;
    let bestText: string | null = null;
    let density = 0;
    for (const f of facts) {
      const sim = dot(qEmb, f.embedding);
      if (sim > bestSim) { bestSim = sim; bestText = f.text; }
      if (sim > GEOMETRY_SIM_THRESHOLD) density++;
    }
    return {
      minFactDistance: parseFloat((1 - bestSim).toFixed(4)),
      factDensityNearQuery: density,
      nearestFactText: bestText,
      nearestFactSimilarity: parseFloat(bestSim.toFixed(4)),
    };
  });
}

/**
 * Loads the user's vault facts that already have embeddings.
 * Tries `facts` first, falls back to `knowledge_graph` (same precedence as the
 * latent-space map route). Facts without embeddings are skipped — embedding
 * them here would duplicate the map route's billing/caching path.
 */
export async function loadEmbeddedFacts(
  db: typeof DbAdmin,
  userId: string,
  limit = 60,
): Promise<{ text: string; embedding: number[] }[]> {
  if (!db) return [];
  const fromSnap = (docs: FirebaseFirestore.QueryDocumentSnapshot[], field: string) =>
    docs
      .map(d => ({
        text: (d.data()[field] as string) || '',
        embedding: (d.data().embedding as number[] | undefined) ?? [],
      }))
      .filter(f => f.text.length > 10 && f.embedding.length > 0);

  const factsSnap = await db.collection('facts').where('userId', '==', userId).limit(limit).get();
  let facts = fromSnap(factsSnap.docs, 'statement');
  if (facts.length === 0) {
    const kgSnap = await db.collection('knowledge_graph').where('userId', '==', userId).limit(limit).get();
    facts = fromSnap(kgSnap.docs, 'fact');
  }
  return facts;
}
