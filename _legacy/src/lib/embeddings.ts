/**
 * UPDATED: AUSPEXI Latent Space Engine (Gemini Version)
 * 
 * Uses Google Gemini text-embedding-004.
 */

import { GoogleGenAI } from '@google/genai';

// Initialize with environmental variable or browser fallback
const getGenAI = () => {
    return new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GEMINI_API_KEY : "") || ""
    });
};

export interface VectorPoint {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export class EmbeddingService {
  /**
   * Generates embeddings using Gemini's text-embedding-004.
   * Note: Gemini embeddings are 768-dimensional by default.
   */
  async generateEmbeddings(input: string | string[]): Promise<number[][]> {
    const inputs = Array.isArray(input) ? input : [input];
    
    // Clean inputs (remove newlines)
    const cleanInputs = inputs.map(text => text.replace(/\n/g, " "));

    const ai = getGenAI();

    // Gemini handles batching natively through embedContent
    const responses = await Promise.all(
      cleanInputs.map(text => ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text
      }))
    );

    return responses.map(res => {
      if (res.embeddings && res.embeddings.length > 0) {
        return res.embeddings[0].values || [];
      }
      return [];
    });
  }

  /**
   * Calculates the exact 'distance' in latent space between two vectors.
   * Cosine Similarity: (A · B) / (||A|| ||B||)
   * A result of 1.0 means identical meaning; 0.0 means unrelated.
   */
  calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Prepares data for UMAP visualization.
   * Note: UMAP computation is heavy and usually happens on the client or a Python microservice.
   * This prepares the JSON structure required for the 3D Voronoi/Scatter plots.
   */
  prepareUmapPayload(points: VectorPoint[]) {
    return points.map(p => ({
      vector: p.embedding,
      label: p.metadata.brand || 'Unknown',
      metadata: p.metadata
    }));
  }
}

export const embeddingService = new EmbeddingService();
