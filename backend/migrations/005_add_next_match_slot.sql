-- Migration: Add next_match_slot column to tournament_matches
-- This column stores which slot (1 = player1, 2 = player2) the winner
-- of this match should fill in the next match. This is determined at
-- bracket generation time and never changes, enabling correct result
-- changes without "first available slot" bugs.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tournament_matches' AND column_name = 'next_match_slot'
    ) THEN
        ALTER TABLE tournament_matches ADD COLUMN next_match_slot INTEGER;
    END IF;
END $$;

COMMENT ON COLUMN tournament_matches.next_match_slot
IS 'Which slot the winner fills in the next match: 1 = player1_id, 2 = player2_id. Set at bracket generation time.';
