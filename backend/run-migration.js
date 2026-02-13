const pool = require('./db');

async function runMigration() {
  try {
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'tournament_matches' AND column_name = 'next_match_slot'
        ) THEN
          ALTER TABLE tournament_matches ADD COLUMN next_match_slot INTEGER;
        END IF;
      END $$;
    `);
    console.log('Migration successful: next_match_slot column added');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
