/*
  # Finance Data Performance Optimizations

  1. New Materialized View
    - `finance_data_stats` - Pre-computed statistics for dashboard
  2. Database Functions
    - `get_finance_data_stats()` - Optimized stats retrieval
    - `refresh_finance_data_stats()` - Refresh materialized view
    - `batch_insert_finance_data()` - Efficient batch processing
  3. Performance Indexes
    - Partial indexes for recent data
    - Composite indexes for common queries
  4. Table Optimizations
    - Improved fillfactor and autovacuum settings
*/

-- Create materialized view for finance data statistics (STABLE - no date filtering)
CREATE MATERIALIZED VIEW IF NOT EXISTS finance_data_stats AS
SELECT 
  -- Basic counts (no date filtering here for stability)
  COUNT(*) as total_records,
  
  -- Performance metrics
  AVG(processing_time) as avg_processing_time,
  COUNT(*) FILTER (WHERE data_hash IS NOT NULL) as records_with_hash,
  
  -- Finance metrics
  AVG(credit_score) as avg_credit_score,
  AVG(transaction_volume) as avg_transaction_volume,
  AVG(risk_weight) as avg_risk_weight,
  
  -- Suite breakdown as JSONB
  (
    SELECT jsonb_object_agg(suite, suite_count)
    FROM (
      SELECT 
        suite,
        COUNT(*) as suite_count
      FROM finance_data
      GROUP BY suite
    ) suite_data
  ) as suite_breakdown,
  
  -- Source breakdown as JSONB (no date filtering)
  (
    SELECT jsonb_object_agg(source, source_count)
    FROM (
      SELECT 
        source,
        COUNT(*) as source_count
      FROM finance_data
      GROUP BY source
      ORDER BY source_count DESC
      LIMIT 10
    ) source_data
  ) as source_breakdown,
  
  -- Location breakdown as JSONB (no date filtering)
  (
    SELECT jsonb_object_agg(location, location_count)
    FROM (
      SELECT 
        location,
        COUNT(*) as location_count
      FROM finance_data
      WHERE location IS NOT NULL
      GROUP BY location
      ORDER BY location_count DESC
      LIMIT 10
    ) location_data
  ) as location_breakdown,
  
  -- Unique identifier and timestamp
  1 as stats_id,
  CURRENT_TIMESTAMP as last_refreshed
  
FROM finance_data;

-- Create unique index for concurrent refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_data_stats_refresh 
  ON finance_data_stats (stats_id);

-- Function to refresh finance data statistics
CREATE OR REPLACE FUNCTION refresh_finance_data_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY finance_data_stats;
  EXCEPTION
    WHEN OTHERS THEN
      REFRESH MATERIALIZED VIEW finance_data_stats;
  END;
END;
$$;

-- Function to get current finance statistics WITH dynamic date filtering
CREATE OR REPLACE FUNCTION get_finance_data_stats()
RETURNS TABLE (
  total_records bigint,
  records_today bigint,
  records_week bigint,
  records_month bigint,
  avg_processing_time double precision,
  records_with_hash bigint,
  avg_credit_score real,
  avg_transaction_volume real,
  avg_risk_weight real,
  suite_breakdown jsonb,
  source_breakdown jsonb,
  location_breakdown jsonb,
  last_refreshed timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_count bigint;
  week_count bigint;
  month_count bigint;
BEGIN
  -- Get today's count directly from the table
  SELECT COUNT(*) INTO today_count
  FROM finance_data
  WHERE timestamp >= CURRENT_DATE;
  
  -- Get this week's count directly from the table
  SELECT COUNT(*) INTO week_count
  FROM finance_data
  WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days';
  
  -- Get this month's count directly from the table
  SELECT COUNT(*) INTO month_count
  FROM finance_data
  WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Return all stats including the dynamic date-based counts
  RETURN QUERY
  SELECT 
    s.total_records,
    today_count,
    week_count,
    month_count,
    s.avg_processing_time,
    s.records_with_hash,
    s.avg_credit_score,
    s.avg_transaction_volume,
    s.avg_risk_weight,
    s.suite_breakdown,
    s.source_breakdown,
    s.location_breakdown,
    s.last_refreshed
  FROM finance_data_stats s;
END;
$$;

-- Efficient batch insert function for finance data
CREATE OR REPLACE FUNCTION batch_insert_finance_data(data_batch jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count integer := 0;
  record_data jsonb;
  result jsonb;
BEGIN
  -- Process each record in the batch
  FOR record_data IN SELECT * FROM jsonb_array_elements(data_batch)
  LOOP
    BEGIN
      INSERT INTO finance_data (
        source, data, timestamp, location, credit_score, transaction_volume, 
        risk_weight, suite, summary, anomaly_score, arima_forecast, 
        node_embedding, synthetic_profile, models_used, processing_time, 
        data_hash, addons, zk_proof
      )
      VALUES (
        record_data->>'source',
        record_data->'data',
        (record_data->>'timestamp')::timestamp with time zone,
        record_data->>'location',
        (record_data->>'credit_score')::real,
        (record_data->>'transaction_volume')::real,
        (record_data->>'risk_weight')::real,
        record_data->>'suite',
        record_data->>'summary',
        (record_data->>'anomaly_score')::real,
        (record_data->>'arima_forecast')::real,
        (record_data->>'node_embedding')::real[],
        record_data->'synthetic_profile',
        (record_data->>'models_used')::text[],
        (record_data->>'processing_time')::real,
        record_data->>'data_hash',
        record_data->'addons',
        record_data->>'zk_proof'
      );
      
      inserted_count := inserted_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        -- Skip failed records but continue processing
        CONTINUE;
    END;
  END LOOP;
  
  -- Return result as JSON
  result := jsonb_build_object(
    'success', true,
    'inserted', inserted_count,
    'total', jsonb_array_length(data_batch),
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;

-- Create partial indexes for recent data (reduces I/O for common queries)
CREATE INDEX IF NOT EXISTS idx_finance_data_recent_timestamp 
  ON finance_data (timestamp DESC) 
  WHERE timestamp >= '2025-01-01'::timestamp;

CREATE INDEX IF NOT EXISTS idx_finance_data_recent_suite_timestamp 
  ON finance_data (suite, timestamp DESC) 
  WHERE timestamp >= '2025-01-01'::timestamp;

CREATE INDEX IF NOT EXISTS idx_finance_data_recent_location_timestamp 
  ON finance_data (location, timestamp DESC) 
  WHERE timestamp >= '2025-01-01'::timestamp AND location IS NOT NULL;

-- Optimize table for high-volume operations
ALTER TABLE finance_data SET (
  fillfactor = 90,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- Initial refresh of the materialized view
SELECT refresh_finance_data_stats();