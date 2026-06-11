/**
 * AUSPEXI Analytics Controller
 * 
 * The bridge between the high-scale data science backend 
 * and the React Dashboard UI.
 */

import { Request, Response } from 'express';
import { llmOrchestrator } from '../lib/llm-orchestrator';
import { vectorStore } from '../lib/vector-db';
import { anomalyDetector } from '../lib/anomaly-detection';
import { embeddingService } from '../lib/embeddings';
import { SOVMetricsSchema } from '../lib/output-validation';

export const AnalyticsController = {
  /**
   * 1. GET /api/analytics/pulse
   * Fetches historical sentiment drift for a brand.
   */
  async getSentimentPulse(req: Request, res: Response) {
    const { brandId } = req.query;
    if (!brandId) return res.status(400).json({ error: "brandId is required" });

    try {
      // 1. Fetch last 30 days of embeddings from pgvector
      const history = await vectorStore.hybridSearch([], {
        brandId: brandId as string,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        limit: 100
      });

      // 2. Define our "Golden Baseline" (Ideal Perception)
      // In production, this vector is pre-saved in your brand settings
      const baselineVector = await embeddingService.generateEmbeddings("The brand is secure, reliable, and enterprise-grade.");

      // 3. Map history to drift reports
      const pulseData = history.map((obs: any, index: number) => {
        const report = anomalyDetector.analyzeDrift(
          obs.embedding, 
          baselineVector[0], 
          history.slice(0, index) // Comparative window
        );
        return {
          date: obs.created_at,
          zScore: report.zScore,
          isAnomaly: report.isAnomaly,
          sentiment: obs.metadata.sentiment_score
        };
      });

      res.json({ success: true, pulse: pulseData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 2. GET /api/analytics/map
   * Returns data formatted for the 3D UMAP visualization.
   */
  async getSemanticMap(req: Request, res: Response) {
    const { brandId } = req.query;
    
    try {
      const records = await vectorStore.hybridSearch([], { 
        brandId: brandId as string, 
        limit: 500 
      });

      // Format for the frontend 3D library (e.g., ForceGraph3D or Three.js)
      const points = records.map((r: any) => ({
        id: r.id,
        x: r.embedding[0], // Simplified: Real UMAP reduction happens on frontend/python
        y: r.embedding[1],
        z: r.embedding[2],
        content: r.content,
        type: r.metadata.type
      }));

      res.json({ success: true, points });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 3. POST /api/analytics/audit
   * Orchestrates a new high-scale audit with all safeguards.
   */
  async runSecureAudit(req: Request, res: Response) {
    const { userId, brandName, domain, keywords } = req.body;

    const auditPrompt = `Analyze the GEO visibility for ${brandName} on ${domain} targeting ${keywords.join(', ')}. Return JSON.`;

    const result = await llmOrchestrator.executeCall({
      userId,
      provider: 'gemini',
      model: 'gemini-2.0-flash', // Latest high-speed model
      prompt: auditPrompt,
      schema: SOVMetricsSchema,
    });

    if (result.success) {
      // 1. Vectorize the result immediately
      const [vector] = await embeddingService.generateEmbeddings(JSON.stringify(result.data));
      
      // 2. Store in pgvector for future drift detection
      await vectorStore.insertBatch([{
        content: JSON.stringify(result.data),
        brandId: brandName,
        modelName: 'gemini-2.0-flash',
        metadata: { userId, type: 'audit' },
        embedding: vector
      }]);

      return res.json({ success: true, metrics: result.data });
    }

    res.status(400).json({ success: false, error: result.error });
  }
};
