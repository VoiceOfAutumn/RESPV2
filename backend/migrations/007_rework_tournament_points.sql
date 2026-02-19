-- Migration: Rework tournament point calculation
-- Replaces all previous point logic with a simple cumulative-win system.
--
-- Points per win (1.5× scaling, rounded up):
--   Win 1 = 1,  Win 2 = 2,  Win 3 = 3,  Win 4 = 5,
--   Win 5 = 8,  Win 6 = 12, Win 7 = 18, Win 8 = 27 …
-- Tournament winner receives a 1.25× bonus on their total (rounded up).
--
-- When a result is changed the affected user's points are fully
-- recalculated so they always stay consistent.

-- ============================================================
-- Step 1: Drop existing trigger + functions
-- ============================================================
DROP TRIGGER IF EXISTS calculate_match_points ON tournament_matches;
DROP FUNCTION IF EXISTS calculate_tournament_points() CASCADE;
DROP FUNCTION IF EXISTS recalculate_user_tournament_points(INTEGER, INTEGER) CASCADE;

-- ============================================================
-- Step 2: Helper – full recalculate for one user in one tournament
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_user_tournament_points(
    p_tournament_id INTEGER,
    p_user_id INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_match        RECORD;
    v_win_number   INTEGER := 0;
    v_match_points INTEGER;
    v_prev_points  INTEGER := 0;
    v_total_points INTEGER := 0;
    v_is_winner    BOOLEAN := FALSE;
    v_bonus        INTEGER;
BEGIN
    -- Wipe this user's point rows for the tournament
    DELETE FROM tournament_points
    WHERE tournament_id = p_tournament_id
      AND user_id = p_user_id;

    -- Walk every match this user won, ordered by round (including byes
    -- so the multiplier advances, but byes award 0 actual points)
    FOR v_match IN
        SELECT id, round, match_number, next_match_id, bye_match
        FROM tournament_matches
        WHERE tournament_id = p_tournament_id
          AND winner_id = p_user_id
        ORDER BY round, match_number
    LOOP
        v_win_number := v_win_number + 1;

        -- 1st win = 1, each next = ceil(previous × 1.5)
        IF v_win_number = 1 THEN
            v_match_points := 1;
        ELSE
            v_match_points := CEIL(v_prev_points * 1.5);
        END IF;

        v_prev_points  := v_match_points;

        -- Bye matches advance the multiplier but don't award points
        IF v_match.bye_match = false THEN
            v_total_points := v_total_points + v_match_points;

            -- Final match (no next match) means this user won the tournament
            IF v_match.next_match_id IS NULL THEN
                v_is_winner := TRUE;
            END IF;

            INSERT INTO tournament_points
                (tournament_id, user_id, points, points_detail)
            VALUES (
                p_tournament_id,
                p_user_id,
                v_match_points,
                jsonb_build_object(
                    'match_id',     v_match.id,
                    'win_number',   v_win_number,
                    'match_points', v_match_points,
                    'reason',       'Match win #' || v_win_number
                )
            );
        END IF;
    END LOOP;

    -- Tournament-winner bonus: ceil(total × 1.25) - total
    IF v_is_winner AND v_total_points > 0 THEN
        v_bonus := CEIL(v_total_points * 1.25) - v_total_points;
        IF v_bonus > 0 THEN
            INSERT INTO tournament_points
                (tournament_id, user_id, points, points_detail)
            VALUES (
                p_tournament_id,
                p_user_id,
                v_bonus,
                jsonb_build_object(
                    'type',         'winner_bonus',
                    'multiplier',   1.25,
                    'base_total',   v_total_points,
                    'bonus_points', v_bonus,
                    'final_total',  v_total_points + v_bonus,
                    'reason',       'Tournament winner bonus (1.25x)'
                )
            );
        END IF;
    END IF;

    -- Refresh the user's lifetime total across ALL tournaments
    UPDATE users
    SET points = (
        SELECT COALESCE(SUM(points), 0)
        FROM tournament_points
        WHERE user_id = p_user_id
    )
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Step 3: Trigger function – fires on every match UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_tournament_points()
RETURNS TRIGGER AS $$
DECLARE
    v_old_winner_id INTEGER;
    v_new_winner_id INTEGER;
BEGIN
    v_old_winner_id := OLD.winner_id;
    v_new_winner_id := NEW.winner_id;

    -- Skip bye matches
    IF NEW.bye_match = true THEN
        RETURN NEW;
    END IF;

    -- Nothing to do if winner hasn't changed
    IF v_new_winner_id IS NOT DISTINCT FROM v_old_winner_id THEN
        RETURN NEW;
    END IF;

    -- Recalculate for old winner (their win sequence shifts)
    IF v_old_winner_id IS NOT NULL THEN
        PERFORM recalculate_user_tournament_points(NEW.tournament_id, v_old_winner_id);
    END IF;

    -- Recalculate for new winner
    IF v_new_winner_id IS NOT NULL THEN
        PERFORM recalculate_user_tournament_points(NEW.tournament_id, v_new_winner_id);
    END IF;

    -- Update tournament.winner_id when the final match result changes
    IF NEW.next_match_id IS NULL THEN
        UPDATE tournaments
        SET winner_id = v_new_winner_id
        WHERE id = NEW.tournament_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Step 5: Re-create the trigger
-- ============================================================
CREATE TRIGGER calculate_match_points
    AFTER UPDATE ON tournament_matches
    FOR EACH ROW
    EXECUTE FUNCTION calculate_tournament_points();
