const pool = require('./db');

async function checkDatabaseMapping() {
    console.log('=== CHECKING DATABASE ADVANCEMENT MAPPING ===\n');
    
    try {
        // Check all tournaments and their matches
        const tournaments = await pool.query(`
            SELECT id, name, status 
            FROM tournaments 
            WHERE status = 'in_progress' 
            ORDER BY created_at DESC 
            LIMIT 3
        `);
        
        if (tournaments.rows.length === 0) {
            console.log('No tournaments in progress found');
            return;
        }
        
        for (const tournament of tournaments.rows) {
            console.log(`\nTournament: ${tournament.name} (ID: ${tournament.id})`);
            
            // Get all matches for this tournament
            const matches = await pool.query(`
                SELECT 
                    id, round, match_number, 
                    player1_id, player2_id, winner_id, 
                    next_match_id, bye_match,
                    (SELECT display_name FROM users WHERE id = player1_id) as player1_name,
                    (SELECT display_name FROM users WHERE id = player2_id) as player2_name,
                    (SELECT display_name FROM users WHERE id = winner_id) as winner_name
                FROM tournament_matches 
                WHERE tournament_id = $1 
                ORDER BY round, match_number
            `, [tournament.id]);
            
            console.log(`\nMatches (${matches.rows.length} total):`);
            
            // Group by round
            const roundGroups = {};
            matches.rows.forEach(match => {
                if (!roundGroups[match.round]) {
                    roundGroups[match.round] = [];
                }
                roundGroups[match.round].push(match);
            });
            
            // Display each round
            Object.keys(roundGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(round => {
                console.log(`\n  Round ${round}:`);
                roundGroups[round].forEach(match => {
                    const p1 = match.player1_name || `ID:${match.player1_id}` || 'TBD';
                    const p2 = match.player2_name || `ID:${match.player2_id}` || 'TBD';
                    const winner = match.winner_name || (match.winner_id ? `ID:${match.winner_id}` : 'No winner');
                    
                    console.log(`    Match ${match.id} (R${match.round}-M${match.match_number}): ${p1} vs ${p2}`);
                    console.log(`      Winner: ${winner}`);
                    console.log(`      Next Match ID: ${match.next_match_id || 'None'}`);
                    console.log(`      BYE Match: ${match.bye_match}`);
                    
                    // If this is Round 1 and has a next_match_id, verify the mapping
                    if (match.round === 1 && match.next_match_id) {
                        const nextMatch = matches.rows.find(m => m.id === match.next_match_id);
                        if (nextMatch) {
                            console.log(`      → Advances to: R${nextMatch.round}-M${nextMatch.match_number}`);
                            
                            // Check if the winner has been properly advanced
                            if (match.winner_id) {
                                const isAdvanced = nextMatch.player1_id === match.winner_id || nextMatch.player2_id === match.winner_id;
                                console.log(`      → Winner advanced: ${isAdvanced ? '✓ YES' : '✗ NO'}`);
                                
                                if (isAdvanced) {
                                    const slot = nextMatch.player1_id === match.winner_id ? 'player1' : 'player2';
                                    console.log(`      → Slot filled: ${slot}`);
                                }
                            }
                        } else {
                            console.log(`      → ERROR: Next match ${match.next_match_id} not found!`);
                        }
                    }
                });
            });
            
            // Check for any advancement issues
            console.log('\n=== ADVANCEMENT VERIFICATION ===');
            const round1Matches = roundGroups['1'] || [];
            const round2Matches = roundGroups['2'] || [];
            
            let advancementIssues = 0;
            
            round1Matches.forEach(r1Match => {
                if (r1Match.winner_id && r1Match.next_match_id) {
                    const nextMatch = matches.rows.find(m => m.id === r1Match.next_match_id);
                    if (nextMatch) {
                        const isAdvanced = nextMatch.player1_id === r1Match.winner_id || nextMatch.player2_id === r1Match.winner_id;
                        if (!isAdvanced) {
                            console.log(`✗ ISSUE: R${r1Match.round}-M${r1Match.match_number} winner (ID:${r1Match.winner_id}) not advanced to R${nextMatch.round}-M${nextMatch.match_number}`);
                            console.log(`   Next match state: P1=${nextMatch.player1_id}, P2=${nextMatch.player2_id}`);
                            advancementIssues++;
                        } else {
                            console.log(`✓ OK: R${r1Match.round}-M${r1Match.match_number} winner advanced correctly`);
                        }
                    }
                }
            });
            
            console.log(`\nAdvancement Issues Found: ${advancementIssues}`);
        }
        
    } catch (error) {
        console.error('Error checking database mapping:', error);
    } finally {
        await pool.end();
    }
}

checkDatabaseMapping();
