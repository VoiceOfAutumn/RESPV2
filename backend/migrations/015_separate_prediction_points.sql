-- Separate prediction points from tournament EXP
-- points = EXP earned from tournament participation (unchanged)
-- prediction_points = spendable currency earned from predictions only
-- lifetime_prediction_points = total prediction points ever earned (never decreases)

-- Rename lifetime_points → lifetime_prediction_points
ALTER TABLE users RENAME COLUMN lifetime_points TO lifetime_prediction_points;

-- Add spendable prediction_points column
ALTER TABLE users ADD COLUMN IF NOT EXISTS prediction_points INTEGER DEFAULT 0;
