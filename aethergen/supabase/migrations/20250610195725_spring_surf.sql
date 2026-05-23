/*
  # Database Optimization for High-Volume Data Processing

  1. New Indexes
    - Composite indexes for common query patterns
    - Partial indexes for sentiment filtering
    - JSONB indexes for data column optimization
    
  2. Data Validation
    - Timestamp constraints (2020-2030 range)
    - Sentiment score validation (0-1 range)
    - Sentiment type validation (positive/negative/neutral)
    - Non-empty string validation for location, event, source
    
  3. Performance Optimization
    - Table storage parameters for high-volume operations
    - Materialized view for dashboard statistics
    - Functions for data access and maintenance
    
  4. Security
    - RLS policies maintained
    - Appropriate permissions for anon/authenticated users
*/

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_outlier_records(integer);
DROP FUNCTION IF EXISTS get_location_breakdown(integer);
DROP FUNCTION IF EXISTS get_changes_data_stats();
DROP FUNCTION IF EXISTS refresh_changes_data_stats();

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_changes_data_timestamp_location 
  ON public.changes_data (timestamp DESC, location);

CREATE INDEX IF NOT EXISTS idx_changes_data_source_timestamp 
  ON public.changes_data (source, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_changes_data_sentiment_timestamp 
  ON public.changes_data (sentiment_type, timestamp DESC);

-- Partial indexes for sentiment filtering
CREATE INDEX IF NOT EXISTS idx_changes_data_positive_sentiment 
  ON public.changes_data (timestamp DESC, location) 
  WHERE sentiment_type = 'positive';

CREATE INDEX IF NOT EXISTS idx_changes_data_negative_sentiment 
  ON public.changes_data (timestamp DESC, location) 
  WHERE sentiment_type = 'negative';

CREATE INDEX IF NOT EXISTS idx_changes_data_neutral_sentiment 
  ON public.changes_data (timestamp DESC, location) 
  WHERE sentiment_type = 'neutral';

-- Simple indexes for performance
CREATE INDEX IF NOT EXISTS idx_changes_data_sentiment_score 
  ON public.changes_data (sentiment, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_changes_data_recent_timestamp 
  ON public.changes_data (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_changes_data_location 
  ON public.changes_data (location);

CREATE INDEX IF NOT EXISTS idx_changes_data_event 
  ON public.changes_data (event);

CREATE INDEX IF NOT EXISTS idx_changes_data_source 
  ON public.changes_data (source);

-- JSONB indexes for data column optimization
CREATE INDEX IF NOT EXISTS idx_changes_data_jsonb_narrative 
  ON public.changes_data USING GIN ((data -> 'narrative'));

CREATE INDEX IF NOT EXISTS idx_changes_data_jsonb_simulation 
  ON public.changes_data USING GIN ((data -> 'simulation'));

-- Add constraints for data validation
DO $$
BEGIN
  -- Add timestamp constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'changes_data_timestamp_reasonable' 
    AND table_name = 'changes_data'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.changes_data 
      ADD CONSTRAINT changes_data_timestamp_reasonable 
      CHECK (timestamp >= '2020-01-01'::timestamp without time zone AND timestamp <= '2030-12-31'::timestamp without time zone);
  END IF;

  -- Add sentiment validation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'changes_data_sentiment_check' 
    AND table_name = 'changes_data'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.changes_data 
      ADD CONSTRAINT changes_data_sentiment_check 
      CHECK (sentiment >= 0 AND sentiment <= 1);
  END IF;

  -- Add sentiment type validation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'changes_data_sentiment_type_check' 
    AND table_name = 'changes_data'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.changes_data 
      ADD CONSTRAINT changes_data_sentiment_type_check 
      CHECK (sentiment_type IN ('positive', 'negative', 'neutral'));
  END IF;

  -- Add location validation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'changes_data_location_not_empty' 
    AND table_name = 'changes_data'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.changes_data 
      ADD CONSTRAINT changes_data_location_not_empty 
      CHECK (location IS NULL OR length(trim(location)) > 0);
  END IF;

  -- Add event validation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'changes_data_event_not_empty' 
    AND table_name = 'changes_data'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.changes_data 
      ADD CONSTRAINT changes_data_event_not_empty 
      CHECK (event IS NULL OR length(trim(event)) > 0);
  END IF;

  -- Add source validation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'changes_data_source_not_empty' 
    AND table_name = 'changes_data'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.changes_data 
      ADD CONSTRAINT changes_data_source_not_empty 
      CHECK (source IS NOT NULL AND length(trim(source)) > 0);
  END IF;
END $$;

-- Optimize table for high-volume operations
ALTER TABLE public.changes_data SET (
  fillfactor = 90,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- Create materialized view for dashboard statistics
DROP MATERIALIZED VIEW IF EXISTS public.changes_data_stats;

CREATE MATERIALIZED VIEW public.changes_data_stats AS
SELECT 
  -- Basic counts
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE) as records_today,
  COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days') as records_week,
  COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days') as records_month,
  
  -- Sentiment breakdown
  COUNT(*) FILTER (WHERE sentiment_type = 'positive') as positive_count,
  COUNT(*) FILTER (WHERE sentiment_type = 'negative') as negative_count,
  COUNT(*) FILTER (WHERE sentiment_type = 'neutral') as neutral_count,
  
  -- Performance metrics
  COALESCE(AVG(sentiment), 0) as avg_sentiment,
  MIN(timestamp) as earliest_record,
  MAX(timestamp) as latest_record,
  
  -- Data quality metrics
  COUNT(*) FILTER (WHERE sentiment < 0.1 OR sentiment > 0.9) as outlier_count,
  COUNT(*) FILTER (WHERE location IS NULL) as missing_location_count,
  COUNT(*) FILTER (WHERE event IS NULL) as missing_event_count,
  
  -- Source breakdown as JSONB
  (
    SELECT COALESCE(jsonb_object_agg(source, source_count), '{}'::jsonb)
    FROM (
      SELECT 
        COALESCE(source, 'unknown') as source,
        COUNT(*) as source_count
      FROM public.changes_data 
      WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY source
    ) source_data
  ) as source_breakdown,
  
  -- Sentiment breakdown as JSONB
  jsonb_build_object(
    'positive', COUNT(*) FILTER (WHERE sentiment_type = 'positive'),
    'negative', COUNT(*) FILTER (WHERE sentiment_type = 'negative'),
    'neutral', COUNT(*) FILTER (WHERE sentiment_type = 'neutral')
  ) as sentiment_breakdown,
  
  -- Unique identifier and timestamp
  1 as stats_id,
  CURRENT_TIMESTAMP as last_refreshed
  
FROM public.changes_data;

-- Create unique index for concurrent refreshes
CREATE UNIQUE INDEX idx_changes_data_stats_refresh 
  ON public.changes_data_stats (stats_id);

-- Function to refresh statistics
CREATE OR REPLACE FUNCTION refresh_changes_data_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.changes_data_stats;
  EXCEPTION
    WHEN OTHERS THEN
      REFRESH MATERIALIZED VIEW public.changes_data_stats;
  END;
END;
$$;

-- Function to get current statistics
CREATE OR REPLACE FUNCTION get_changes_data_stats()
RETURNS TABLE (
  total_records bigint,
  records_today bigint,
  records_week bigint,
  records_month bigint,
  source_breakdown jsonb,
  sentiment_breakdown jsonb,
  avg_sentiment numeric,
  outlier_count bigint,
  missing_location_count bigint,
  missing_event_count bigint,
  last_refreshed timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.total_records,
    s.records_today,
    s.records_week,
    s.records_month,
    s.source_breakdown,
    s.sentiment_breakdown,
    s.avg_sentiment,
    s.outlier_count,
    s.missing_location_count,
    s.missing_event_count,
    s.last_refreshed
  FROM public.changes_data_stats s;
END;
$$;

-- Function to get location breakdown
CREATE OR REPLACE FUNCTION get_location_breakdown(days_back integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT COALESCE(jsonb_object_agg(location, location_count), '{}'::jsonb)
  INTO result
  FROM (
    SELECT 
      location,
      COUNT(*) as location_count
    FROM public.changes_data 
    WHERE location IS NOT NULL 
      AND timestamp >= CURRENT_DATE - (days_back || ' days')::interval
    GROUP BY location
    ORDER BY location_count DESC
    LIMIT 10
  ) top_locations;
  
  RETURN result;
END;
$$;

-- Function to get outlier records (with new signature to avoid conflicts)
CREATE OR REPLACE FUNCTION get_outlier_records(limit_count integer DEFAULT 100)
RETURNS TABLE (
  record_id uuid,
  record_timestamp timestamp with time zone,
  record_location text,
  record_event text,
  record_sentiment numeric,
  record_sentiment_type text,
  record_source text,
  issue_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.id as record_id,
    cd.timestamp as record_timestamp,
    cd.location as record_location,
    cd.event as record_event,
    cd.sentiment as record_sentiment,
    cd.sentiment_type as record_sentiment_type,
    cd.source as record_source,
    CASE 
      WHEN cd.sentiment < 0.1 OR cd.sentiment > 0.9 THEN 'extreme_sentiment'
      WHEN cd.location IS NULL THEN 'missing_location'
      WHEN cd.event IS NULL THEN 'missing_event'
      ELSE 'other'
    END as issue_type
  FROM public.changes_data cd
  WHERE cd.sentiment < 0.1 
     OR cd.sentiment > 0.9 
     OR cd.location IS NULL 
     OR cd.event IS NULL
  ORDER BY cd.timestamp DESC
  LIMIT limit_count;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.changes_data_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_changes_data_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_changes_data_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_location_breakdown(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_outlier_records(integer) TO anon, authenticated;

-- Update table comment
COMMENT ON TABLE public.changes_data IS 
'Optimized for high-volume data processing (20,000+ records/day). 
Features: composite indexes, partial indexes, JSONB optimization, and materialized views.
Use refresh_changes_data_stats() to update dashboard statistics.';

COMMENT ON MATERIALIZED VIEW public.changes_data_stats IS 
'Pre-computed statistics for dashboard performance with 20,000+ daily records.
Refresh using refresh_changes_data_stats() function.
Query using get_changes_data_stats() function.';

COMMENT ON FUNCTION refresh_changes_data_stats() IS 
'Refreshes the changes_data_stats materialized view with error handling.
Should be called periodically to update dashboard statistics.';

COMMENT ON FUNCTION get_changes_data_stats() IS 
'Returns current statistics from the materialized view.
Safe for anonymous and authenticated users.';

COMMENT ON FUNCTION get_location_breakdown(integer) IS 
'Returns top 10 locations by record count for the specified number of days.
Default is 30 days. Safe for anonymous and authenticated users.';

COMMENT ON FUNCTION get_outlier_records(integer) IS 
'Returns records flagged as outliers for manual review.
Includes extreme sentiment values and missing data. Limited to specified count.';