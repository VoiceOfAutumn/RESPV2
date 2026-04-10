-- Fix: migration 014 backfilled lifetime_points = tournament EXP (points),
-- then 015 renamed it to lifetime_prediction_points.
-- This means all users with tournament EXP had wrong lifetime_prediction_points.
-- Reset both columns and re-derive from actual scored predictions.

-- Step 1: Zero out both columns for ALL users
UPDATE users SET lifetime_prediction_points = 0, prediction_points = 0;

-- Step 2: Re-derive from tournament_predictions.points_awarded (set by the scoring endpoint)
UPDATE users u
SET lifetime_prediction_points = sub.total,
    prediction_points = sub.total
FROM (
  SELECT user_id, SUM(points_awarded) AS total
  FROM tournament_predictions
  WHERE points_awarded > 0
  GROUP BY user_id
) sub
WHERE u.id = sub.user_id;
