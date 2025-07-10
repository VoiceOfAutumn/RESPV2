const pool = require('./db');

async function fixExistingTournamentBrackets() {
    console.log('=== FIXING EXISTING TOURNAMENT BRACKETS ===\n');
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Find tournaments that might have incorrect mappings
        const tournaments = await client.query(`
            SELECT DISTINCT t.id, t.name
            FROM tournaments t
            JOIN tournament_matches tm ON t.id = tm.tournament_id
            WHERE t.status = 'in_progress'
            AND EXISTS (
                SELECT 1 
                FROM tournament_matches tm1 
                JOIN tournament_matches tm2 ON tm1.next_match_id = tm2.id
                WHERE tm1.tournament_id = t.id 
                AND tm1.round = 1 
                AND tm2.round = 2
                GROUP BY tm1.next_match_id
                HAVING COUNT(*) > 1
            )
        `);
        
        console.log(`Found ${tournaments.rows.length} tournaments with potential mapping issues`);
        
        for (const tournament of tournaments.rows) {
            console.log(`\nFixing Tournament: ${tournament.name} (ID: ${tournament.id})`);
            
            // Get all Round 1 and Round 2 matches
            const round1Matches = await client.query(`
                SELECT id, match_number, player1_id, player2_id, winner_id, next_match_id
                FROM tournament_matches 
                WHERE tournament_id = $1 AND round = 1
                ORDER BY match_number
            `, [tournament.id]);
            
            const round2Matches = await client.query(`
                SELECT id, match_number, player1_id, player2_id
                FROM tournament_matches 
                WHERE tournament_id = $1 AND round = 2
                ORDER BY match_number
            `, [tournament.id]);
            
            console.log(`  Round 1 matches: ${round1Matches.rows.length}`);
            console.log(`  Round 2 matches: ${round2Matches.rows.length}`);
            
            // Check if we have a mapping issue
            const nextMatchIds = round1Matches.rows.map(m => m.next_match_id);
            const duplicates = nextMatchIds.filter((id, index) => id && nextMatchIds.indexOf(id) !== index);
            
            if (duplicates.length > 0) {
                console.log(`  Found duplicate next_match_id mappings: ${duplicates}`);
                
                // Fix the mapping
                // Round 1 matches should map to Round 2 matches in order
                for (let i = 0; i < round1Matches.rows.length; i++) {
                    const r1Match = round1Matches.rows[i];
                    const r2MatchIndex = i % round2Matches.rows.length; // Distribute across available R2 matches
                    const r2Match = round2Matches.rows[r2MatchIndex];
                    
                    if (r2Match) {
                        console.log(`  Mapping R1-M${r1Match.match_number} (ID:${r1Match.id}) -> R2-M${r2Match.match_number} (ID:${r2Match.id})`);
                        
                        await client.query(
                            'UPDATE tournament_matches SET next_match_id = $1 WHERE id = $2',
                            [r2Match.id, r1Match.id]
                        );
                        
                        // If the Round 1 match has a winner, make sure they are properly advanced
                        if (r1Match.winner_id) {
                            // Check if the winner is already in the Round 2 match
                            const isAlreadyAdvanced = r2Match.player1_id === r1Match.winner_id || r2Match.player2_id === r1Match.winner_id;
                            
                            if (!isAlreadyAdvanced) {
                                // Find an empty slot and advance the winner
                                if (!r2Match.player1_id) {
                                    console.log(`    Advancing winner ${r1Match.winner_id} to R2-M${r2Match.match_number} player1 slot`);
                                    await client.query(
                                        'UPDATE tournament_matches SET player1_id = $1 WHERE id = $2',
                                        [r1Match.winner_id, r2Match.id]
                                    );
                                    r2Match.player1_id = r1Match.winner_id; // Update local copy
                                } else if (!r2Match.player2_id) {
                                    console.log(`    Advancing winner ${r1Match.winner_id} to R2-M${r2Match.match_number} player2 slot`);
                                    await client.query(
                                        'UPDATE tournament_matches SET player2_id = $1 WHERE id = $2',
                                        [r1Match.winner_id, r2Match.id]
                                    );
                                    r2Match.player2_id = r1Match.winner_id; // Update local copy
                                } else {
                                    console.log(`    WARNING: R2-M${r2Match.match_number} already has both players, cannot advance winner`);
                                }
                            } else {
                                console.log(`    Winner ${r1Match.winner_id} already advanced to R2-M${r2Match.match_number}`);
                            }
                        }
                    }
                }
                
                console.log(`  ✓ Fixed mappings for Tournament ${tournament.id}`);
            } else {
                console.log(`  ✓ No mapping issues found`);
            }
        }
        
        await client.query('COMMIT');
        console.log('\n=== FIX COMPLETED ===');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error fixing tournaments:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

fixExistingTournamentBrackets();
