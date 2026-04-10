-- Add lifetime_points column to users
-- points = spendable balance (can decrease when user spends)
-- lifetime_points = total ever earned (never decreases, used for leveling/leaderboard)
ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_points INTEGER DEFAULT 0;

-- Backfill: set lifetime_points = points for existing users
UPDATE users SET lifetime_points = points WHERE lifetime_points = 0 AND points > 0;
