import { GoogleGenAI } from '@google/genai';

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
  async generateEmbeddings(input: string | string[]): Promise<number[][]> {
    const inputs = Array.isArray(input) ? input : [input];
    const cleanInputs = inputs.map((text) => text.replace(/\n/g, ' '));
    const ai = getGenAI();

    const responses = await Promise.all(
      cleanInputs.map((text) =>
        ai.models.embedContent({ model: 'text-embedding-004', contents: text })
      )
    );

    return responses.map((res) => {
      if (res.embeddings && res.embeddings.length > 0) {
        return res.embeddings[0].values || [];
      }
      return [];
    });
  }

  calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  prepareUmapPayload(points: VectorPoint[]) {
    return points.map((p) => ({
      vector: p.embedding,
      label: p.metadata.brand || 'Unknown',
      metadata: p.metadata,
    }));
  }
}

export const embeddingService = new EmbeddingService();
