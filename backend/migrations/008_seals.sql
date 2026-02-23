-- Migration: Seal system
-- Seals are special circular badge-like awards given to users for accomplishments.

-- ============================================================
-- Seals table – stores all seal definitions
-- ============================================================
CREATE TABLE IF NOT EXISTS seals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- User seals – junction table linking users to awarded seals
-- ============================================================
CREATE TABLE IF NOT EXISTS user_seals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seal_id INTEGER NOT NULL REFERENCES seals(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, seal_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_seals_user_id ON user_seals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_seals_seal_id ON user_seals(seal_id);
