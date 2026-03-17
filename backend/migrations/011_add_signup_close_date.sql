-- Migration: Add signup close date column to tournaments
ALTER TABLE tournaments ADD COLUMN signup_close_date TIMESTAMPTZ;
