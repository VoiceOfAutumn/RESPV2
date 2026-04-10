'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PageShell from '../../../components/PageShell';
import { Trophy, Check, Lock, RotateCcw, Send, AlertTriangle } from 'lucide-react';
import { API_BASE_URL, apiRequest } from '../../../../lib/api';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface Player {
  id: number;
  name: string;
  seed: number;
  profilePicture: string | null;
}

interface MatchPrediction {
  matchId: string;
  dbMatchId: number;
  round: number;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  predictedWinner: number | null;
  actualWinner: number | null;
}

interface TournamentInfo {
  id: number;
  name: string;
  status: string;
  format: string;
  image: string | null;
}

interface BracketMatch {
  id: number;
  round: number;
  match_number: number;
  player1_id: number | null;
  player2_id: number | null;
  winner_id: number | null;
  player1_name: string;
  player1_picture: string | null;
  player1_rank: number;
  player2_name: string;
  player2_picture: string | null;
  player2_rank: number;
  winner_name: string | null;
  bye_match: boolean;
  bracket_type: string;
}

/* ═══════════════════════════════════════════
   FORWARD PROPAGATION
   ═══════════════════════════════════════════ */

function propagatePredictions(matches: MatchPrediction[], totalRounds: number): MatchPrediction[] {
  const updated = matches.map(m => ({ ...m }));
  // Keep a copy of the original API-provided players to preserve bye recipients
  const original = matches.map(m => ({ ...m }));

  for (let r = 2; r <= totalRounds; r++) {
    const prevRoundMatches = updated.filter(m => m.round === r - 1).sort((a, b) => a.matchNumber - b.matchNumber);
    const currRoundMatches = updated.filter(m => m.round === r).sort((a, b) => a.matchNumber - b.matchNumber);

    for (let i = 0; i < currRoundMatches.length; i++) {
      const feederA = prevRoundMatches[i * 2];
      const feederB = prevRoundMatches[i * 2 + 1];
      const target = updated.find(m => m.matchId === currRoundMatches[i].matchId)!;
      const originalTarget = original.find(m => m.matchId === target.matchId)!;

      // For each slot: if there's a feeder match, use the predicted winner from it.
      // If there's no feeder match (bye recipient placed directly by API), keep the API player.
      const newP1 = feederA
        ? (feederA.predictedWinner
            ? (feederA.player1?.id === feederA.predictedWinner ? feederA.player1
               : feederA.player2?.id === feederA.predictedWinner ? feederA.player2 : null)
            : null)
        : originalTarget.player1; // No feeder = bye recipient, preserve API data

      const newP2 = feederB
        ? (feederB.predictedWinner
            ? (feederB.player1?.id === feederB.predictedWinner ? feederB.player1
               : feederB.player2?.id === feederB.predictedWinner ? feederB.player2 : null)
            : null)
        : originalTarget.player2; // No feeder = bye recipient, preserve API data

      const p1Changed = target.player1?.id !== newP1?.id;
      const p2Changed = target.player2?.id !== newP2?.id;

      target.player1 = newP1;
      target.player2 = newP2;

      if (p1Changed || p2Changed) {
        if (target.predictedWinner &&
            target.predictedWinner !== newP1?.id &&
            target.predictedWinner !== newP2?.id) {
          target.predictedWinner = null;
        }
      }
    }
  }

  return updated;
}

/* ═══════════════════════════════════════════
   ROUND NAMES
   ═══════════════════════════════════════════ */

function getRoundName(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinal';
  if (fromEnd === 2) return 'Quarterfinal';
  return `Round ${round}`;
}

/* ═══════════════════════════════════════════
   MATCH CARD
   ═══════════════════════════════════════════ */

