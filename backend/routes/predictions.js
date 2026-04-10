const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// ── GET /predictions/:tournamentId ── Get current user's prediction for a tournament
router.get('/:tournamentId', authMiddleware, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.session.userId;

    const prediction = await pool.query(
      `SELECT tp.id, tp.submitted_at, tp.points_awarded, tp.champion_correct,
              json_agg(json_build_object(
                'match_id', tpp.match_id,
                'predicted_winner_id', tpp.predicted_winner_id,
                'round', tpp.round,
                'is_correct', tpp.is_correct,
                'points_earned', tpp.points_earned
              ) ORDER BY tpp.round, tpp.match_id) AS picks
       FROM tournament_predictions tp
       JOIN tournament_prediction_picks tpp ON tpp.prediction_id = tp.id
       WHERE tp.tournament_id = $1 AND tp.user_id = $2
       GROUP BY tp.id`,
      [tournamentId, userId]
    );

    if (prediction.rows.length === 0) {
      return res.json({ submitted: false, picks: [] });
    }

    const row = prediction.rows[0];
    res.json({
      submitted: true,
      submittedAt: row.submitted_at,
      pointsAwarded: row.points_awarded,
      championCorrect: row.champion_correct,
      picks: row.picks,
    });
  } catch (err) {
    console.error('Error fetching prediction:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /predictions/:tournamentId ── Submit predictions (one-time, locks them in)
router.post('/:tournamentId', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { tournamentId } = req.params;
    const userId = req.session.userId;
    const { picks } = req.body;
    // picks: [{ match_id: number, predicted_winner_id: number, round: number }]

    if (!picks || !Array.isArray(picks) || picks.length === 0) {
      return res.status(400).json({ error: 'Picks are required' });
    }

    await client.query('BEGIN');

    // Check if user already submitted predictions for this tournament
    const existing = await client.query(
      'SELECT id FROM tournament_predictions WHERE tournament_id = $1 AND user_id = $2',
      [tournamentId, userId]
    );

    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Predictions already submitted for this tournament' });
    }

    // Verify all matches exist and belong to this tournament
    const matchIds = picks.map(p => p.match_id);
    const matchCheck = await client.query(
      `SELECT id, round, match_number FROM tournament_matches
       WHERE tournament_id = $1 AND id = ANY($2::int[])`,
      [tournamentId, matchIds]
    );

    if (matchCheck.rows.length !== picks.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Some match IDs are invalid or do not belong to this tournament' });
    }

    // Verify ALL matches in the tournament have predictions
    const totalMatchCount = await client.query(
      'SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = $1 AND bye_match = false',
      [tournamentId]
    );

    if (parseInt(totalMatchCount.rows[0].count) !== picks.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Must predict a winner for every match',
        expected: parseInt(totalMatchCount.rows[0].count),
        received: picks.length,
      });
    }

    // Create the prediction record
    const predResult = await client.query(
      `INSERT INTO tournament_predictions (tournament_id, user_id)
       VALUES ($1, $2) RETURNING id`,
      [tournamentId, userId]
    );
    const predictionId = predResult.rows[0].id;

    // Insert each pick
    for (const pick of picks) {
      await client.query(
        `INSERT INTO tournament_prediction_picks (prediction_id, match_id, predicted_winner_id, round)
         VALUES ($1, $2, $3, $4)`,
        [predictionId, pick.match_id, pick.predicted_winner_id, pick.round]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Predictions submitted successfully',
      predictionId,
      submittedAt: new Date().toISOString(),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error submitting predictions:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ── POST /predictions/:tournamentId/score ── Score predictions after matches are played (admin only)
router.post('/:tournamentId/score', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { tournamentId } = req.params;
    const userId = req.session.userId;

    // Admin check
    const userResult = await client.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    await client.query('BEGIN');

    // Get all matches with results for this tournament
    const matchResults = await client.query(
      `SELECT id, round, winner_id FROM tournament_matches
       WHERE tournament_id = $1 AND winner_id IS NOT NULL`,
      [tournamentId]
    );

    if (matchResults.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No match results available yet' });
    }

    // Determine the max round (final) for champion bonus
    const maxRound = Math.max(...matchResults.rows.map(m => m.round));

    // Get the actual champion (winner of the final match)
    const finalMatch = matchResults.rows.find(m => m.round === maxRound);
    const actualChampionId = finalMatch ? finalMatch.winner_id : null;

    // Get all predictions for this tournament
    const predictions = await client.query(
      'SELECT id, user_id FROM tournament_predictions WHERE tournament_id = $1',
      [tournamentId]
    );

    let scoredCount = 0;

    for (const pred of predictions.rows) {
      let totalPoints = 0;
      let championCorrect = false;

      // Score each pick
      for (const match of matchResults.rows) {
        const roundPoints = Math.pow(2, match.round - 1); // R1=1, R2=2, R3=4, R4=8...

        const pickResult = await client.query(
          `UPDATE tournament_prediction_picks
           SET is_correct = (predicted_winner_id = $1),
               points_earned = CASE WHEN predicted_winner_id = $1 THEN $2 ELSE 0 END
           WHERE prediction_id = $3 AND match_id = $4
           RETURNING is_correct, points_earned`,
          [match.winner_id, roundPoints, pred.id, match.id]
        );

        if (pickResult.rows.length > 0 && pickResult.rows[0].is_correct) {
          totalPoints += pickResult.rows[0].points_earned;
        }
      }

      // Check champion prediction (final match pick)
      if (actualChampionId && finalMatch) {
        const champPick = await client.query(
          `SELECT predicted_winner_id FROM tournament_prediction_picks
           WHERE prediction_id = $1 AND match_id = $2`,
          [pred.id, finalMatch.id]
        );
        if (champPick.rows.length > 0 && champPick.rows[0].predicted_winner_id === actualChampionId) {
          championCorrect = true;
          totalPoints *= 2; // Double total if champion predicted correctly
        }
      }

      // Update the prediction record
      await client.query(
        `UPDATE tournament_predictions
         SET points_awarded = $1, champion_correct = $2
         WHERE id = $3`,
        [totalPoints, championCorrect, pred.id]
      );

      // Award prediction points to the user (separate from EXP)
      await client.query(
        'UPDATE users SET prediction_points = prediction_points + $1, lifetime_prediction_points = lifetime_prediction_points + $1 WHERE id = $2',
        [totalPoints, pred.user_id]
      );

      scoredCount++;
    }

    await client.query('COMMIT');

    res.json({
      message: `Scored ${scoredCount} predictions`,
      championId: actualChampionId,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error scoring predictions:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ── GET /predictions/:tournamentId/community ── Aggregated community prediction percentages
router.get('/:tournamentId/community', async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Total number of users who submitted predictions
    const totalResult = await pool.query(
      'SELECT COUNT(*) AS total FROM tournament_predictions WHERE tournament_id = $1',
      [tournamentId]
    );
    const totalPredictors = parseInt(totalResult.rows[0].total);

    if (totalPredictors === 0) {
      return res.json({ totalPredictors: 0, matches: {} });
    }

    // Per-match pick counts grouped by predicted_winner_id
    const picksResult = await pool.query(
      `SELECT tpp.match_id, tpp.predicted_winner_id, COUNT(*) AS pick_count
       FROM tournament_prediction_picks tpp
       JOIN tournament_predictions tp ON tp.id = tpp.prediction_id
       WHERE tp.tournament_id = $1
       GROUP BY tpp.match_id, tpp.predicted_winner_id
       ORDER BY tpp.match_id, pick_count DESC`,
      [tournamentId]
    );

    // Build { match_id: { player_id: percentage, ... } }
    const matches = {};
    for (const row of picksResult.rows) {
      const matchId = row.match_id;
      if (!matches[matchId]) matches[matchId] = {};
      matches[matchId][row.predicted_winner_id] = Math.round((parseInt(row.pick_count) / totalPredictors) * 100);
    }

    res.json({ totalPredictors, matches });
  } catch (err) {
    console.error('Error fetching community predictions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /predictions/:tournamentId/leaderboard ── Prediction leaderboard for a tournament
router.get('/:tournamentId/leaderboard', async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const result = await pool.query(
      `SELECT tp.user_id, u.display_name, u.profile_picture,
              tp.points_awarded, tp.champion_correct, tp.submitted_at
       FROM tournament_predictions tp
       JOIN users u ON u.id = tp.user_id
       WHERE tp.tournament_id = $1
       ORDER BY tp.points_awarded DESC
       LIMIT 50`,
      [tournamentId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching prediction leaderboard:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
