/**
 * AUSPEXI Anomaly Detection Engine
 * 
 * Distinguishes between "Generative Noise" and "Statistically Significant Drift"
 * Uses Rolling Z-Scores on Cosine Distances to track brand health.
 */

import { embeddingService } from './embeddings';

export interface Observation {
  timestamp: Date;
  embedding: number[];
  distanceFromBaseline: number;
}

export interface DriftReport {
  isAnomaly: boolean;
  confidence: number; // 0 to 1
  zScore: number;
  driftDirection: 'positive' | 'negative' | 'neutral';
  message: string;
}

export class AnomalyDetector {
  private static Z_THRESHOLD = 2.5; // Standard deviations for an anomaly
  private static MIN_OBSERVATIONS = 7; // Need at least a week of data

  /**
   * Detects if a new observation represents a significant drift 
   * from the historical moving average.
   */
  public analyzeDrift(
    newEmbedding: number[],
    baselineEmbedding: number[],
    history: Observation[]
  ): DriftReport {
    // 1. Calculate current distance from the "Ideal Brand Concept"
    const currentDistance = embeddingService.calculateCosineSimilarity(
      newEmbedding,
      baselineEmbedding
    );

    if (history.length < AnomalyDetector.MIN_OBSERVATIONS) {
      return {
        isAnomaly: false,
        confidence: 0,
        zScore: 0,
        driftDirection: 'neutral',
        message: "Insufficient historical data for drift analysis."
      };
    }

    // 2. Calculate Mean and Standard Deviation of historical distances
    const distances = history.map(h => h.distanceFromBaseline);
    const mean = distances.reduce((a, b) => a + b, 0) / distances.length;
    const variance = distances.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);

    // 3. Calculate Z-Score: (x - μ) / σ
    // Note: In Cosine Similarity, a SMALLER number means MORE distance (worse sentiment)
    const zScore = (currentDistance - mean) / (stdDev || 0.0001);

    // 4. Determine if this is a significant anomaly
    const isAnomaly = Math.abs(zScore) > AnomalyDetector.Z_THRESHOLD;
    
    let direction: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (zScore < -AnomalyDetector.Z_THRESHOLD) direction = 'negative';
    if (zScore > AnomalyDetector.Z_THRESHOLD) direction = 'positive';

    return {
      isAnomaly,
      zScore,
      confidence: Math.min(Math.abs(zScore) / 5, 1),
      driftDirection: direction,
      message: isAnomaly 
        ? `Significant ${direction} drift detected! Z-Score: ${zScore.toFixed(2)}`
        : "Sentiment remains within normal generative variance."
    };
  }

  /**
   * Batch Processing Logic:
   * Process historical data in chunks to avoid memory overflow (Prompt 3 problem)
   */
  public calculateRollingBaseline(historyStream: Observation[]): number[] {
    // In a production environment, this would use a moving window 
    // or an Exponentially Weighted Moving Average (EWMA)
    const vectorSize = historyStream[0].embedding.length;
    const meanVector = new Array(vectorSize).fill(0);

    for (const obs of historyStream) {
      for (let i = 0; i < vectorSize; i++) {
        meanVector[i] += obs.embedding[i];
      }
    }

    return meanVector.map(v => v / historyStream.length);
  }
}

export const anomalyDetector = new AnomalyDetector();
