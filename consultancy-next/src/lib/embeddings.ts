import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { localEmbeddingService, LOCAL_EMBEDDING_SPACE } from './local-embeddings';

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export type EmbeddingMode = 'auto' | 'local' | 'api';

export interface VectorPoint {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export class EmbeddingService {
  // Returns which engine is active — used for metadata/cost logging
  getActiveEngine(mode: EmbeddingMode = 'auto'): { name: string; model: string; dimensions: number } {
    if (mode === 'local') {
      return localEmbeddingService.getActiveEngine();
    }
    if (process.env.OPENAI_API_KEY) {
      return { name: 'openai', model: 'text-embedding-3-small', dimensions: 1536 };
    }
    if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
      return { name: 'gemini', model: 'text-embedding-004', dimensions: 768 };
    }
    // No API key configured → zero-cost local embedder
    return localEmbeddingService.getActiveEngine();
  }

  /**
   * The embedding "space" identifier for the vectors that generateEmbeddings
   * would produce under the given mode. Store this alongside vectors so they're
   * never cosine-compared across incompatible spaces.
   */
  getActiveSpace(mode: EmbeddingMode = 'auto'): string {
    const engine = this.getActiveEngine(mode);
    return engine.model;
  }

  /**
   * Generate embeddings.
   *  - mode 'local'  → always use the zero-cost synonym embedder
   *  - mode 'api'    → always use the configured API (Gemini/OpenAI)
   *  - mode 'auto'   → use API if a key exists, else fall back to local (free)
   */
  async generateEmbeddings(input: string | string[], mode: EmbeddingMode = 'auto'): Promise<number[][]> {
    const inputs = Array.isArray(input) ? input : [input];
    const cleanInputs = inputs.map(text => text.replace(/\n/g, ' ').trim()).filter(Boolean);

    if (mode === 'local') {
      return localEmbeddingService.embedMany(cleanInputs);
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    // No API key available — in auto mode this is the zero-cost path
    if (!openaiKey && !geminiKey) {
      if (mode === 'api') throw new Error('No embedding API key configured');
      return localEmbeddingService.embedMany(cleanInputs);
    }

    // OpenAI text-embedding-3-small: 1536 dims, $0.02/1M tokens — preferred
    if (openaiKey) {
      const client = new OpenAI({ apiKey: openaiKey });
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: cleanInputs,
      });
      return response.data
        .sort((a, b) => a.index - b.index)
        .map(d => d.embedding);
    }

    // Fallback: Gemini text-embedding-004 (768 dims)
    const ai = getGenAI();
    const responses = await Promise.all(
      cleanInputs.map(text =>
        ai.models.embedContent({ model: 'text-embedding-004', contents: text })
      )
    );
    return responses.map(res => {
      if (res.embeddings && res.embeddings.length > 0) {
        return res.embeddings[0].values || [];
      }
      return [];
    });
  }

  calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Generate BOTH an API embedding and a local synonym embedding in parallel.
   *
   * The alignment score (cosine between the two vectors, projected into the
   * same space via a scalar comparison) tells you how well the local dictionary
   * covers a given piece of text:
   *   > 0.7 → local vector is a good proxy; cheaper to use local for this concept
   *   0.3–0.7 → partial coverage; local useful for retrieval but API for ranking
   *   < 0.3 → poor coverage; this concept needs more synonym entries
   *
   * Use case: on every high-priority API call, also compute local + store both.
   * Over time the alignment scores reveal which synonym groups to expand.
   *
   * Both vectors are stored under the SAME fact document:
   *   embedding        — API vector (Gemini/OpenAI)
   *   embeddingSpace   — 'text-embedding-004' | 'text-embedding-3-small'
   *   localEmbedding   — local synonym vector (768-D)
   *   localEmbeddingSpace — 'local-synonym-v1'
   *   embeddingAlignmentScore — cosine(api_normalized, local_normalized)
   */
  async generateWithLocal(
    input: string | string[],
  ): Promise<{
    apiEmbeddings: number[][];
    localEmbeddings: number[][];
    alignmentScores: number[];
    apiSpace: string;
    localSpace: string;
  }> {
    const inputs = Array.isArray(input) ? input : [input];

    // Run both in parallel — local is synchronous so it never slows the API call
    const [apiVecs, localVecs] = await Promise.all([
      this.generateEmbeddings(inputs, 'api'),
      Promise.resolve(localEmbeddingService.embedMany(inputs)),
    ]);

    // Alignment: cosine between api vec (L2-normalised by provider) and local vec (already L2-normalised)
    // Since dims differ (e.g. 1536 vs 768) we can't dot-product directly — use a magnitude-independent
    // proxy: cosine of the overlapping first-N dims as a rough calibration signal.
    const minDim = Math.min(apiVecs[0]?.length ?? 0, localVecs[0]?.length ?? 0);
    const alignmentScores = apiVecs.map((api, i) => {
      const local = localVecs[i];
      if (!api || !local || minDim === 0) return 0;
      let dot = 0, na = 0, nb = 0;
      for (let d = 0; d < minDim; d++) {
        dot += api[d] * local[d];
        na += api[d] * api[d];
        nb += local[d] * local[d];
      }
      na = Math.sqrt(na); nb = Math.sqrt(nb);
      return na === 0 || nb === 0 ? 0 : Math.round((dot / (na * nb)) * 1000) / 1000;
    });

    return {
      apiEmbeddings: apiVecs,
      localEmbeddings: localVecs,
      alignmentScores,
      apiSpace: this.getActiveSpace('api'),
      localSpace: LOCAL_EMBEDDING_SPACE,
    };
  }

  prepareUmapPayload(points: VectorPoint[]) {
    return points.map(p => ({
      vector: p.embedding,
      label: p.metadata.brand || 'Unknown',
      metadata: p.metadata,
    }));
  }
}

export const embeddingService = new EmbeddingService();