function PredictionMatchCard({
  match,
  onPredict,
  canPredict,
}: {
  match: MatchPrediction;
  onPredict: (matchId: string, winnerId: number) => void;
  canPredict: boolean;
}) {
  const isPredicted = match.predictedWinner !== null;
  const hasActualWinner = match.actualWinner !== null;

  const renderPlayerRow = (player: Player | null, isPicked: boolean) => {
    if (!player) {
      return (
        <div className="flex justify-between items-center p-2 rounded-md">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-full flex-shrink-0">
              <div className="w-full h-full bg-gray-700/50 rounded-full" />
            </div>
            <span className="text-sm truncate text-gray-500 italic">TBD</span>
          </div>
        </div>
      );
    }

    const isActualWinner = hasActualWinner && match.actualWinner === player.id;
    const isActualLoser = hasActualWinner && match.actualWinner !== player.id;
    const isClickable = canPredict && match.player1 !== null && match.player2 !== null;

    return (
      <button
        onClick={isClickable ? () => onPredict(match.matchId, player.id) : undefined}
        disabled={!isClickable}
        className={`w-full flex justify-between items-center p-2 rounded-md transition-colors text-left ${
          isActualWinner
            ? 'bg-green-500/10'
            : isActualLoser
              ? 'opacity-40'
              : isPicked
                ? 'bg-purple-500/10'
                : isClickable
                  ? 'hover:bg-white/[0.04] cursor-pointer'
                  : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden">
            {player.profilePicture ? (
              <img src={player.profilePicture} alt={player.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className={`w-full h-full rounded-full flex items-center justify-center text-[8px] font-bold ${
                isActualWinner
                  ? 'bg-green-500/30 text-green-300 ring-1 ring-green-500/40'
                  : isPicked
                    ? 'bg-purple-500/30 text-purple-300 ring-1 ring-purple-500/40'
                    : 'bg-gray-700/80 text-gray-400 ring-1 ring-gray-700/50'
              }`}>
                {player.seed}
              </div>
            )}
          </div>
          <span className={`text-sm truncate ${
            isActualWinner
              ? 'font-semibold text-green-400'
              : isActualLoser
                ? 'text-gray-600'
                : isPicked
                  ? 'font-semibold text-purple-400'
                  : 'text-gray-300'
          }`}>
            {player.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          {isActualWinner && <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
          {!hasActualWinner && isPicked && <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
        </div>
      </button>
    );
  };

  return (
    <div className={`bg-neutral-800/50 backdrop-blur rounded-lg border shadow-lg p-4 w-64 transition-colors ${
      hasActualWinner
        ? 'border-green-500/20'
        : isPredicted
          ? 'border-purple-500/20'
          : 'border-gray-700/50 hover:border-gray-600/50'
    }`}>
      <div className="text-center mb-2">
        <div className="text-xs text-gray-500">Match {match.matchNumber}</div>
        {hasActualWinner && isPredicted && (
          <div className={`text-xs ${match.predictedWinner === match.actualWinner ? 'text-green-400' : 'text-red-400'}`}>
            {match.predictedWinner === match.actualWinner ? '✓ Correct' : '✗ Wrong'}
          </div>
        )}
        {!hasActualWinner && isPredicted && (
          <div className="text-xs text-purple-400/70">Predicted</div>
        )}
      </div>

      <div className="space-y-1">
        {renderPlayerRow(match.player1, match.predictedWinner === match.player1?.id)}
        <div className="text-center">
          <span className="text-xs text-gray-600">vs</span>
        </div>
        {renderPlayerRow(match.player2, match.predictedWinner === match.player2?.id)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

export default function TournamentPredictions() {
  const { id } = useParams();
  const [tournament, setTournament] = useState<TournamentInfo | null>(null);
  const [matches, setMatches] = useState<MatchPrediction[]>([]);
  const [totalRounds, setTotalRounds] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'mine' | 'community'>('mine');

  // Load bracket data and existing predictions
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        // Fetch bracket
        const bracketRes = await fetch(`${API_BASE_URL}/tournaments/${id}/bracket`, {
          credentials: 'include',
        });
        if (!bracketRes.ok) throw new Error('Failed to load bracket');
        const bracketData = await bracketRes.json();

        const tournamentInfo: TournamentInfo = {
          id: bracketData.tournament.id,
          name: bracketData.tournament.name,
          status: bracketData.tournament.status,
          format: bracketData.tournament.format,
          image: bracketData.tournament.image,
        };
        setTournament(tournamentInfo);

        // Filter to winners bracket / single elimination matches only (no byes)
        const bracketMatches: BracketMatch[] = bracketData.matches.filter(
          (m: BracketMatch) => !m.bye_match && (m.bracket_type === 'winners' || !m.bracket_type)
        );

        if (bracketMatches.length === 0) {
          setError('Brackets have not been generated yet');
          setLoading(false);
          return;
        }

        // Build player map from ALL matches (not just R1, since bye recipients land in R2+)
        const playerMap = new Map<number, Player>();
        let seedCounter = 1;
        const allMatchesSorted = [...bracketMatches].sort((a, b) => a.round - b.round || a.match_number - b.match_number);
        for (const m of allMatchesSorted) {
          if (m.player1_id && !playerMap.has(m.player1_id)) {
            playerMap.set(m.player1_id, {
              id: m.player1_id,
              name: m.player1_name,
              seed: seedCounter++,
              profilePicture: m.player1_picture,
            });
          }
          if (m.player2_id && !playerMap.has(m.player2_id)) {
            playerMap.set(m.player2_id, {
              id: m.player2_id,
              name: m.player2_name,
              seed: seedCounter++,
              profilePicture: m.player2_picture,
            });
          }
        }

        const maxRound = Math.max(...bracketMatches.map(m => m.round));
        setTotalRounds(maxRound);

        // Build match predictions from bracket data
        const predictionMatches: MatchPrediction[] = bracketMatches.map(m => ({
          matchId: `R${m.round}-M${m.match_number}`,
          dbMatchId: m.id,
          round: m.round,
          matchNumber: m.match_number,
          player1: m.player1_id ? playerMap.get(m.player1_id) ?? null : null,
          player2: m.player2_id ? playerMap.get(m.player2_id) ?? null : null,
          predictedWinner: null,
          actualWinner: m.winner_id,
        }));

        // Check for existing predictions
        try {
          const predRes = await apiRequest(`/predictions/${id}`);
          if (predRes.submitted) {
            setSubmitted(true);
            setSubmittedAt(predRes.submittedAt);

            // Apply saved picks
            for (const pick of predRes.picks) {
              const match = predictionMatches.find(m => m.dbMatchId === pick.match_id);
              if (match) {
                match.predictedWinner = pick.predicted_winner_id;
              }
            }
          }
        } catch {
          // Not logged in or no predictions yet — that's fine
        }

        setMatches(predictionMatches);
      } catch (err: any) {
        setError(err.message || 'Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // Forward-propagated bracket
  const bracket = useMemo(() => {
    if (matches.length === 0 || totalRounds === 0) return matches;
    return propagatePredictions(matches, totalRounds);
  }, [matches, totalRounds]);

  // Grouped by round
  const rounds = useMemo(() => {
    const grouped: Record<number, MatchPrediction[]> = {};
    for (const m of bracket) {
      if (!grouped[m.round]) grouped[m.round] = [];
      grouped[m.round].push(m);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([round, roundMatches]) => ({
        round: Number(round),
        name: getRoundName(Number(round), totalRounds),
        matches: roundMatches.sort((a, b) => a.matchNumber - b.matchNumber),
      }));
  }, [bracket, totalRounds]);

  // Stats
  const totalMatches = bracket.length;
  const predictedCount = bracket.filter(m => m.predictedWinner !== null).length;
  const allPredicted = predictedCount === totalMatches;

  // Champion
  const finalMatch = bracket.find(m => m.round === totalRounds);
  const champion = finalMatch?.predictedWinner
    ? bracket.flatMap(m => [m.player1, m.player2]).find(p => p?.id === finalMatch.predictedWinner) ?? null
    : null;

  // Can show community predictions?
  const canShowCommunity = tournament && (tournament.status === 'in_progress' || tournament.status === 'completed');

  // Predictions window closed: tournament started/completed and user didn't submit
  const predictionsClosed = canShowCommunity && !submitted;

  const handlePredict = useCallback((matchId: string, winnerId: number) => {
    if (submitted || predictionsClosed) return;

    setMatches(prev => {
      const updated = prev.map(m =>
        m.matchId === matchId
          ? { ...m, predictedWinner: m.predictedWinner === winnerId ? null : winnerId }
          : m
      );
      return propagatePredictions(updated, totalRounds);
    });
  }, [submitted, totalRounds]);

  const handleReset = () => {
    if (submitted) return;
    setMatches(prev => prev.map(m => ({ ...m, predictedWinner: null })));
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!allPredicted || submitted || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const picks = bracket.map(m => ({
      match_id: m.dbMatchId,
      predicted_winner_id: m.predictedWinner!,
      round: m.round,
    }));

    try {
      const response = await apiRequest(`/predictions/${id}`, {
        method: 'POST',
        body: JSON.stringify({ picks }),
      });
      setSubmitted(true);
      setSubmittedAt(response.submittedAt);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit predictions');
    } finally {
      setSubmitting(false);
    }
  };

  const canPredict = !submitted && !predictionsClosed;

  // Drag-to-scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeftStart = useRef(0);
  const scrollTopStart = useRef(0);
  const hasMoved = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const tag = (e.target as HTMLElement).closest('a, button, input, select, textarea');
    if (tag) return;
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.pageX;
    startY.current = e.pageY;
    scrollLeftStart.current = scrollRef.current?.scrollLeft ?? 0;
    scrollTopStart.current = scrollRef.current?.scrollTop ?? 0;
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !scrollRef.current) return;
      const dx = e.pageX - startX.current;
      const dy = e.pageY - startY.current;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
      scrollRef.current.scrollLeft = scrollLeftStart.current - dx;
      scrollRef.current.scrollTop = scrollTopStart.current - dy;
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
        <PageShell />
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-16 text-center">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm mt-4">Loading predictions...</p>
        </div>
      </main>
    );
  }

  if (error || !tournament) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
        <PageShell />
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-16 text-center">
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl inline-block">
            <p className="font-semibold">{error || 'Tournament not found'}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />

      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-8">
        {/* ── HEADER ── */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-purple-400 font-semibold mb-1">Predictions</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                {tournament.name} — Predictions
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {predictionsClosed
                  ? 'The prediction window has closed. You did not submit predictions for this tournament.'
                  : submitted
                    ? 'Your predictions are locked in. Results will be scored after the tournament concludes.'
                    : 'Predict who will win each match, then submit to lock in your picks.'}
              </p>
            </div>

            {/* Mode toggle + actions */}
            <div className="flex items-center gap-3">
              {!predictionsClosed && (
                <div className="flex bg-white/[0.04] rounded-lg border border-white/[0.06] p-0.5">
                  <button
                    onClick={() => setMode('mine')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      mode === 'mine'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    My Predictions
                  </button>
                  <button
                    onClick={() => canShowCommunity ? setMode('community') : undefined}
                    disabled={!canShowCommunity}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      mode === 'community'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : !canShowCommunity
                          ? 'text-gray-700 border border-transparent cursor-not-allowed'
                          : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    Community Predictions
                  </button>
                </div>
              )}

              {canPredict && !submitted && (
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-500 hover:text-white hover:bg-white/[0.08] transition-all"
                  title="Reset all predictions"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Closed without submission notice */}
          {predictionsClosed && (
            <div className="mt-4 bg-yellow-500/[0.06] rounded-xl border border-yellow-500/20 p-6 text-center">
              <Lock className="w-8 h-8 text-yellow-500/60 mx-auto mb-2" />
              <p className="text-sm text-yellow-300 font-medium">Prediction window closed</p>
              <p className="text-xs text-gray-500 mt-1">
                The tournament is now {tournament.status === 'completed' ? 'completed' : 'in progress'}. Predictions can no longer be submitted.
              </p>
            </div>
          )}

          {/* Progress bar + champion (only when user can predict or has submitted) */}
          {!predictionsClosed && (
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              {/* Progress */}
              <div className="flex-1 bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Predictions</span>
                  <span className="text-xs font-mono text-gray-400">{predictedCount}/{totalMatches}</span>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      allPredicted ? 'bg-green-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${totalMatches > 0 ? (predictedCount / totalMatches) * 100 : 0}%` }}
                  />
                </div>
                {allPredicted && (
                  <p className="text-[10px] text-green-400 mt-1.5 flex items-center gap-1">
                    <Check className="w-3 h-3" /> All matches predicted!
                  </p>
                )}
              </div>

              {/* Champion pick */}
              <div className={`w-full sm:w-64 rounded-xl border p-4 flex items-center gap-3 transition-all ${
                champion
                  ? 'bg-yellow-500/[0.06] border-yellow-500/20'
                  : 'bg-white/[0.02] border-white/[0.06]'
              }`}>
                <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ${
                  champion ? 'ring-2 ring-yellow-500/40' : 'bg-white/[0.04] flex items-center justify-center'
                }`}>
                  {champion ? (
                    <img
                      src={champion.profilePicture || '/images/default-avatar.png'}
                      alt={champion.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Trophy className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Champion Pick</p>
                  <p className={`text-sm font-bold ${champion ? 'text-yellow-300' : 'text-gray-600'}`}>
                    {champion ? champion.name : 'Not yet picked'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Locked banner */}
          {submitted && !predictionsClosed && (
            <div className="mt-3 bg-purple-500/[0.06] rounded-xl border border-purple-500/20 p-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-purple-300 font-medium">Predictions locked in</p>
                <p className="text-[10px] text-gray-500">
                  Submitted {submittedAt ? new Date(submittedAt).toLocaleString() : ''} — your picks cannot be changed
                </p>
              </div>
            </div>
          )}

          {/* Submit error */}
          {submitError && !predictionsClosed && (
            <div className="mt-3 bg-red-500/[0.06] rounded-xl border border-red-500/20 p-4 text-xs text-red-300">
              {submitError}
            </div>
          )}

          {/* Submit button */}
          {!predictionsClosed && (
            <div className="mt-4 flex items-center gap-4">
              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={!allPredicted || submitting}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                    allPredicted && !submitting
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 cursor-pointer'
                      : 'bg-white/[0.04] text-gray-600 border border-white/[0.06] cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Predictions
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold text-sm">
                  <Check className="w-4 h-4" />
                  Predictions Submitted
                </div>
              )}

              {!allPredicted && !submitted && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <AlertTriangle className="w-4 h-4 text-yellow-500/60" />
                  Predict a winner for every match before submitting
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── BRACKET ── */}
        {!predictionsClosed && (
          <div className="bg-neutral-900/30 rounded-2xl border border-white/[0.06] overflow-hidden">
            <div
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              className="flex gap-8 pb-6 p-6 overflow-x-auto cursor-grab active:cursor-grabbing select-none"
            >
              {rounds.map((round, roundIndex) => {
                const spacingMultiplier = Math.pow(2, roundIndex);
                const matchGap = roundIndex === 0 ? 16 : 16 * spacingMultiplier;

                return (
                  <div key={round.round} className="flex-shrink-0 flex flex-col">
                    {/* Round header */}
                    <div className="text-sm font-medium text-gray-400 mb-4 px-3 py-1 bg-green-500/10 rounded-lg text-center whitespace-nowrap">
                      {round.name}
                    </div>

                    {/* Matches */}
                    <div
                      className="flex flex-col justify-around flex-1"
                      style={{ gap: `${matchGap}px` }}
                    >
                      {round.matches.map((match) => (
                        <div key={match.matchId} className="relative">
                          <PredictionMatchCard
                            match={match}
                            onPredict={handlePredict}
                            canPredict={canPredict}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
