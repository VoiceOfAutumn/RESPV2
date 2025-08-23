const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Optional auth middleware - processes auth if present but doesn't require it
const optionalAuth = (req, res, next) => {
  let userId = null;

  // Try session first
  if (req.session && req.session.userId) {
    userId = req.session.userId;
    console.log('✅ OptionalAuth: Using session authentication, userId:', userId);
  } 
  // Try auth token as backup
  else if (req.headers.authorization) {
    const authToken = req.headers.authorization.replace('Bearer ', '');
    console.log('🔑 OptionalAuth: Trying token authentication:', authToken);
    
    // Parse token (format: userId.timestamp.randomHex)
    const tokenParts = authToken.split('.');
    if (tokenParts.length === 3) {
      const tokenUserId = parseInt(tokenParts[0]);
      const timestamp = parseInt(tokenParts[1]);
      const now = Date.now();
      
      // Check if token is not older than 24 hours
      if (!isNaN(tokenUserId) && !isNaN(timestamp) && (now - timestamp) < 24 * 60 * 60 * 1000) {
        userId = tokenUserId;
        console.log('✅ OptionalAuth: Using token authentication, userId:', userId);
        
        // Store userId in session for compatibility with existing code
        if (!req.session.userId) {
          req.session.userId = userId;
        }
      } else {
        console.log('❌ OptionalAuth: Token expired or invalid');
      }
    } else {
      console.log('❌ OptionalAuth: Token format invalid');
    }
  }

  console.log('OptionalAuth: Final userId for request:', userId);
  next(); // Continue regardless of auth status
};

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
    body('rules').optional(),
    body('image').optional().isURL().withMessage('Image must be a valid URL'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }    const { 
        name, 
        description, 
        date,
        rules, 
        image
    } = req.body;

    // Set default value for format
    const format = 'SINGLE_ELIMINATION';

    const userId = req.session.userId;

    try {
        const result = await pool.query(`
            INSERT INTO tournaments 
            (name, description, date, format, rules, created_by, status, image) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING id
        `, [
            name, 
            description, 
            date, 
            format,
            rules || null,
            userId,
            'registration_open',
            image || null
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
        console.log('🔍 Attempting to fetch tournaments data...');
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
        
        console.log(`✅ Tournaments query successful, returned ${result.rows.length} tournaments`);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error fetching tournaments:', err.message);
        console.error('Full error:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// GET /tournaments/:id - Get tournament details
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session?.userId || null;
        console.log('Tournament details request - userId:', userId, 'tournamentId:', id);
        
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
        `, [userId, id]);

        console.log('Tournament query result:', result.rows[0]?.is_signed_up);

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

// GET /tournaments/:id/participants - Get tournament participants (public access for bracket viewing)
router.get('/:id/participants', async (req, res) => {
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
            SELECT id, name, format, status
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

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verify match exists and belongs to tournament
        const matchCheck = await client.query(
            'SELECT player1_id, player2_id, next_match_id, losers_match_id, bracket_type, round FROM tournament_matches WHERE id = $1 AND tournament_id = $2',
            [matchId, id]
        );

        if (matchCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Match not found' });
        }

        const { player1_id, player2_id, next_match_id, losers_match_id, bracket_type, round } = matchCheck.rows[0];
        
        if (winner_id && winner_id !== player1_id && winner_id !== player2_id) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Winner must be one of the match participants' });
        }

        // Update match result
        await client.query(`
            UPDATE tournament_matches 
            SET player1_score = $1, player2_score = $2, winner_id = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
        `, [player1_score, player2_score, winner_id, matchId]);

        // If there's no winner set, we don't need to update other matches
        if (!winner_id) {
            await client.query('COMMIT');
            return res.json({ message: 'Match result updated' });
        }

        // If there's a next match and we have a winner, update the next match
        if (next_match_id && winner_id) {
            console.log(`Processing winner advancement for match ${matchId}:`);
            console.log(`  Winner ID: ${winner_id}`);
            console.log(`  Next Match ID: ${next_match_id}`);
            console.log(`  Current Round: ${round}`);
            
            const nextMatch = await client.query(
                'SELECT player1_id, player2_id, round, match_number FROM tournament_matches WHERE id = $1',
                [next_match_id]
            );

            if (nextMatch.rows.length > 0) {
                const nextMatchData = nextMatch.rows[0];
                console.log(`  Next match current state:`, nextMatchData);
                
                let targetSlot = null;
                
                /**
                 * IMPROVED WINNER ADVANCEMENT LOGIC
                 * 
                 * For Round 1 -> Round 2 advancement with custom BYE distribution:
                 * We need to determine which specific slot this winner should fill
                 * based on the advancement mapping we created during bracket generation.
                 * 
                 * For Round 2+ advancement: Use standard first-available-slot logic.
                 */
                
                if (round === 1 && nextMatchData.round === 2) {
                    // Round 1 -> Round 2: Check if we have specific slot assignments
                    // We'll determine the slot based on which one is intended for Round 1 winners
                    
                    // Strategy: Fill the slot that doesn't already have a BYE recipient
                    // BYE recipients are pre-populated during bracket creation
                    if (!nextMatchData.player1_id) {
                        targetSlot = 'player1_id';
                    } else if (!nextMatchData.player2_id) {
                        targetSlot = 'player2_id';
                    } else {
                        // Both slots might be filled if this is an error condition
                        console.warn(`  Round 2 match already has both players. P1: ${nextMatchData.player1_id}, P2: ${nextMatchData.player2_id}`);
                        targetSlot = null;
                    }
                } else {
                    // Standard advancement for Round 2+ matches
                    if (!nextMatchData.player1_id) {
                        targetSlot = 'player1_id';
                    } else if (!nextMatchData.player2_id) {
                        targetSlot = 'player2_id';
                    } else {
                        console.warn(`  Both slots occupied in next match. P1: ${nextMatchData.player1_id}, P2: ${nextMatchData.player2_id}`);
                        targetSlot = null;
                    }
                }
                
                if (targetSlot) {
                    console.log(`  Filling ${targetSlot} slot in next match`);
                    await client.query(
                        `UPDATE tournament_matches SET ${targetSlot} = $1 WHERE id = $2`,
                        [winner_id, next_match_id]
                    );
                    
                    // Verify the update worked
                    const verifyUpdate = await client.query(
                        'SELECT player1_id, player2_id FROM tournament_matches WHERE id = $1',
                        [next_match_id]
                    );
                    console.log(`  Next match after update:`, verifyUpdate.rows[0]);
                } else {
                    console.warn(`  No available slot in next match ${next_match_id}:`, nextMatchData);
                }
            } else {
                console.warn(`Next match ${next_match_id} not found`);
            }
        } else {
            if (!next_match_id) {
                console.log(`No next_match_id set for match ${matchId} (possibly final match)`);
            }
            if (!winner_id) {
                console.log(`No winner_id provided for match ${matchId}`);
            }
        }
        
        // For double elimination, handle the loser going to losers bracket
        if (losers_match_id && player1_id && player2_id) {
            const loserId = (winner_id === player1_id) ? player2_id : player1_id;
            
            const losersMatch = await client.query(
                'SELECT player1_id, player2_id FROM tournament_matches WHERE id = $1',
                [losers_match_id]
            );
            
            if (losersMatch.rows.length > 0) {
                // Determine which slot to fill in the losers match
                const isFirstPlayer = !losersMatch.rows[0].player1_id;
                await client.query(`
                    UPDATE tournament_matches 
                    SET ${isFirstPlayer ? 'player1_id' : 'player2_id'} = $1
                    WHERE id = $2
                `, [loserId, losers_match_id]);
            }
        }

        await client.query('COMMIT');
        res.json({ 
            message: 'Match result updated',
            winner_advanced: !!next_match_id,
            next_match_id: next_match_id
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating match result:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
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

/**
 * Single Elimination Tournament Bracket Generator
 * 
 * This component generates a tournament bracket for any number of participants,
 * properly handling BYEs and ensuring clean advancement through rounds.
 */

/**
 * Shuffles an array using Fisher-Yates algorithm for random participant seeding
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Generates a single-elimination tournament bracket
 * @param {Array} participants - Array of participant objects with {id, display_name}
 * @param {number} tournamentId - Tournament ID for database reference
 * @returns {Object} - Complete bracket structure with rounds and matches
 */
function generateSingleEliminationBracket(participants, tournamentId) {
    // Validate input
    if (!participants || participants.length < 2) {
        throw new Error('At least 2 participants are required for a tournament');
    }

    const numParticipants = participants.length;
    
    /**
     * CORRECT BRACKET CALCULATION
     * 
     * For a single-elimination tournament:
     * 1. bracketSize = 2^ceil(log2(N)) - the smallest power of 2 that fits all participants
     * 2. numberOfByes = bracketSize - N - how many top seeds skip Round 1
     * 3. round1MatchCount = (bracketSize / 2) - numberOfByes - actual matches in Round 1
     * 
     * Example: 6 participants in 8-size bracket
     * - bracketSize = 8, numberOfByes = 2, round1MatchCount = 2
     * - Top 2 seeds skip Round 1, remaining 4 play in 2 matches
     * - Round 2: 2 BYE seeds + 2 Round 1 winners = 4 participants in 2 matches
     */
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
    const numberOfByes = bracketSize - numParticipants;
    const round1MatchCount = (bracketSize / 2) - numberOfByes;
    const totalRounds = Math.ceil(Math.log2(bracketSize));
    
    console.log(`Bracket Generator: ${numParticipants} participants, ${bracketSize} bracket size, ${numberOfByes} BYEs, ${round1MatchCount} Round 1 matches, ${totalRounds} total rounds`);

    // Shuffle participants randomly before seeding to prevent predictable matchups
    const shuffledParticipants = shuffleArray(participants);
    
    /**
     * PARTICIPANT SEEDING
     * 
     * Top seeds (numberOfByes) skip Round 1 entirely
     * Remaining participants play in Round 1 matches
     */
    const byeSeeds = shuffledParticipants.slice(0, numberOfByes); // Top seeds get BYEs
    const round1Participants = shuffledParticipants.slice(numberOfByes); // Remaining play Round 1
    
    console.log(`BYE Recipients (${byeSeeds.length}):`, byeSeeds.map(p => p.display_name));
    console.log(`Round 1 Players (${round1Participants.length}):`, round1Participants.map(p => p.display_name));
    
    // Create bracket structure
    const bracket = {
        tournamentId: tournamentId,
        totalRounds: totalRounds,
        bracketSize: bracketSize,
        numberOfByes: numberOfByes,
        byeSeeds: byeSeeds,
        round1Participants: round1Participants,
        rounds: []
    };

    /**
     * ROUND 1 GENERATION
     * 
     * Only create actual matches between participants who must play.
     * Do NOT create BYE vs BYE matches or empty matches.
     * BYE recipients skip this round entirely.
     */
    const firstRound = [];
    
    for (let matchNum = 1; matchNum <= round1MatchCount; matchNum++) {
        const player1Index = (matchNum - 1) * 2;
        const player2Index = player1Index + 1;
        
        const player1 = round1Participants[player1Index] || null;
        const player2 = round1Participants[player2Index] || null;
        
        // Only create matches where both participants exist (or one if odd number)
        if (player1) {
            const isBye = !player2;
            let winner = null;
            
            if (isBye) {
                // Single participant gets automatic advancement
                winner = player1;
            }
            
            const match = {
                id: `r1-m${matchNum}`,
                round: 1,
                matchNumber: matchNum,
                player1: player1,
                player2: player2,
                winner: winner,
                isBye: isBye,
                status: isBye ? 'completed' : 'pending'
            };
            
            firstRound.push(match);
        }
    }
    
    // Only add Round 1 if there are actual matches to play
    if (firstRound.length > 0) {
        bracket.rounds.push(firstRound);
        console.log(`Round 1 created with ${firstRound.length} matches`);
    }
    
    /**
     * SUBSEQUENT ROUNDS GENERATION WITH IMPROVED BYE DISTRIBUTION
     * 
     * Round 2 participants = BYE seeds + Round 1 winners
     * We now pre-populate Round 2 with BYE seeds distributed evenly
     * to match the frontend preview logic exactly.
     */
    
    // Start with the correct round number
    let startRound = (firstRound.length > 0 ? 2 : 1);
    
    for (let round = startRound; round <= totalRounds; round++) {
        const roundMatches = [];
        const matchesInRound = Math.pow(2, totalRounds - round);
        
        if (round === 2 && numberOfByes > 0 && firstRound.length > 0) {
            /**
             * IMPROVED ROUND 2 GENERATION WITH BYE DISTRIBUTION
             * 
             * Instead of placing all BYEs at the beginning, we spread them evenly
             * across the Round 2 bracket positions to create more balanced matches.
             * 
             * For example, with 6 participants (2 BYEs, 2 Round 1 matches):
             * - Round 2 has 4 positions [0, 1, 2, 3]
             * - Instead of [BYE1, BYE2, R1W1, R1W2]
             * - We distribute as [BYE1, R1W1, BYE2, R1W2] for better spacing
             */
            console.log(`Round 2 Generation - BYEs: ${numberOfByes}, R1 Matches: ${round1MatchCount}`);
            
            const round2Size = Math.pow(2, totalRounds - 1); // Participants in Round 2
            const round2Participants = new Array(round2Size).fill(null);
            
            // Distribute BYEs evenly across Round 2 positions
            if (numberOfByes > 0 && round1MatchCount > 0) {
                // Mixed distribution: spread BYEs evenly across positions to avoid BYE vs BYE
                const totalSlots = round2Size;
                
                // Calculate optimal spacing to minimize BYE vs BYE matches
                const idealSpacing = totalSlots / numberOfByes;
                
                // If we have fewer BYEs than matches, space them out evenly
                if (numberOfByes <= matchesInRound) {
                    // Place BYEs at evenly spaced positions
                    for (let i = 0; i < numberOfByes; i++) {
                        const position = Math.floor(i * idealSpacing);
                        if (position < totalSlots && !round2Participants[position]) {
                            round2Participants[position] = byeSeeds[i];
                        }
                    }
                } else {
                    // More BYEs than Round 2 matches - use different strategy
                    // Fill alternating positions as much as possible
                    let byeIndex = 0;
                    for (let pos = 0; pos < totalSlots && byeIndex < numberOfByes; pos += 2) {
                        round2Participants[pos] = byeSeeds[byeIndex++];
                    }
                    // Fill remaining BYEs in remaining slots
                    for (let pos = 1; pos < totalSlots && byeIndex < numberOfByes; pos += 2) {
                        if (!round2Participants[pos]) {
                            round2Participants[pos] = byeSeeds[byeIndex++];
                        }
                    }
                    // If still have BYEs, fill sequentially
                    for (let pos = 0; pos < totalSlots && byeIndex < numberOfByes; pos++) {
                        if (!round2Participants[pos]) {
                            round2Participants[pos] = byeSeeds[byeIndex++];
                        }
                    }
                }
                
                // Fill remaining positions with Round 1 winner placeholders
                let round1Index = 0;
                for (let pos = 0; pos < round2Size; pos++) {
                    if (!round2Participants[pos] && round1Index < round1MatchCount) {
                        round2Participants[pos] = { isPlaceholder: true, fromMatch: round1Index + 1 };
                        round1Index++;
                    }
                }
            } else {
                // Single type distribution: all BYEs or all Round 1 participants
                for (let i = 0; i < numberOfByes; i++) {
                    round2Participants[i] = byeSeeds[i];
                }
                for (let i = 0; i < round1MatchCount; i++) {
                    round2Participants[numberOfByes + i] = { isPlaceholder: true, fromMatch: i + 1 };
                }
            }
            
            console.log(`Round 2 Distribution:`, round2Participants.map((p, i) => 
                `Pos ${i}: ${p ? (p.isPlaceholder ? `R1M${p.fromMatch} Winner` : p.display_name) : 'Empty'}`
            ));
            
            // Create Round 2 matches with the distributed participants
            for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
                const player1Index = (matchNum - 1) * 2;
                const player2Index = player1Index + 1;
                
                const participant1 = round2Participants[player1Index] || null;
                const participant2 = round2Participants[player2Index] || null;
                
                const match = {
                    id: `r${round}-m${matchNum}`,
                    round: round,
                    matchNumber: matchNum,
                    player1: participant1 && !participant1.isPlaceholder ? participant1 : null,
                    player2: participant2 && !participant2.isPlaceholder ? participant2 : null,
                    winner: null,
                    isBye: false,
                    status: 'pending',
                    // Store advancement mapping for later use
                    advancementInfo: {
                        player1Source: participant1?.isPlaceholder ? `r1-m${participant1.fromMatch}` : null,
                        player2Source: participant2?.isPlaceholder ? `r1-m${participant2.fromMatch}` : null
                    }
                };
                
                roundMatches.push(match);
            }
        } else {
            // For all other rounds, create empty match structure
            for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
                const match = {
                    id: `r${round}-m${matchNum}`,
                    round: round,
                    matchNumber: matchNum,
                    player1: null, // Will be filled by match results from previous round
                    player2: null, // Will be filled by match results from previous round
                    winner: null,
                    isBye: false, // No BYEs in subsequent rounds
                    status: 'pending'
                };
                
                roundMatches.push(match);
            }
        }
        
        bracket.rounds.push(roundMatches);
        console.log(`Round ${round} created with ${roundMatches.length} matches`);
    }
    
    return bracket;
}

/**
 * Formats bracket data for React frontend consumption
 * @param {Object} bracket - Raw bracket from generateSingleEliminationBracket
 * @returns {Object} - Formatted bracket optimized for React rendering
 */
function formatBracketForReact(bracket) {
    return {
        tournamentId: bracket.tournamentId,
        metadata: {
            totalRounds: bracket.totalRounds,
            bracketSize: bracket.bracketSize,
            numberOfByes: bracket.numberOfByes,
            totalMatches: bracket.rounds.reduce((sum, round) => sum + round.length, 0)
        },
        rounds: bracket.rounds.map((round, roundIndex) => ({
            roundNumber: roundIndex + 1,
            roundName: getRoundName(roundIndex + 1, bracket.totalRounds),
            matches: round.map(match => ({
                id: match.id,
                round: match.round,
                matchNumber: match.matchNumber,
                players: {
                    player1: match.player1 ? {
                        id: match.player1.id,
                        name: match.player1.display_name,
                        profilePicture: match.player1.profile_picture
                    } : null,
                    player2: match.player2 ? {
                        id: match.player2.id,
                        name: match.player2.display_name,
                        profilePicture: match.player2.profile_picture
                    } : null
                },
                winner: match.winner ? {
                    id: match.winner.id,
                    name: match.winner.display_name
                } : null,
                status: match.status,
                isBye: match.isBye
            }))
        }))
    };
}

/**
 * Helper function to get round names
 * @param {number} roundNumber - Current round number
 * @param {number} totalRounds - Total number of rounds
 * @returns {string} - Round name
 */
function getRoundName(roundNumber, totalRounds) {
    if (roundNumber === totalRounds) return 'Final';
    if (roundNumber === totalRounds - 1) return 'Semifinal';
    if (roundNumber === totalRounds - 2) return 'Quarterfinal';
    return `Round ${roundNumber}`;
}

/**
 * Saves bracket structure to database
 * @param {Object} bracket - Bracket from generateSingleEliminationBracket
 * @param {Object} client - Database client for transaction
 * @returns {Promise<Array>} - Array of created match records
 */
async function saveBracketToDatabase(bracket, client) {
    const createdMatches = [];
    
    try {
        // Clear any existing matches for this tournament
        await client.query(
            'DELETE FROM tournament_matches WHERE tournament_id = $1',
            [bracket.tournamentId]
        );

        // First pass: Save all matches without next_match_id relationships
        const matchIdMap = new Map(); // Maps "r{round}-m{match}" to actual database ID
        
        for (const round of bracket.rounds) {
            for (const match of round) {
                const result = await client.query(`
                    INSERT INTO tournament_matches 
                    (tournament_id, round, match_number, player1_id, player2_id, winner_id, bye_match, bracket_type)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *
                `, [
                    bracket.tournamentId,
                    match.round,
                    match.matchNumber,
                    match.player1?.id || null,
                    match.player2?.id || null,
                    match.winner?.id || null,
                    match.isBye,
                    'winners'
                ]);

                const savedMatch = result.rows[0];
                createdMatches.push(savedMatch);
                matchIdMap.set(match.id, savedMatch.id);
            }
        }

        // Second pass: Update next_match_id relationships with custom mapping for Round 2
        console.log('Setting up next_match_id relationships...');
        
        // Create custom advancement mapping for Round 1 -> Round 2 based on our BYE distribution
        const round1Matches = bracket.rounds.find(r => r[0]?.round === 1);
        const round2Matches = bracket.rounds.find(r => r[0]?.round === 2);
        
        if (round1Matches && round2Matches) {
            console.log('Creating custom Round 1 -> Round 2 advancement mapping...');
            console.log(`Round 1 matches: ${round1Matches.length}, Round 2 matches: ${round2Matches.length}`);
            
            // Debug: Show Round 2 advancement info
            round2Matches.forEach(r2Match => {
                console.log(`  ${r2Match.id}: advancementInfo =`, r2Match.advancementInfo);
            });
            
            // Map Round 1 matches to their corresponding Round 2 slots
            for (const r1Match of round1Matches) {
                console.log(`\nProcessing ${r1Match.id}...`);
                // Find which Round 2 match this Round 1 winner should go to
                let targetR2Match = null;
                let targetSlot = null;
                
                for (const r2Match of round2Matches) {
                    console.log(`  Checking ${r2Match.id}: advancementInfo =`, r2Match.advancementInfo);
                    if (r2Match.advancementInfo) {
                        if (r2Match.advancementInfo.player1Source === r1Match.id) {
                            targetR2Match = r2Match;
                            targetSlot = 'player1';
                            console.log(`    ✓ MATCH FOUND: ${r1Match.id} -> ${r2Match.id} (player1 slot)`);
                            break;
                        } else if (r2Match.advancementInfo.player2Source === r1Match.id) {
                            targetR2Match = r2Match;
                            targetSlot = 'player2';
                            console.log(`    ✓ MATCH FOUND: ${r1Match.id} -> ${r2Match.id} (player2 slot)`);
                            break;
                        }
                    }
                }
                
                if (targetR2Match) {
                    const r1DatabaseId = matchIdMap.get(r1Match.id);
                    const r2DatabaseId = matchIdMap.get(targetR2Match.id);
                    
                    console.log(`  Database IDs: ${r1Match.id}=${r1DatabaseId}, ${targetR2Match.id}=${r2DatabaseId}`);
                    
                    if (r1DatabaseId && r2DatabaseId) {
                        await client.query(
                            'UPDATE tournament_matches SET next_match_id = $1 WHERE id = $2',
                            [r2DatabaseId, r1DatabaseId]
                        );
                        console.log(`  ✓ MAPPED: ${r1Match.id} (DB:${r1DatabaseId}) -> ${targetR2Match.id} (DB:${r2DatabaseId}) [${targetSlot} slot]`);
                    }
                } else {
                    console.warn(`  ✗ ERROR: No Round 2 destination found for ${r1Match.id}`);
                }
            }
        }
        
        // Standard advancement mapping for Round 2 onwards
        for (const round of bracket.rounds) {
            if (round.length === 0) continue;
            
            const currentRoundNumber = round[0].round;
            if (currentRoundNumber === bracket.totalRounds) continue; // Skip final round
            if (currentRoundNumber === 1) continue; // Skip Round 1 (handled above)
            
            for (const match of round) {
                // Use standard tournament advancement formula for Round 2+
                const nextRound = match.round + 1;
                const nextMatchNumber = Math.ceil(match.matchNumber / 2);
                const nextMatchId = `r${nextRound}-m${nextMatchNumber}`;
                
                const databaseMatchId = matchIdMap.get(match.id);
                const nextDatabaseMatchId = matchIdMap.get(nextMatchId);
                
                console.log(`  ${match.id} (DB ID: ${databaseMatchId}) -> ${nextMatchId} (DB ID: ${nextDatabaseMatchId})`);
                
                if (databaseMatchId && nextDatabaseMatchId) {
                    await client.query(
                        'UPDATE tournament_matches SET next_match_id = $1 WHERE id = $2',
                        [nextDatabaseMatchId, databaseMatchId]
                    );
                } else {
                    console.warn(`  Failed to set next_match_id: missing DB IDs`);
                }
            }
        }
        console.log('Finished setting up next_match_id relationships');

        // Third pass: Automatically advance BYE winners to next round
        console.log('Advancing BYE winners to next round...');
        for (const round of bracket.rounds) {
            if (round.length === 0) continue;
            
            const currentRoundNumber = round[0].round;
            if (currentRoundNumber === bracket.totalRounds) continue; // Skip final round
            
            for (const match of round) {
                // If this is a BYE match with a winner, advance them
                if (match.isBye && match.winner) {
                    const winnerId = match.winner.id;
                    const databaseMatchId = matchIdMap.get(match.id);
                    
                    // Get the next_match_id for this match
                    const nextMatchQuery = await client.query(
                        'SELECT next_match_id FROM tournament_matches WHERE id = $1',
                        [databaseMatchId]
                    );
                    
                    if (nextMatchQuery.rows.length > 0 && nextMatchQuery.rows[0].next_match_id) {
                        const nextMatchId = nextMatchQuery.rows[0].next_match_id;
                        
                        // Check current state of next match
                        const nextMatchState = await client.query(
                            'SELECT player1_id, player2_id FROM tournament_matches WHERE id = $1',
                            [nextMatchId]
                        );
                        
                        if (nextMatchState.rows.length > 0) {
                            const nextMatch = nextMatchState.rows[0];
                            
                            // Place BYE winner in the first available slot
                            if (!nextMatch.player1_id) {
                                console.log(`  Advancing BYE winner ${winnerId} to next match ${nextMatchId} (player1_id slot)`);
                                await client.query(
                                    'UPDATE tournament_matches SET player1_id = $1 WHERE id = $2',
                                    [winnerId, nextMatchId]
                                );
                            } else if (!nextMatch.player2_id) {
                                console.log(`  Advancing BYE winner ${winnerId} to next match ${nextMatchId} (player2_id slot)`);
                                await client.query(
                                    'UPDATE tournament_matches SET player2_id = $1 WHERE id = $2',
                                    [winnerId, nextMatchId]
                                );
                            } else {
                                console.warn(`  Next match ${nextMatchId} already has both players filled`);
                            }
                        }
                    }
                }
            }
        }
        console.log('Finished advancing BYE winners');

        return createdMatches;
    } catch (error) {
        console.error('Error saving bracket to database:', error);
        throw error;
    }
}

// POST /tournaments/:id/bracket/generate - Generate single-elimination bracket (staff only)
router.post('/:id/bracket/generate', authMiddleware, isStaff, async (req, res) => {
    const { id } = req.params;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Validate tournament state
        const tournament = await client.query(
            'SELECT status, format, (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1) as participant_count FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournament.rows.length === 0) {
            throw new Error('Tournament not found');
        }

        const { status, format, participant_count } = tournament.rows[0];

        if (status !== 'registration_closed') {
            throw new Error('Tournament must be in registration_closed state to generate brackets');
        }

        if (format !== 'SINGLE_ELIMINATION') {
            throw new Error('This endpoint only supports single elimination tournaments');
        }

        if (participant_count < 2) {
            throw new Error('At least 2 participants are required to generate brackets');
        }

        // Check if brackets already exist
        const existingBrackets = await client.query(
            'SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = $1',
            [id]
        );

        if (parseInt(existingBrackets.rows[0].count) > 0) {
            throw new Error('Tournament brackets have already been generated');
        }

        // Get participants
        const participants = await client.query(
            'SELECT u.id, u.display_name, u.profile_picture FROM tournament_participants tp JOIN users u ON tp.user_id = u.id WHERE tp.tournament_id = $1 ORDER BY tp.seed NULLS LAST, RANDOM()',
            [id]
        );

        if (participants.rows.length < 2) {
            throw new Error('Not enough participants to generate brackets');
        }

        // Generate the bracket
        const bracket = generateSingleEliminationBracket(participants.rows, parseInt(id));
        
        // Save to database
        const createdMatches = await saveBracketToDatabase(bracket, client);
        
        // Update tournament status to in_progress
        await client.query(
            'UPDATE tournaments SET status = $1 WHERE id = $2',
            ['in_progress', id]
        );

        await client.query('COMMIT');

        // Format response for frontend
        const formattedBracket = formatBracketForReact(bracket);
        
        res.json({
            message: 'Single-elimination bracket generated successfully',
            bracket: formattedBracket,
            matchesCreated: createdMatches.length
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error generating bracket:', err);
        res.status(err.message.includes('not found') ? 404 : 400)
           .json({ error: err.message || 'Internal server error' });
    } finally {
        client.release();
    }
});

// GET /tournaments/:id/bracket/structure - Get bracket structure for frontend rendering
router.get('/:id/bracket/structure', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Get tournament info
        const tournament = await pool.query(
            'SELECT id, format, status FROM tournaments WHERE id = $1',
            [id]
        );

        if (tournament.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Get all matches for this tournament
        const matches = await pool.query(`
            SELECT 
                m.id,
                m.round,
                m.match_number,
                m.player1_id,
                m.player2_id,
                m.winner_id,
                m.bye_match,
                p1.display_name as player1_name,
                p1.profile_picture as player1_picture,
                p2.display_name as player2_name,
                p2.profile_picture as player2_picture,
                w.display_name as winner_name
            FROM tournament_matches m
            LEFT JOIN users p1 ON m.player1_id = p1.id
            LEFT JOIN users p2 ON m.player2_id = p2.id
            LEFT JOIN users w ON m.winner_id = w.id
            WHERE m.tournament_id = $1
            ORDER BY m.round, m.match_number
        `, [id]);

        if (matches.rows.length === 0) {
            return res.json({
                tournament: tournament.rows[0],
                bracket: null,
                message: 'No brackets generated yet'
            });
        }

        // Group matches by round
        const roundsMap = new Map();
        let maxRound = 0;

        matches.rows.forEach(match => {
            if (!roundsMap.has(match.round)) {
                roundsMap.set(match.round, []);
            }
            
            roundsMap.get(match.round).push({
                id: match.id,
                round: match.round,
                matchNumber: match.match_number,
                players: {
                    player1: match.player1_id ? {
                        id: match.player1_id,
                        name: match.player1_name,
                        profilePicture: match.player1_picture
                    } : null,
                    player2: match.player2_id ? {
                        id: match.player2_id,
                        name: match.player2_name,
                        profilePicture: match.player2_picture
                    } : null
                },
                winner: match.winner_id ? {
                    id: match.winner_id,
                    name: match.winner_name
                } : null,
                status: match.bye_match ? 'bye' : match.winner_id ? 'completed' : 'pending',
                isBye: match.bye_match
            });
            
            maxRound = Math.max(maxRound, match.round);
        });

        // Convert to array format
        const rounds = [];
        for (let i = 1; i <= maxRound; i++) {
            const roundMatches = roundsMap.get(i) || [];
            rounds.push({
                roundNumber: i,
                roundName: getRoundName(i, maxRound),
                matches: roundMatches
            });
        }

        res.json({
            tournament: tournament.rows[0],
            metadata: {
                totalRounds: maxRound,
                totalMatches: matches.rows.length,
                bracketSize: Math.pow(2, maxRound)
            },
            rounds: rounds
        });

    } catch (err) {
        console.error('Error fetching bracket structure:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

// Export functions for testing
module.exports.generateSingleEliminationBracket = generateSingleEliminationBracket;
module.exports.saveBracketToDatabase = saveBracketToDatabase;
