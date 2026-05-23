/*
  # Create Finance Data Statistics Functions

  1. New Functions
    - `finance_data_stats` materialized view for performance
    - `refresh_finance_data_stats()` function to refresh the view
    - `get_finance_data_stats()` function to get statistics with date filtering
    
  2. Purpose
    - Resolves frontend error: "Could not find the function public.get_finance_data_stats"
    - Provides optimized statistics for finance data dashboard
    - Maintains compatibility with existing finance data structure
*/

-- Create materialized view for finance data statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS finance_data_stats AS
SELECT
  COUNT(*) as total_records,
  AVG(processing_time) as avg_processing_time,
  COUNT(*) FILTER (WHERE data_hash IS NOT NULL) as records_with_hash,
  AVG(credit_score) as avg_credit_score,
  AVG(transaction_volume) as avg_transaction_volume,
  AVG(risk_weight) as avg_risk_weight,
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
  (
    SELECT jsonb_object_agg(location, location_count)
    FROM (
      SELECT
        location,
        COUNT(*) as location_count
      FROM finance_data
      GROUP BY location
      ORDER BY location_count DESC
      LIMIT 10
    ) location_data
  ) as location_breakdown,
  1 as stats_id,
  CURRENT_TIMESTAMP as last_refreshed
FROM finance_data;

-- Create unique index for concurrent refreshes on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_data_stats_refresh
  ON finance_data_stats (stats_id);

-- Function to refresh finance data statistics materialized view
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

-- Function to get finance data statistics with dynamic date filtering
CREATE OR REPLACE FUNCTION get_finance_data_stats()
RETURNS TABLE (
  total_records bigint,
  records_today bigint,
  records_week bigint,
  records_month bigint,
  avg_processing_time double precision,
  records_with_hash bigint,
  avg_credit_score double precision,
  avg_transaction_volume double precision,
  avg_risk_weight double precision,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION refresh_finance_data_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_finance_data_stats() TO anon, authenticated;
GRANT SELECT ON finance_data_stats TO anon, authenticated;

-- Initial refresh of materialized view
SELECT refresh_finance_data_stats();