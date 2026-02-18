-- Add game_data column to tournaments table
-- Stores game information as JSONB
-- Format when game differs per round:
--   { "differsPerRound": true, "rounds": { "round_of_128": { "gameName": "...", "platform": "...", "challengeDescription": "..." }, ... } }
-- Format when same game for all rounds:
--   { "differsPerRound": false, "game": { "gameName": "...", "platform": "...", "challengeDescription": "..." } }

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS game_data JSONB;
