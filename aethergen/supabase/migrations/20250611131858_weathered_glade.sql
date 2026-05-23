/*
  # Add suite column for Government category support

  1. New Column
    - `suite` (text) - Categorizes data by Government suite (CHANGES, POISON, etc.)
  
  2. Constraints
    - Suite must be one of the 8 Government suites
    - Not null constraint with default value
  
  3. Indexes
    - Add index on suite for efficient filtering
    - Composite index on suite + timestamp for performance
*/

-- Add suite column to changes_data table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'changes_data' AND column_name = 'suite'
  ) THEN
    ALTER TABLE changes_data ADD COLUMN suite text DEFAULT 'CHANGES';
  END IF;
END $$;

-- Add constraint for valid suite values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'changes_data_suite_check'
  ) THEN
    ALTER TABLE changes_data ADD CONSTRAINT changes_data_suite_check 
    CHECK (suite = ANY (ARRAY['CHANGES', 'POISON', 'STRIVE', 'HYDRA', 'SIREN', 'REFORM', 'INSURE', 'SHIELD']));
  END IF;
END $$;

-- Make suite not null
ALTER TABLE changes_data ALTER COLUMN suite SET NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_changes_data_suite 
ON changes_data USING btree (suite);

CREATE INDEX IF NOT EXISTS idx_changes_data_suite_timestamp 
ON changes_data USING btree (suite, timestamp DESC);

-- Update existing records to have CHANGES suite
UPDATE changes_data SET suite = 'CHANGES' WHERE suite IS NULL;