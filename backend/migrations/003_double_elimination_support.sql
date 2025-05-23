-- Migration to add double elimination tournament support
-- For use with pgAdmin or psql

-- Step 1: Add new columns to tournament_matches table
DO $$ 
BEGIN 
    -- Only add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'bracket_type') THEN
        ALTER TABLE tournament_matches ADD COLUMN bracket_type VARCHAR(20) DEFAULT 'winners';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'losers_match_id') THEN
        ALTER TABLE tournament_matches ADD COLUMN losers_match_id INTEGER REFERENCES tournament_matches(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'is_grand_finals') THEN
        ALTER TABLE tournament_matches ADD COLUMN is_grand_finals BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Step 2: Create new indices to improve query performance
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tournament_matches_bracket_type') THEN
        CREATE INDEX idx_tournament_matches_bracket_type ON tournament_matches(bracket_type);
    END IF;
END $$;

-- Step 3: Add column comments for better documentation
DO $$ 
BEGIN 
    -- Add comments to new columns
    COMMENT ON COLUMN tournament_matches.bracket_type IS 'Indicates which bracket this match belongs to: winners, losers, or finals';
    COMMENT ON COLUMN tournament_matches.losers_match_id IS 'In double elimination, references the match where the loser goes';
    COMMENT ON COLUMN tournament_matches.is_grand_finals IS 'Flag to mark the grand finals match in double elimination';
    
    -- This ensures we don't get an error if the comment already exists
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Step 4: Update existing data (if needed) to set correct bracket types
UPDATE tournament_matches 
SET bracket_type = 'winners' 
WHERE bracket_type IS NULL;

-- Step 5: Optional - Fix any tournaments with incorrect bracket structure
-- This would need to be customized based on your specific data issues

-- Final check to verify everything was applied correctly
SELECT 
    column_name, 
    data_type
FROM 
    information_schema.columns 
WHERE 
    table_name = 'tournament_matches' AND 
    column_name IN ('bracket_type', 'losers_match_id', 'is_grand_finals');
