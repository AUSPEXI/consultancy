/*
  # Customer Data Control System

  1. New Tables
    - `system_config` - Store RSS pause/resume states
    - `scheduled_tasks` - Auto-revert scheduling
    
  2. Functions
    - Check RSS pause status before collection
    - Auto-revert mechanism
*/

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Scheduled tasks table
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type text NOT NULL,
  suite text,
  scheduled_for timestamp with time zone NOT NULL,
  parameters jsonb DEFAULT '{}',
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Function to check if RSS is paused for a suite
CREATE OR REPLACE FUNCTION is_rss_paused(suite_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_value jsonb;
  paused boolean := false;
BEGIN
  SELECT value INTO config_value
  FROM system_config
  WHERE key = 'rss_paused_' || suite_name;
  
  IF config_value IS NOT NULL THEN
    paused := (config_value->>'paused')::boolean;
  END IF;
  
  RETURN paused;
END;
$$;

-- Function to resume RSS for a suite
CREATE OR REPLACE FUNCTION resume_rss_collection(suite_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM system_config
  WHERE key = 'rss_paused_' || suite_name;
  
  -- Mark related scheduled tasks as completed
  UPDATE scheduled_tasks
  SET completed = true
  WHERE task_type = 'revert_rss_collection'
    AND suite = suite_name
    AND completed = false;
END;
$$;

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to manage system config"
  ON system_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage scheduled tasks"
  ON scheduled_tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON system_config TO anon, authenticated;
GRANT ALL ON scheduled_tasks TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_rss_paused(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION resume_rss_collection(text) TO anon, authenticated;