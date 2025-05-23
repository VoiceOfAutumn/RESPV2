const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// GET /tournaments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, date, status, image
      FROM tournaments
      ORDER BY date
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /tournaments/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT *
      FROM tournaments
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /tournaments/:id/signup
router.post('/:id/signup', authMiddleware, async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'You must be logged in to sign up.' });
  }
  
  const tournamentId = parseInt(req.params.id);
  const userId = req.session.userId;

  try {
    // Check if tournament exists
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [tournamentId]);
    if (tournament.rows.length === 0) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Check if user is already signed up
    const existingSignup = await pool.query(
      'SELECT * FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2',
      [tournamentId, userId]
    );
    if (existingSignup.rows.length > 0) {
      return res.status(400).json({ message: 'Already signed up' });
    }

    // Add user to tournament_participants table
    await pool.query(
      'INSERT INTO tournament_participants (tournament_id, user_id) VALUES ($1, $2)',
      [tournamentId, userId]
    );

    return res.status(200).json({ message: 'Signed up successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error signing up' });
  }
});

// GET /tournaments/:id/bracket
router.get('/:id/bracket', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT *
      FROM tournament_matches
      WHERE tournament_id = $1
      ORDER BY round, match_number
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /tournaments/:id/matches/:matchId
router.put('/:id/matches/:matchId', authMiddleware, async (req, res) => {
  const { id, matchId } = req.params;
  const { player1Score, player2Score, winnerId } = req.body;

  try {
    // Update match scores and winner
    await pool.query(`
      UPDATE tournament_matches 
      SET player1_score = $1, player2_score = $2, winner_id = $3
      WHERE tournament_id = $4 AND id = $5
    `, [player1Score, player2Score, winnerId, id, matchId]);

    res.json({ message: 'Match updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
