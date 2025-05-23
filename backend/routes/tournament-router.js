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

// POST /tournaments - Create a new tournament (staff only)
router.post('/', authMiddleware, isStaff, [
    body('name').isLength({ min: 3, max: 100 }).withMessage('Tournament name must be between 3 and 100 characters'),
    body('description').optional(),
    body('date').isISO8601().withMessage('Date must be a valid ISO date'),
    body('format').isIn(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION']).withMessage('Invalid tournament format'),
    body('maxParticipants').isInt({ min: 2 }).withMessage('Maximum participants must be at least 2'),
    body('seedType').isIn(['RANDOM', 'MANUAL']).withMessage('Invalid seed type'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { 
        name, 
        description, 
        date, 
        game, 
        rules, 
        format, 
        maxParticipants, 
        seedType,
        externalLinks
    } = req.body;

    const userId = req.session.userId;

    try {        const result = await pool.query(`
            INSERT INTO tournaments 
            (name, description, date, format, max_participants, rules, created_by, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING id
        `, [
            name, 
            description, 
            date, 
            format, 
            maxParticipants, 
            rules || null,
            userId,
            'registration_open'
        ]);

        // If there are external links, could store them in a related table
        // This would require creating a new table for tournament_external_links

        res.status(201).json({ 
            id: result.rows[0].id,
            message: 'Tournament created successfully' 
        });
    } catch (err) {
        console.error('Error creating tournament:', err);
        res.status(500).json({ 
            error: 'Failed to create tournament',
            details: err.message
        });
    }
});

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
        }        // Get match data
        const matchesResult = await pool.query(`
            SELECT m.*, 
                p1.display_name as player1_name, p1.profile_picture as player1_picture,
                p2.display_name as player2_name, p2.profile_picture as player2_picture,
                w.display_name as winner_name,
                COALESCE(m.bracket_type, 'winners') as bracket
            FROM tournament_matches m
            JOIN tournaments t ON m.tournament_id = t.id
            LEFT JOIN users p1 ON m.player1_id = p1.id
            LEFT JOIN users p2 ON m.player2_id = p2.id
            LEFT JOIN users w ON m.winner_id = w.id
            WHERE m.tournament_id = $1
            ORDER BY 
                CASE m.bracket_type 
                    WHEN 'winners' THEN 1 
                    WHEN 'losers' THEN 2 
                    WHEN 'finals' THEN 3 
                    ELSE 4 
                END,
                m.round, 
                m.match_number
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

    try {        // Verify match exists and belongs to tournament
        const matchCheck = await pool.query(
            'SELECT player1_id, player2_id, next_match_id, losers_match_id, bracket_type FROM tournament_matches WHERE id = $1 AND tournament_id = $2',
            [matchId, id]
        );

        if (matchCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const { player1_id, player2_id, next_match_id, losers_match_id, bracket_type } = matchCheck.rows[0];
        
        if (winner_id && winner_id !== player1_id && winner_id !== player2_id) {
            return res.status(400).json({ error: 'Winner must be one of the match participants' });
        }

        // Update match result
        await pool.query(`
            UPDATE tournament_matches 
            SET player1_score = $1, player2_score = $2, winner_id = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
        `, [player1_score, player2_score, winner_id, matchId]);

        // If there's no winner set, we don't need to update other matches
        if (!winner_id) {
            return res.json({ message: 'Match result updated' });
        }

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
        
        // For double elimination, handle the loser going to losers bracket
        if (losers_match_id && player1_id && player2_id) {
            const loserId = (winner_id === player1_id) ? player2_id : player1_id;
            
            const losersMatch = await pool.query(
                'SELECT player1_id, player2_id FROM tournament_matches WHERE id = $1',
                [losers_match_id]
            );
            
            // Determine which slot to fill in the losers match
            const isFirstPlayer = !losersMatch.rows[0].player1_id;
            await pool.query(`
                UPDATE tournament_matches 
                SET ${isFirstPlayer ? 'player1_id' : 'player2_id'} = $1
                WHERE id = $2
            `, [loserId, losers_match_id]);
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

        // Store first-round match IDs to use when creating losers bracket
        const firstRoundMatchIds = [];

        // Winners bracket - First round matches
        for (let i = 0; i < playerIds.length; i += 2) {
            const player1Id = playerIds[i];
            const player2Id = i + 1 < playerIds.length ? playerIds[i + 1] : null;
            
            const result = await client.query(`
                INSERT INTO tournament_matches 
                (tournament_id, round, match_number, player1_id, player2_id, bye_match, bracket_type)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `, [
                tournamentId,
                currentRound,
                matchNumber++,
                player1Id,
                player2Id,
                !player2Id,  // bye_match is true if there's no player2
                'winners'    // Mark as winners bracket
            ]);
            
            const matchId = result.rows[0].id;
            firstRoundMatchIds.push(matchId);

            // If it's a bye match, automatically advance player1
            if (!player2Id) {
                await client.query(`
                    UPDATE tournament_matches
                    SET winner_id = $1
                    WHERE id = $2
                `, [player1Id, matchId]);
            }
        }

        // Winners bracket - Create empty matches for subsequent rounds
        const remainingRounds = rounds - 1;
        let prevRoundMatches = Math.ceil(playerIds.length / 2);
        const winnersBracketMatchesByRound = { 1: firstRoundMatchIds };

        for (let round = 2; round <= remainingRounds + 1; round++) {
            const matchesInRound = Math.ceil(prevRoundMatches / 2);
            winnersBracketMatchesByRound[round] = [];
            
            for (let match = 1; match <= matchesInRound; match++) {
                const result = await client.query(`
                    INSERT INTO tournament_matches 
                    (tournament_id, round, match_number, bracket_type)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                `, [tournamentId, round, match, 'winners']);
                
                winnersBracketMatchesByRound[round].push(result.rows[0].id);
            }

            prevRoundMatches = matchesInRound;
        }

        // Link winners bracket matches to their next matches
        await client.query(`
            WITH RankedMatches AS (
                SELECT 
                    id,
                    round,
                    match_number,
                    CEIL(match_number::float / 2) as next_match_number,
                    round + 1 as next_round
                FROM tournament_matches
                WHERE tournament_id = $1 AND bracket_type = 'winners'
            )
            UPDATE tournament_matches t1
            SET next_match_id = t2.id
            FROM RankedMatches r1
            JOIN tournament_matches t2 ON 
                t2.round = r1.next_round AND 
                t2.match_number = r1.next_match_number AND
                t2.tournament_id = $1 AND
                t2.bracket_type = 'winners'
            WHERE 
                t1.id = r1.id AND 
                t1.tournament_id = $1
        `, [tournamentId]);

        if (isDoubleElimination) {
            console.log('Generating double elimination bracket');
            
            // Create losers bracket matches
            const losersBracketMatchesByRound = {};            // Calculate losers bracket rounds based on number of players
            // For N players:
            // - 4 players: 1 losers round
            // - 8 players: 2 losers rounds
            // - 16 players: 3 losers rounds
            const loserRounds = rounds - 1;
            
            // For each winners round (except finals), create corresponding losers rounds
            let loserMatchNumber = 1;
            let loserRound = 1;
              // Create initial losers bracket round for first-round losers
            losersBracketMatchesByRound[loserRound] = [];            // Calculate first round matches in a way that ensures proper pairing
            const firstRoundMatchCount = Math.ceil(playerIds.length / 2);
            // Count how many real matches we have (excluding byes)
            const realMatchCount = playerIds.length % 2 === 0 ? 
                firstRoundMatchCount : 
                firstRoundMatchCount - 1;
            // Losers from real matches need to be paired in the losers bracket
            const loserMatchesInFirstRound = Math.ceil(realMatchCount / 2);
            
            // Start with match number 1 since we have bracket_type in uniqueness constraint
            // Use the maximum match number from the winners bracket + 1            // Start losers bracket with match number 1, since we now have a unique constraint that includes bracket_type
            loserMatchNumber = 1;
            
            for (let i = 0; i < loserMatchesInFirstRound; i++) {
                const result = await client.query(`
                    INSERT INTO tournament_matches 
                    (tournament_id, round, match_number, bracket_type)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                `, [tournamentId, loserRound, loserMatchNumber++, 'losers']);
                
                losersBracketMatchesByRound[loserRound].push(result.rows[0].id);
            }            // Create remaining losers bracket rounds
            for (let round = 2; round <= loserRounds; round++) {
                loserRound++;
                losersBracketMatchesByRound[loserRound] = [];
                
                // Every even round has the same number of matches as previous round
                // Every odd round combines winners from two previous rounds                // In even-numbered rounds, we keep the same number of matches as the previous round
                // because we're just waiting for winners bracket losers to join.
                // In odd-numbered rounds, we combine the winners from the previous round into pairs.
                const isIntermediateRound = round % 2 === 0;
                let matchesInRound;
                
                if (isIntermediateRound) {
                    // Keep same number of matches as previous round
                    matchesInRound = losersBracketMatchesByRound[loserRound - 1].length;
                } else {
                    // Combine winners into pairs, accounting for odd numbers
                    const prevRoundMatches = losersBracketMatchesByRound[loserRound - 1].length;
                    matchesInRound = Math.ceil(prevRoundMatches / 2);
                }
                
                // Reset match numbers for each round
                loserMatchNumber = 1;
                
                for (let match = 1; match <= matchesInRound; match++) {
                    const result = await client.query(`
                        INSERT INTO tournament_matches 
                        (tournament_id, round, match_number, bracket_type)
                        VALUES ($1, $2, $3, $4)
                        RETURNING id
                    `, [tournamentId, loserRound, loserMatchNumber++, 'losers']);
                    
                    losersBracketMatchesByRound[loserRound].push(result.rows[0].id);
                }
            }
            
            // Link losers coming from winners bracket to losers bracket
            // Start with first round losers
            for (let i = 0; i < firstRoundMatchIds.length; i++) {
                const winnerMatchId = firstRoundMatchIds[i];
                const loserMatchIdx = Math.floor(i / 2);
                
                // Make sure we have enough matches in the losers bracket
                if (loserMatchIdx < losersBracketMatchesByRound[1].length) {
                    const loserMatchId = losersBracketMatchesByRound[1][loserMatchIdx];
                    
                    await client.query(`
                        UPDATE tournament_matches 
                        SET losers_match_id = $1
                        WHERE id = $2
                    `, [loserMatchId, winnerMatchId]);
                }
            }
            
            // Link remaining winners bracket losers to appropriate losers bracket matches
            for (let round = 2; round <= remainingRounds; round++) {
                const winnerMatches = winnersBracketMatchesByRound[round];
                // Losers from round N of winners bracket go to round 2N-2 of losers bracket
                const targetLoserRound = 2 * round - 2;
                
                if (losersBracketMatchesByRound[targetLoserRound]) {
                    for (let i = 0; i < winnerMatches.length; i++) {
                        const winnerMatchId = winnerMatches[i];
                        const loserMatchIdx = Math.floor(i / 2);
                        
                        if (loserMatchIdx < losersBracketMatchesByRound[targetLoserRound].length) {
                            const loserMatchId = losersBracketMatchesByRound[targetLoserRound][loserMatchIdx];
                            
                            await client.query(`
                                UPDATE tournament_matches 
                                SET losers_match_id = $1
                                WHERE id = $2
                            `, [loserMatchId, winnerMatchId]);
                        }
                    }
                }
            }
            
            // Link losers bracket matches to next losers bracket matches
            for (let round = 1; round < loserRounds; round++) {
                const currentMatches = losersBracketMatchesByRound[round];
                const nextRound = round + 1;
                
                // Skip if no next round exists
                if (!losersBracketMatchesByRound[nextRound]) continue;
                
                const nextMatches = losersBracketMatchesByRound[nextRound];
                
                for (let i = 0; i < currentMatches.length; i++) {
                    const matchId = currentMatches[i];
                    // For odd rounds, every 2 matches feed into 1 next match
                    // For even rounds, each match feeds into its own next match
                    const isOddRound = round % 2 !== 0;
                    const nextMatchIdx = isOddRound ? Math.floor(i / 2) : i;
                    
                    if (nextMatchIdx < nextMatches.length) {
                        await client.query(`
                            UPDATE tournament_matches 
                            SET next_match_id = $1
                            WHERE id = $2
                        `, [nextMatches[nextMatchIdx], matchId]);
                    }
                }
            }
            
            // Create grand finals match
            const winnersFinalsId = winnersBracketMatchesByRound[rounds][0];
            const losersFinalsId = losersBracketMatchesByRound[loserRounds][0];
            
            const grandFinalsResult = await client.query(`
                INSERT INTO tournament_matches 
                (tournament_id, round, match_number, bracket_type, is_grand_finals)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, [tournamentId, rounds + 1, 1, 'finals', true]);
            
            const grandFinalsId = grandFinalsResult.rows[0].id;
            
            // Link winners/losers finals to grand finals
            await client.query(`
                UPDATE tournament_matches 
                SET next_match_id = $1
                WHERE id IN ($2, $3)
            `, [grandFinalsId, winnersFinalsId, losersFinalsId]);
        }

    } catch (err) {
        console.error('Error generating bracket:', err);
        throw err;
    }
}

module.exports = router;
