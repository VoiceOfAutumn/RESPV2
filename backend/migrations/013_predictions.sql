-- Prediction system tables

-- Stores one row per user per tournament: their overall prediction submission
CREATE TABLE tournament_predictions (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points_awarded INTEGER DEFAULT 0,
    champion_correct BOOLEAN DEFAULT false,
    UNIQUE(tournament_id, user_id)
);

-- Stores individual match predictions within a submission
CREATE TABLE tournament_prediction_picks (
    id SERIAL PRIMARY KEY,
    prediction_id INTEGER NOT NULL REFERENCES tournament_predictions(id) ON DELETE CASCADE,
    match_id INTEGER NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
    predicted_winner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    round INTEGER NOT NULL,
    is_correct BOOLEAN DEFAULT NULL, -- NULL until match is played, then true/false
    points_earned INTEGER DEFAULT 0,
    UNIQUE(prediction_id, match_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_predictions_tournament ON tournament_predictions(tournament_id);
CREATE INDEX idx_predictions_user ON tournament_predictions(user_id);
CREATE INDEX idx_prediction_picks_prediction ON tournament_prediction_picks(prediction_id);
CREATE INDEX idx_prediction_picks_match ON tournament_prediction_picks(match_id);
