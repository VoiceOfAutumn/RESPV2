-- Migration: Allow tournament date to be nullable (T.B.D.)
ALTER TABLE tournaments ALTER COLUMN date DROP NOT NULL;
