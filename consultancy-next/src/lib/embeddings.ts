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

  prepareUmapPayload(points: VectorPoint[]) {
    return points.map(p => ({
      vector: p.embedding,
      label: p.metadata.brand || 'Unknown',
      metadata: p.metadata,
    }));
  }
}

export const embeddingService = new EmbeddingService();
