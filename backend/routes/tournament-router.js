const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to check if user is staff/admin
const isStaff = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [req.session.userId]
        );
        
        if (result.rows[0]?.role === 'staff' || result.rows[0]?.role === 'admin') {
            return next();
        }
        
        res.status(403).json({ error: 'Unauthorized: Staff access required' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /tournaments - List all tournaments
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.*, 
                COUNT(tp.id) as participant_count,
                CASE 
                    WHEN tp2.user_id IS NOT NULL THEN true 
                    ELSE false 
                END as is_signed_up
            FROM tournaments t
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
            LEFT JOIN tournament_participants tp2 ON t.id = tp2.tournament_id 
                AND tp2.user_id = $1
            GROUP BY t.id, tp2.user_id
            ORDER BY t.date DESC
        `, [req.session?.userId || null]);
        
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /tournaments/:id - Get tournament details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT t.*, 
                COUNT(tp.id) as participant_count,
                CASE 
                    WHEN tp2.user_id IS NOT NULL THEN true 
                    ELSE false 
                END as is_signed_up
            FROM tournaments t
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
            LEFT JOIN tournament_participants tp2 ON t.id = tp2.tournament_id 
                AND tp2.user_id = $1
            WHERE t.id = $2
            GROUP BY t.id, tp2.user_id
        `, [req.session?.userId || null, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Get participants if tournament has any
        const participants = await pool.query(`
            SELECT u.display_name, u.profile_picture, u.id
            FROM tournament_participants tp
            JOIN users u ON tp.user_id = u.id
            WHERE tp.tournament_id = $1
            ORDER BY tp.created_at ASC
        `, [id]);

        const tournament = result.rows[0];
        tournament.participants = participants.rows;

        res.json(tournament);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /tournaments/:id/signup - Sign up for a tournament
router.post('/:id/signup', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;

    try {
        // Check if tournament exists and is open for registration
        const tournamentCheck = await pool.query(
            'SELECT status FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournamentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournamentCheck.rows[0].status !== 'registration_open') {
            return res.status(400).json({ error: 'Registration is closed' });
        }

        // Check if already signed up
        const existingSignup = await pool.query(
            'SELECT id FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingSignup.rows.length > 0) {
            return res.status(400).json({ error: 'Already signed up' });
        }

        // Add participant
        await pool.query(
            'INSERT INTO tournament_participants (tournament_id, user_id) VALUES ($1, $2)',
            [id, userId]
        );

        res.json({ message: 'Successfully signed up for tournament' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /tournaments/:id/signup - Cancel tournament signup
router.delete('/:id/signup', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;

    try {
        const tournament = await pool.query(
            'SELECT status FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournament.rows[0].status !== 'registration_open') {
            return res.status(400).json({ error: 'Cannot cancel signup after registration is closed' });
        }

        const result = await pool.query(
            'DELETE FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not signed up for this tournament' });
        }

        res.json({ message: 'Successfully cancelled tournament signup' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /tournaments/:id/participants - Get tournament participants (staff only)
router.get('/:id/participants', authMiddleware, isStaff, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id, 
                u.display_name, 
                u.profile_picture, 
                tp.created_at as signup_date,
                tp.seed
            FROM tournament_participants tp
            JOIN users u ON tp.user_id = u.id
            WHERE tp.tournament_id = $1
            ORDER BY tp.seed NULLS LAST, tp.created_at ASC
        `, [req.params.id]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /tournaments/:id/status - Update tournament status (staff only)
router.put('/:id/status', authMiddleware, isStaff, 
    body('status').isIn(['registration_open', 'registration_closed', 'check_in', 'in_progress', 'completed', 'cancelled']),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { status } = req.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check current status first
            const currentStatus = await client.query(
                'SELECT status, format FROM tournaments WHERE id = $1',
                [id]
            );

            if (currentStatus.rows.length === 0) {
                throw new Error('Tournament not found');
            }            // If starting tournament, check if brackets exist first
            if (status === 'in_progress') {
                // Check if brackets already exist
                const existingBrackets = await client.query(
                    'SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = $1',
                    [id]
                );

                if (parseInt(existingBrackets.rows[0].count) === 0) {
                    // Get participants with seeds
                    const participants = await client.query(
                        'SELECT user_id FROM tournament_participants WHERE tournament_id = $1 ORDER BY seed NULLS LAST, RANDOM()',
                        [id]
                    );

                    const playerIds = participants.rows.map(p => p.user_id);
                    
                    if (playerIds.length < 2) {
                        throw new Error('Not enough participants to start tournament (minimum 2 required)');
                    }

                    const format = currentStatus.rows[0].format;
                    await generateBracket(client, id, playerIds, format === 'DOUBLE_ELIMINATION');
                } else {
                    console.log(`Brackets already exist for tournament ${id}, skipping generation`);
                }
            }

            await client.query(
                'UPDATE tournaments SET status = $1 WHERE id = $2',
                [status, id]
            );

            await client.query('COMMIT');
            res.json({ message: 'Tournament status updated successfully' });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error updating tournament status:', err);
            res.status(500).json({ error: err.message || 'Internal server error' });
        } finally {
            client.release();
        }
    }
);

// GET /tournaments/:id/bracket - Get tournament bracket
router.get('/:id/bracket', async (req, res) => {
    try {
        // Get tournament info first
        const tournamentResult = await pool.query(`
            SELECT id, format, status
            FROM tournaments
            WHERE id = $1
        `, [req.params.id]);

        if (tournamentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Get match data
        const matchesResult = await pool.query(`
            SELECT m.*, 
                p1.display_name as player1_name, p1.profile_picture as player1_picture,
                p2.display_name as player2_name, p2.profile_picture as player2_picture,
                w.display_name as winner_name,
                CASE 
                    WHEN t.format = 'DOUBLE_ELIMINATION' AND m.round > (SELECT MAX(round) FROM tournament_matches WHERE tournament_id = $1)/2 
                    THEN 'losers'
                    WHEN t.format = 'DOUBLE_ELIMINATION' AND m.round = (SELECT MAX(round) FROM tournament_matches WHERE tournament_id = $1) 
                    THEN 'finals'
                    ELSE 'winners'
                END as bracket
            FROM tournament_matches m
            JOIN tournaments t ON m.tournament_id = t.id
            LEFT JOIN users p1 ON m.player1_id = p1.id
            LEFT JOIN users p2 ON m.player2_id = p2.id
            LEFT JOIN users w ON m.winner_id = w.id
            WHERE m.tournament_id = $1
            ORDER BY m.round, m.match_number
        `, [req.params.id]);

        // Return both tournament and matches in the structure expected by the front-end
        res.json({
            tournament: tournamentResult.rows[0],
            matches: matchesResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /tournaments/:id/matches/:matchId - Update match result (staff only)
router.put('/:id/matches/:matchId', authMiddleware, isStaff, async (req, res) => {
    const { id, matchId } = req.params;
    const { player1_score, player2_score, winner_id } = req.body;

    try {
        // Verify match exists and belongs to tournament
        const matchCheck = await pool.query(
            'SELECT player1_id, player2_id, next_match_id FROM tournament_matches WHERE id = $1 AND tournament_id = $2',
            [matchId, id]
        );

        if (matchCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const { player1_id, player2_id, next_match_id } = matchCheck.rows[0];
        
        if (winner_id && winner_id !== player1_id && winner_id !== player2_id) {
            return res.status(400).json({ error: 'Winner must be one of the match participants' });
        }

        // Update match result
        await pool.query(`
            UPDATE tournament_matches 
            SET player1_score = $1, player2_score = $2, winner_id = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
        `, [player1_score, player2_score, winner_id, matchId]);

        // If there's a next match and we have a winner, update the next match
        if (next_match_id && winner_id) {
            const nextMatch = await pool.query(
                'SELECT player1_id, player2_id FROM tournament_matches WHERE id = $1',
                [next_match_id]
            );

            // Determine which slot to fill in the next match
            const isFirstPlayer = !nextMatch.rows[0].player1_id;
            await pool.query(`
                UPDATE tournament_matches 
                SET ${isFirstPlayer ? 'player1_id' : 'player2_id'} = $1
                WHERE id = $2
            `, [winner_id, next_match_id]);
        }

        res.json({ message: 'Match result updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /tournaments/:id/seeds - Update participant seeds (staff only)
router.put('/:id/seeds', authMiddleware, isStaff, async (req, res) => {
    const { id } = req.params;
    const { seeds } = req.body;  // { userId: seed }

    if (!seeds || typeof seeds !== 'object') {
        return res.status(400).json({ error: 'Invalid seeds data' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const [userId, seed] of Object.entries(seeds)) {
            await client.query(
                'UPDATE tournament_participants SET seed = $1 WHERE tournament_id = $2 AND user_id = $3',
                [seed, id, userId]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Seeds updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// POST /tournaments/:id/bracket/generate - Generate brackets for a tournament (staff only)
router.post('/:id/bracket/generate', authMiddleware, isStaff, async (req, res) => {
    const { id } = req.params;
    console.log(`Attempting to generate brackets for tournament ${id}`);
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');        // Check tournament exists and is in correct state
        console.log('Checking tournament status...');
        const tournament = await client.query(
            'SELECT status, format, (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1) as participant_count FROM tournaments WHERE id = $1',
            [id]
        );
        console.log('Tournament query result:', tournament.rows[0]);

        if (tournament.rows.length === 0) {
            console.log('Tournament not found');
            throw new Error('Tournament not found');
        }
        
        // Check if brackets already exist
        const existingBrackets = await client.query(
            'SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = $1',
            [id]
        );
        
        if (parseInt(existingBrackets.rows[0].count) > 0) {
            console.log(`Brackets already exist for tournament ${id}`);
            throw new Error('Tournament brackets have already been generated');
        }

        if (tournament.rows[0].status !== 'registration_closed') {
            console.log(`Invalid tournament status: ${tournament.rows[0].status}`);
            throw new Error('Tournament must be in registration_closed state to generate brackets');
        }

        // Get participants with seeds
        console.log('Getting participants...');
        const participants = await client.query(
            'SELECT user_id FROM tournament_participants WHERE tournament_id = $1 ORDER BY seed NULLS LAST, RANDOM()',
            [id]
        );
        console.log(`Found ${participants.rows.length} participants`);

        const playerIds = participants.rows.map(p => p.user_id);
        
        if (playerIds.length < 2) {
            console.log('Not enough participants');
            throw new Error('Not enough participants to generate brackets (minimum 2 required)');
        }        // Generate brackets
        console.log('Generating brackets...');
        try {
            await generateBracket(client, id, playerIds, tournament.rows[0].format === 'DOUBLE_ELIMINATION');
        } catch (bracketErr) {
            console.error('Error in bracket generation:', bracketErr);
            throw new Error(`Failed to generate brackets: ${bracketErr.message}`);
        }
        
        // Update tournament status to in_progress
        await client.query(
            'UPDATE tournaments SET status = $1 WHERE id = $2',
            ['in_progress', id]
        );

        await client.query('COMMIT');
        console.log('Bracket generation successful');
        res.json({ message: 'Tournament brackets generated successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error generating brackets:', err);
        res.status(err.message.includes('not found') ? 404 : 500)
           .json({ error: err.message || 'Internal server error' });
    } finally {
        client.release();
    }
});

// POST /tournaments/:id/brackets/generate - Backward compatibility route
router.post('/:id/brackets/generate', authMiddleware, isStaff, async (req, res) => {
    // Redirect to the new endpoint for backward compatibility
    req.url = req.url.replace('/brackets/generate', '/bracket/generate');
    router.handle(req, res);
});

// Helper function to generate tournament bracket
async function generateBracket(client, tournamentId, playerIds, isDoubleElimination) {
    try {
        // First, check if any matches already exist and clear them if necessary
        const existingMatches = await client.query(
            'SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = $1',
            [tournamentId]
        );
        
        if (parseInt(existingMatches.rows[0].count) > 0) {
            console.log(`Found existing matches for tournament ${tournamentId}, clearing them first`);
            await client.query('DELETE FROM tournament_matches WHERE tournament_id = $1', [tournamentId]);
        }
        
        const rounds = Math.ceil(Math.log2(playerIds.length));
        let matchNumber = 1;
        let currentRound = 1;

        // Calculate number of byes needed
        const totalSlots = Math.pow(2, rounds);
        const byeCount = totalSlots - playerIds.length;

        console.log(`Generating ${isDoubleElimination ? 'double' : 'single'} elimination bracket with ${rounds} rounds, ${playerIds.length} players`);

        // First round matches
        for (let i = 0; i < playerIds.length; i += 2) {
            const player1Id = playerIds[i];
            const player2Id = i + 1 < playerIds.length ? playerIds[i + 1] : null;
            
            const result = await client.query(`
                INSERT INTO tournament_matches 
                (tournament_id, round, match_number, player1_id, player2_id, bye_match)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, [
                tournamentId,
                currentRound,
                matchNumber++,
                player1Id,
                player2Id,
                !player2Id  // bye_match is true if there's no player2
            ]);

            // If it's a bye match, automatically advance player1
            if (!player2Id) {
                await client.query(`
                    UPDATE tournament_matches
                    SET winner_id = $1
                    WHERE id = $2
                `, [player1Id, result.rows[0].id]);
            }
        }

        // Create empty matches for subsequent rounds
        const remainingRounds = rounds - 1;
        let prevRoundMatches = Math.ceil(playerIds.length / 2);

        for (let round = 2; round <= remainingRounds + 1; round++) {
            const matchesInRound = Math.ceil(prevRoundMatches / 2);
            
            for (let match = 1; match <= matchesInRound; match++) {
                await client.query(`
                    INSERT INTO tournament_matches 
                    (tournament_id, round, match_number)
                    VALUES ($1, $2, $3)
                `, [tournamentId, round, match]);
            }

            prevRoundMatches = matchesInRound;
        }

        // Link matches to their next matches
        await client.query(`
            WITH RankedMatches AS (
                SELECT 
                    id,
                    round,
                    match_number,
                    CEIL(match_number::float / 2) as next_match_number,
                    round + 1 as next_round
                FROM tournament_matches
                WHERE tournament_id = $1
            )
            UPDATE tournament_matches t1
            SET next_match_id = t2.id
            FROM RankedMatches r1
            JOIN tournament_matches t2 ON 
                t2.round = r1.next_round AND 
                t2.match_number = r1.next_match_number AND
                t2.tournament_id = $1
            WHERE 
                t1.id = r1.id AND 
                t1.tournament_id = $1
        `, [tournamentId]);

        // For double elimination, we would add losers bracket matches here
        if (isDoubleElimination) {
            console.log('Double elimination brackets are not fully implemented yet');
            // This would be the place to generate the losers bracket and finals
        }

    } catch (err) {
        console.error('Error generating bracket:', err);
        throw err;
    }
}

module.exports = router;
