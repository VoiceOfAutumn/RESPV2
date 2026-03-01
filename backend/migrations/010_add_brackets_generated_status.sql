-- Add brackets_generated to tournament_status enum
-- This status sits between registration_closed and in_progress.
-- Staff must explicitly start a tournament after brackets are generated.
ALTER TYPE tournament_status ADD VALUE IF NOT EXISTS 'brackets_generated' BEFORE 'in_progress';
