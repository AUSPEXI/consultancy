/*
  # Add New AI Model Fields for Enhanced Pipeline

  1. New Fields
    - `summary` (text) - T5-Small text summarization
    - `anomaly_score` (float) - IsolationForest anomaly detection  
    - `arima_forecast` (float) - ARIMA enhanced time series forecasting
    - `node_embedding` (float[]) - Node2Vec network embeddings
    - `synthetic_profile` (float[]) - VAE generative profiles

  2. Performance Optimization
    - Indexes for new fields to support 1M records/day
    - Optimized for high-volume inserts
*/

-- Add new AI model fields to support 20 models (15 original + 5 NEW)
ALTER TABLE changes_data 
ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS anomaly_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS arima_forecast FLOAT,
ADD COLUMN IF NOT EXISTS node_embedding FLOAT[],
ADD COLUMN IF NOT EXISTS synthetic_profile FLOAT[];

-- Add indexes for new fields to support 1M records/day queries
CREATE INDEX IF NOT EXISTS idx_changes_data_summary ON changes_data USING gin(to_tsvector('english', summary));
CREATE INDEX IF NOT EXISTS idx_changes_data_anomaly_score ON changes_data (anomaly_score) WHERE anomaly_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_changes_data_arima_forecast ON changes_data (arima_forecast) WHERE arima_forecast IS NOT NULL;

-- Add composite indexes for enhanced performance
CREATE INDEX IF NOT EXISTS idx_changes_data_suite_timestamp_new ON changes_data (suite, timestamp DESC, anomaly_score);
CREATE INDEX IF NOT EXISTS idx_changes_data_enhanced_models ON changes_data (suite, timestamp DESC) 
WHERE summary IS NOT NULL OR anomaly_score IS NOT NULL OR arima_forecast IS NOT NULL;

-- Update table comment to reflect 20 AI models
COMMENT ON TABLE changes_data IS 'Optimized for high-volume data processing (1,000,000+ records/day). 
Features: 20 AI models (15 original + 5 NEW), composite indexes, partial indexes, JSONB optimization, and materialized views.
New models: T5-Small, IsolationForest, ARIMA Enhanced, Node2Vec, VAE.
Use refresh_changes_data_stats() to update dashboard statistics.';