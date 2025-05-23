-- Migration to fix tournament matches unique constraint
-- For use with pgAdmin or psql

-- Step 1: Drop the existing unique constraint
DO $$ 
BEGIN 
    ALTER TABLE tournament_matches 
    DROP CONSTRAINT IF EXISTS tournament_matches_tournament_id_round_match_number_key;
END $$;

-- Step 2: Add new unique constraint that includes bracket_type
ALTER TABLE tournament_matches
ADD CONSTRAINT tournament_matches_unique_match 
UNIQUE (tournament_id, round, match_number, bracket_type);

-- Step 3: Add new index to support the constraint
CREATE INDEX idx_tournament_matches_round_number 
ON tournament_matches(tournament_id, round, match_number, bracket_type);

-- Step 4: Add comment explaining the constraint
COMMENT ON CONSTRAINT tournament_matches_unique_match 
ON tournament_matches 
IS 'Ensures unique match numbers within each bracket type and round of a tournament';
