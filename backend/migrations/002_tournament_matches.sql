-- Tournament matches table for bracket management
CREATE TABLE tournament_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    player1_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    player2_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    player1_score INTEGER,
    player2_score INTEGER,
    bye_match BOOLEAN DEFAULT false,
    next_match_id INTEGER REFERENCES tournament_matches(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, round, match_number)
);

-- Trigger to update updated_at
CREATE TRIGGER update_tournament_matches_updated_at
    BEFORE UPDATE ON tournament_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_players ON tournament_matches(player1_id, player2_id);
