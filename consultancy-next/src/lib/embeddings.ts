import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export interface VectorPoint {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export class EmbeddingService {
  // Returns which engine is active — used for metadata/cost logging
  getActiveEngine(): { name: string; model: string; dimensions: number } {
    if (process.env.OPENAI_API_KEY) {
      return { name: 'openai', model: 'text-embedding-3-small', dimensions: 1536 };
    }
    return { name: 'gemini', model: 'text-embedding-004', dimensions: 768 };
  }

  async generateEmbeddings(input: string | string[]): Promise<number[][]> {
    const inputs = Array.isArray(input) ? input : [input];
    const cleanInputs = inputs.map(text => text.replace(/\n/g, ' ').trim()).filter(Boolean);

    // OpenAI text-embedding-3-small: 1536 dims, $0.02/1M tokens — preferred
    const openaiKey = process.env.OPENAI_API_KEY;
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
