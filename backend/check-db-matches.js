// Test script to check next_match_id relationships in the database

const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'auth',
    password: 'admin',
    port: 5432,
});

async function checkNextMatchRelationships() {
    try {
        // Get all tournaments with matches
        const tournaments = await pool.query(`
            SELECT t.id, t.name, COUNT(tm.id) as match_count
            FROM tournaments t
            LEFT JOIN tournament_matches tm ON t.id = tm.tournament_id
            GROUP BY t.id, t.name
            HAVING COUNT(tm.id) > 0
            ORDER BY t.id DESC
        `);

        console.log('Tournaments with matches:');
        tournaments.rows.forEach(t => {
            console.log(`  ${t.id}: ${t.name} (${t.match_count} matches)`);
        });

        if (tournaments.rows.length > 0) {
            const tournamentId = tournaments.rows[0].id;
            console.log(`\nChecking matches for tournament ${tournamentId}:`);

            const matches = await pool.query(`
                SELECT 
                    m.id,
                    m.round,
                    m.match_number,
                    m.player1_id,
                    m.player2_id,
                    m.winner_id,
                    m.next_match_id,
                    m.bye_match,
                    p1.display_name as player1_name,
                    p2.display_name as player2_name,
                    w.display_name as winner_name
                FROM tournament_matches m
                LEFT JOIN users p1 ON m.player1_id = p1.id
                LEFT JOIN users p2 ON m.player2_id = p2.id
                LEFT JOIN users w ON m.winner_id = w.id
                WHERE m.tournament_id = $1
                ORDER BY m.round, m.match_number
            `, [tournamentId]);

            console.log('\nMatch details:');
            matches.rows.forEach(match => {
                console.log(`Match ${match.id} (Round ${match.round}, Match ${match.match_number}):`);
                console.log(`  Player1: ${match.player1_name || 'TBD'} (ID: ${match.player1_id})`);
                console.log(`  Player2: ${match.player2_name || 'TBD'} (ID: ${match.player2_id})`);
                console.log(`  Winner: ${match.winner_name || 'TBD'} (ID: ${match.winner_id})`);
                console.log(`  Next Match ID: ${match.next_match_id || 'None'}`);
                console.log(`  BYE: ${match.bye_match}`);
                console.log('');
            });

            // Check next_match_id relationships
            console.log('Next match relationships:');
            const round1Matches = matches.rows.filter(m => m.round === 1);
            for (const match of round1Matches) {
                if (match.next_match_id) {
                    const nextMatch = matches.rows.find(m => m.id === match.next_match_id);
                    if (nextMatch) {
                        console.log(`  Match ${match.id} -> Match ${nextMatch.id} (Round ${nextMatch.round}, Match ${nextMatch.match_number})`);
                    } else {
                        console.log(`  Match ${match.id} -> INVALID next_match_id: ${match.next_match_id}`);
                    }
                } else {
                    console.log(`  Match ${match.id} -> No next match (final?)`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkNextMatchRelationships();
