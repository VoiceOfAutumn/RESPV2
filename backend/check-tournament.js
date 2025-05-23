require('dotenv').config();
const pool = require('./db');

async function checkTournament() {
  try {
    const result = await pool.query(`
      SELECT 
        t.id, t.status, t.format,
        (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count,
        t.created_at
      FROM tournaments t 
      WHERE t.id = 1
    `);
    console.log('Tournament data:', result.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkTournament();
