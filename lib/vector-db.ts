/**
 * AUSPEXI Vector Architecture
 * 
 * Implements Hybrid Search (Vector + Metadata) using pgvector.
 * Optimized for 50M+ embeddings with HNSW indexing.
 */

import { Pool } from 'pg'; // Standard PostgreSQL client

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface SearchFilters {
  brandId: string;
  modelName?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export class VectorStore {
  /**
   * Initializes the database schema.
   * Run this once during setup.
   */
  async initializeSchema() {
    const query = `
      -- Enable the pgvector extension
      CREATE EXTENSION IF NOT EXISTS vector;

      -- Main Table for GEO Embeddings
      CREATE TABLE IF NOT EXISTS geo_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        metadata JSONB NOT NULL,
        brand_id TEXT NOT NULL,
        model_name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        embedding vector(768) -- Match Gemini text-embedding-004 dimensions
      );

      -- HNSW Index for ultra-fast similarity search
      -- m=16, ef_construction=64 are good defaults for balance of speed/accuracy
      CREATE INDEX IF NOT EXISTS idx_geo_embeddings_vector ON geo_embeddings 
      USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

      -- B-Tree Indexes for fast metadata filtering
      CREATE INDEX IF NOT EXISTS idx_geo_metadata_brand ON geo_embeddings (brand_id);
      CREATE INDEX IF NOT EXISTS idx_geo_created_at ON geo_embeddings (created_at);
    `;
    await pool.query(query);
  }

  /**
   * Performs a Hybrid Search:
   * 1. Filters by Metadata (Brand, Date, Model)
   * 2. Orders by Vector Similarity
   */
  async hybridSearch(queryVector: number[], filters: SearchFilters) {
    const { brandId, modelName, startDate, endDate, limit = 10 } = filters;
    
    // Construct the vector string for pgvector format '[0.1, 0.2, ...]'
    const vectorString = `[${queryVector.join(',')}]`;

    let queryText = `
      SELECT id, content, metadata, created_at, 
             (embedding <=> $1) AS distance
      FROM geo_embeddings
      WHERE brand_id = $2
    `;

    const values: any[] = [vectorString, brandId];
    let placeholderCount = 3;

    if (modelName) {
      queryText += ` AND model_name = $${placeholderCount++}`;
      values.push(modelName);
    }

    if (startDate && endDate) {
      queryText += ` AND created_at BETWEEN $${placeholderCount++} AND $${placeholderCount++}`;
      values.push(startDate, endDate);
    }

    queryText += ` ORDER BY distance ASC LIMIT $${placeholderCount}`;
    values.push(limit);

    const result = await pool.query(queryText, values);
    return result.rows;
  }

  /**
   * Efficient Batch Insertion
   */
  async insertBatch(records: { content: string; brandId: string; modelName: string; metadata: any; embedding: number[] }[]) {
    // Note: In production, use 'pg-promise' or 'unlogged tables' for 50M+ ingestion speeds
    for (const record of records) {
      const vectorString = `[${record.embedding.join(',')}]`;
      await pool.query(
        `INSERT INTO geo_embeddings (content, brand_id, model_name, metadata, embedding) 
         VALUES ($1, $2, $3, $4, $5)`,
        [record.content, record.brandId, record.modelName, record.metadata, vectorString]
      );
    }
  }
}

export const vectorStore = new VectorStore();
