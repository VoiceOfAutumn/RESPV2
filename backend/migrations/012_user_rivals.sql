-- User rivals table: users can designate up to 3 rivals (Veteran tier+)
CREATE TABLE user_rivals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rival_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, rival_id),
    CHECK(user_id != rival_id)
);

CREATE INDEX idx_user_rivals_user ON user_rivals(user_id);
