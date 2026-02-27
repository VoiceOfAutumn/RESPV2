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

// POST /tournaments  (create a new tournament — admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Check user role
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    const role = userResult.rows[0].role;
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create tournaments' });
    }

    const { name, description, date, image, game_data } = req.body;

    if (!name || !date) {
      return res.status(400).json({ message: 'Name and date are required' });
    }

    const result = await pool.query(
      `INSERT INTO tournaments (name, description, date, image, status, game_data)
       VALUES ($1, $2, $3, $4, 'registration_open', $5)
       RETURNING *`,
      [name, description || null, date, image || null, game_data ? JSON.stringify(game_data) : null]
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

    // Fetch participants (join with users to get display_name, profile_picture, points & global rank)
    const participantsResult = await pool.query(
      `SELECT u.id, u.display_name, u.profile_picture, u.points,
              (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.points > u.points) AS site_rank
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
    // Fetch tournament info
    const tournResult = await pool.query('SELECT id, name, format, status, image FROM tournaments WHERE id = $1', [id]);
    if (tournResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const matchResult = await pool.query(`
      SELECT 
        m.id, m.tournament_id, m.round, m.match_number,
        m.player1_id, m.player2_id, m.winner_id,
        m.player1_score, m.player2_score,
        m.bye_match, m.next_match_id, m.next_match_slot,
        m.bracket_type AS bracket, m.losers_match_id, m.is_grand_finals,
        m.vod_url,
        m.created_at, m.updated_at,
        u1.display_name AS player1_name, u1.profile_picture AS player1_picture,
        u2.display_name AS player2_name, u2.profile_picture AS player2_picture,
        uw.display_name AS winner_name
      FROM tournament_matches m
      LEFT JOIN users u1 ON u1.id = m.player1_id
      LEFT JOIN users u2 ON u2.id = m.player2_id
      LEFT JOIN users uw ON uw.id = m.winner_id
      WHERE m.tournament_id = $1
      ORDER BY m.round, m.match_number
    `, [id]);
    
    res.json({
      tournament: tournResult.rows[0],
      matches: matchResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /tournaments/:id/matches/:matchId
router.put('/:id/matches/:matchId', authMiddleware, async (req, res) => {
  const { id, matchId } = req.params;
  // Support both camelCase and snake_case from frontend
  const p1Score = req.body.player1_score ?? req.body.player1Score;
  const p2Score = req.body.player2_score ?? req.body.player2Score;
  const winId = req.body.winner_id ?? req.body.winnerId;

  try {
    // Get the current match to find next_match_id
    const matchResult = await pool.query(
      'SELECT * FROM tournament_matches WHERE tournament_id = $1 AND id = $2',
      [id, matchId]
    );
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    const currentMatch = matchResult.rows[0];

    // Update the current match scores + winner
    await pool.query(`
      UPDATE tournament_matches 
      SET player1_score = $1, player2_score = $2, winner_id = $3
      WHERE tournament_id = $4 AND id = $5
    `, [p1Score, p2Score, winId, id, matchId]);

    // Advance winner to the next match if next_match_id is set
    if (currentMatch.next_match_id && winId) {
      const slot = currentMatch.next_match_slot || 1;
      if (slot === 1) {
        await pool.query(`
          UPDATE tournament_matches
          SET player1_id = $1
          WHERE id = $2 AND tournament_id = $3
        `, [winId, currentMatch.next_match_id, id]);
      } else {
        await pool.query(`
          UPDATE tournament_matches
          SET player2_id = $1
          WHERE id = $2 AND tournament_id = $3
        `, [winId, currentMatch.next_match_id, id]);
      }
    }

    res.json({ message: 'Match updated successfully' });
  } catch (err) {
    console.error('Error updating match:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /tournaments/:id/matches/:matchId/vod  (set VOD link — staff/admin only)
router.put('/:id/matches/:matchId/vod', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
    if (userResult.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    const role = userResult.rows[0].role;
    if (role !== 'staff' && role !== 'admin') {
      return res.status(403).json({ error: 'Only staff or admin can set VOD links' });
    }

    const { id, matchId } = req.params;
    const vodUrl = req.body.vod_url ?? req.body.vodUrl ?? null;

    // Basic validation: must be empty/null or a valid URL
    if (vodUrl && !vodUrl.match(/^https?:\/\//)) {
      return res.status(400).json({ error: 'VOD URL must be a valid HTTP/HTTPS link' });
    }

    await pool.query(
      'UPDATE tournament_matches SET vod_url = $1 WHERE id = $2 AND tournament_id = $3',
      [vodUrl || null, matchId, id]
    );

    res.json({ message: 'VOD link updated' });
  } catch (err) {
    console.error('Error setting VOD:', err);
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

// PUT /tournaments/:id/status  (update tournament status — admin only)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    const role = userResult.rows[0].role;
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update tournament status' });
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

// POST /tournaments/:id/bracket/generate  (generate bracket — admin only)
router.post('/:id/bracket/generate', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    const role = userResult.rows[0].role;
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can generate brackets' });
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

    // Clear existing matches (drop foreign key constraint temporarily to avoid issues)
    await pool.query('UPDATE tournament_matches SET next_match_id = NULL WHERE tournament_id = $1', [tournamentId]);
    await pool.query('DELETE FROM tournament_matches WHERE tournament_id = $1', [tournamentId]);

    // Single elimination bracket generation
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(participants.length)));
    const numberOfByes = bracketSize - participants.length;
    const totalRounds = Math.ceil(Math.log2(bracketSize));

    const byeRecipients = participants.slice(0, numberOfByes);
    const round1Players = participants.slice(numberOfByes);
    const round1MatchCount = Math.floor(round1Players.length / 2);

    // Store created match IDs grouped by round for linking
    // matchIdsByRound[round] = [matchId1, matchId2, ...]
    const matchIdsByRound = {};

    // ---- Round 1 matches ----
    matchIdsByRound[1] = [];
    for (let i = 0; i < round1MatchCount; i++) {
      const p1 = round1Players[i * 2];
      const p2 = round1Players[i * 2 + 1] || null;

      const insertResult = await pool.query(
        `INSERT INTO tournament_matches (tournament_id, round, match_number, player1_id, player2_id, bye_match, bracket_type)
         VALUES ($1, 1, $2, $3, $4, $5, 'winners')
         RETURNING id`,
        [
          tournamentId,
          i + 1,
          p1.id,
          p2?.id || null,
          !p2,
        ]
      );
      matchIdsByRound[1].push(insertResult.rows[0].id);
    }

    // ---- Round 2 slots (BYE recipients + empty) ----
    const round2Size = bracketSize / 2;
    const round2Slots = new Array(round2Size).fill(null);

    if (numberOfByes > 0) {
      const spacing = round2Size / numberOfByes;
      for (let i = 0; i < numberOfByes; i++) {
        const pos = Math.floor(i * spacing);
        round2Slots[pos] = byeRecipients[i];
      }
    }

    // ---- Round 2+ matches ----
    for (let r = 2; r <= totalRounds; r++) {
      matchIdsByRound[r] = [];
      const matchesInRound = bracketSize / Math.pow(2, r);

      for (let i = 0; i < matchesInRound; i++) {
        let p1Id = null;
        let p2Id = null;

        // For Round 2, populate with BYE recipients
        if (r === 2) {
          const slot1 = round2Slots[i * 2];
          const slot2 = round2Slots[i * 2 + 1];
          if (slot1) { p1Id = slot1.id; }
          if (slot2) { p2Id = slot2.id; }
        }

        const insertResult = await pool.query(
          `INSERT INTO tournament_matches (tournament_id, round, match_number, player1_id, player2_id, bye_match, bracket_type)
           VALUES ($1, $2, $3, $4, $5, false, 'winners')
           RETURNING id`,
          [tournamentId, r, i + 1, p1Id, p2Id]
        );
        matchIdsByRound[r].push(insertResult.rows[0].id);
      }
    }

    // ---- Link matches: set next_match_id and next_match_slot ----
    // Round 1 matches feed into Round 2 matches.
    // We need to figure out which Round 2 match each Round 1 match feeds into.
    // Round 1 has fewer matches than round2Size/2 due to BYEs, so we need to
    // map Round 1 matches to the correct Round 2 slots they occupy.

    // Build a mapping: for each Round 2 match, which slots are fed by Round 1 vs BYEs
    // Round 2 match i gets slots [i*2] and [i*2+1] from round2Slots
    // Slots that are null and have a corresponding Round 1 match get linked

    let r1MatchIdx = 0;
    for (let r2Idx = 0; r2Idx < matchIdsByRound[2].length; r2Idx++) {
      const r2MatchId = matchIdsByRound[2][r2Idx];
      // Check slot i*2 and i*2+1
      for (let slotOffset = 0; slotOffset < 2; slotOffset++) {
        const slotPos = r2Idx * 2 + slotOffset;
        if (!round2Slots[slotPos] && r1MatchIdx < matchIdsByRound[1].length) {
          // This slot is filled by a Round 1 match winner
          const r1MatchId = matchIdsByRound[1][r1MatchIdx];
          const nextMatchSlot = slotOffset + 1; // 1 = player1, 2 = player2
          await pool.query(
            'UPDATE tournament_matches SET next_match_id = $1, next_match_slot = $2 WHERE id = $3',
            [r2MatchId, nextMatchSlot, r1MatchId]
          );
          r1MatchIdx++;
        }
      }
    }

    // Link Round 2+ to subsequent rounds (straightforward: match i feeds into match floor(i/2))
    for (let r = 2; r < totalRounds; r++) {
      const currentRoundIds = matchIdsByRound[r];
      const nextRoundIds = matchIdsByRound[r + 1];
      for (let i = 0; i < currentRoundIds.length; i++) {
        const nextMatchId = nextRoundIds[Math.floor(i / 2)];
        const nextMatchSlot = (i % 2) + 1; // odd index → slot 2, even → slot 1
        await pool.query(
          'UPDATE tournament_matches SET next_match_id = $1, next_match_slot = $2 WHERE id = $3',
          [nextMatchId, nextMatchSlot, currentRoundIds[i]]
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
