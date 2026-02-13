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

// POST /tournaments  (create a new tournament — staff/admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Check user role
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    const role = userResult.rows[0].role;
    if (role !== 'staff' && role !== 'admin') {
      return res.status(403).json({ message: 'Only staff or admin can create tournaments' });
    }

    const { name, description, date, rules, image } = req.body;

    if (!name || !date) {
      return res.status(400).json({ message: 'Name and date are required' });
    }

    const result = await pool.query(
      `INSERT INTO tournaments (name, description, date, rules, image, status)
       VALUES ($1, $2, $3, $4, $5, 'registration_open')
       RETURNING *`,
      [name, description || null, date, rules || null, image || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating tournament:', err);
    res.status(500).json({ message: 'Error creating tournament' });
  }
});

// GET /tournaments/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch the tournament
    const result = await pool.query('SELECT * FROM tournaments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    const tournament = result.rows[0];

    // Fetch participants (join with users to get display_name & profile_picture)
    const participantsResult = await pool.query(
      `SELECT u.id, u.display_name, u.profile_picture
       FROM tournament_participants tp
       JOIN users u ON u.id = tp.user_id
       WHERE tp.tournament_id = $1
       ORDER BY tp.id`,
      [id]
    );

    // Determine if the requesting user is signed up (optional auth)
    let isSignedUp = false;
    let userId = null;

    if (req.session && req.session.userId) {
      userId = req.session.userId;
    } else if (req.headers.authorization) {
      const authToken = req.headers.authorization.replace('Bearer ', '');
      const tokenParts = authToken.split('.');
      if (tokenParts.length === 3) {
        const tokenUserId = parseInt(tokenParts[0]);
        const timestamp = parseInt(tokenParts[1]);
        if (!isNaN(tokenUserId) && !isNaN(timestamp) && (Date.now() - timestamp) < 24 * 60 * 60 * 1000) {
          userId = tokenUserId;
        }
      }
    }

    if (userId) {
      isSignedUp = participantsResult.rows.some(p => p.id === userId);
    }

    res.json({
      ...tournament,
      participants: participantsResult.rows,
      participant_count: participantsResult.rows.length,
      is_signed_up: isSignedUp,
    });
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

// DELETE /tournaments/:id/signup  (cancel signup)
router.delete('/:id/signup', authMiddleware, async (req, res) => {
  const tournamentId = parseInt(req.params.id);
  const userId = req.session.userId;

  try {
    const result = await pool.query(
      'DELETE FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2',
      [tournamentId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'You are not signed up for this tournament' });
    }

    res.json({ message: 'Signup cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling signup:', err);
    res.status(500).json({ message: 'Error cancelling signup' });
  }
});

// PUT /tournaments/:id/status  (update tournament status — staff/admin only)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    const role = userResult.rows[0].role;
    if (role !== 'staff' && role !== 'admin') {
      return res.status(403).json({ message: 'Only staff or admin can update tournament status' });
    }

    const { status } = req.body;
    const validStatuses = ['registration_open', 'registration_closed', 'check_in', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await pool.query('UPDATE tournaments SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'Tournament status updated' });
  } catch (err) {
    console.error('Error updating tournament status:', err);
    res.status(500).json({ message: 'Error updating tournament status' });
  }
});

// POST /tournaments/:id/bracket/generate  (generate bracket — staff/admin only)
router.post('/:id/bracket/generate', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    const role = userResult.rows[0].role;
    if (role !== 'staff' && role !== 'admin') {
      return res.status(403).json({ message: 'Only staff or admin can generate brackets' });
    }

    const tournamentId = parseInt(req.params.id);

    // Fetch tournament
    const tournResult = await pool.query('SELECT * FROM tournaments WHERE id = $1', [tournamentId]);
    if (tournResult.rows.length === 0) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Fetch participants
    const participantsResult = await pool.query(
      `SELECT u.id, u.display_name, u.profile_picture
       FROM tournament_participants tp
       JOIN users u ON u.id = tp.user_id
       WHERE tp.tournament_id = $1
       ORDER BY RANDOM()`,
      [tournamentId]
    );
    const participants = participantsResult.rows;

    if (participants.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 participants to generate a bracket' });
    }

    // Clear existing matches
    await pool.query('DELETE FROM tournament_matches WHERE tournament_id = $1', [tournamentId]);

    // Single elimination bracket generation
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(participants.length)));
    const numberOfByes = bracketSize - participants.length;
    const totalRounds = Math.ceil(Math.log2(bracketSize));

    const byeRecipients = participants.slice(0, numberOfByes);
    const round1Players = participants.slice(numberOfByes);
    const round1MatchCount = Math.floor(round1Players.length / 2);

    let matchNumber = 0;

    // Round 1 matches
    for (let i = 0; i < round1MatchCount; i++) {
      const p1 = round1Players[i * 2];
      const p2 = round1Players[i * 2 + 1] || null;

      matchNumber++;
      await pool.query(
        `INSERT INTO tournament_matches (tournament_id, round, match_number, player1_id, player1_name, player2_id, player2_name, player1_picture, player2_picture, bye_match, bracket)
         VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9, 'winners')`,
        [
          tournamentId,
          matchNumber,
          p1.id, p1.display_name,
          p2?.id || null, p2?.display_name || null,
          p1.profile_picture || null, p2?.profile_picture || null,
          !p2,
        ]
      );
    }

    // Round 2 slots
    const round2Size = bracketSize / 2;
    const round2Slots = new Array(round2Size).fill(null);

    // Place BYE recipients
    if (numberOfByes > 0) {
      const spacing = round2Size / numberOfByes;
      for (let i = 0; i < numberOfByes; i++) {
        const pos = Math.floor(i * spacing);
        round2Slots[pos] = byeRecipients[i];
      }
    }

    // Round 2+ matches (empty TBD slots, filled with BYE recipients where applicable)
    for (let r = 2; r <= totalRounds; r++) {
      const matchesInRound = bracketSize / Math.pow(2, r);

      for (let i = 0; i < matchesInRound; i++) {
        matchNumber++;

        let p1Id = null, p1Name = null, p1Pic = null;
        let p2Id = null, p2Name = null, p2Pic = null;

        // For Round 2, populate with BYE recipients
        if (r === 2) {
          const slot1 = round2Slots[i * 2];
          const slot2 = round2Slots[i * 2 + 1];
          if (slot1) { p1Id = slot1.id; p1Name = slot1.display_name; p1Pic = slot1.profile_picture; }
          if (slot2) { p2Id = slot2.id; p2Name = slot2.display_name; p2Pic = slot2.profile_picture; }
        }

        await pool.query(
          `INSERT INTO tournament_matches (tournament_id, round, match_number, player1_id, player1_name, player2_id, player2_name, player1_picture, player2_picture, bye_match, bracket)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, 'winners')`,
          [tournamentId, r, i + 1, p1Id, p1Name, p2Id, p2Name, p1Pic, p2Pic]
        );
      }
    }

    // Set tournament to in_progress
    await pool.query('UPDATE tournaments SET status = $1 WHERE id = $2', ['in_progress', tournamentId]);

    res.json({ message: 'Bracket generated successfully' });
  } catch (err) {
    console.error('Error generating bracket:', err);
    res.status(500).json({ message: 'Error generating bracket' });
  }
});

module.exports = router;
