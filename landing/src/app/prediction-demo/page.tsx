'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import PageShell from '../components/PageShell';
import { Trophy, ChevronRight, Check, Lock, BarChart3, RotateCcw, Users, Send, AlertTriangle } from 'lucide-react';
import { API_BASE_URL, apiRequest } from '../../lib/api';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface Player {
  id: number;
  name: string;
  seed: number;
}

interface MatchPrediction {
  matchId: string;          // "R{round}-M{match}"
  dbMatchId?: number;       // actual DB match id (when loaded from real tournament)
  round: number;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  predictedWinner: number | null;
}

/* ═══════════════════════════════════════════
   MOCK DATA — 16-player single elimination
   ═══════════════════════════════════════════ */

const PLAYERS: Player[] = [
  { id: 1,  name: 'PixelKing',    seed: 1 },
  { id: 2,  name: 'ArcadeGhost',  seed: 2 },
  { id: 3,  name: 'NESMaster',    seed: 3 },
  { id: 4,  name: 'SpeedDemon',   seed: 4 },
  { id: 5,  name: 'RetroRival',   seed: 5 },
  { id: 6,  name: 'ClassicHero',  seed: 6 },
  { id: 7,  name: 'BlastBoy',     seed: 7 },
  { id: 8,  name: 'VoxelViper',   seed: 8 },
  { id: 9,  name: 'TurboTina',    seed: 9 },
  { id: 10, name: 'GlitchGuru',   seed: 10 },
  { id: 11, name: 'PixelPunk',    seed: 11 },
  { id: 12, name: 'CoinChaser',   seed: 12 },
  { id: 13, name: 'WarpWolf',     seed: 13 },
  { id: 14, name: 'JoystickJay',  seed: 14 },
  { id: 15, name: 'BitBrawler',   seed: 15 },
  { id: 16, name: 'SaveStateX',   seed: 16 },
];

// Simulated community prediction percentages (shown in "started" mode)
const COMMUNITY_PREDICTIONS: Record<string, Record<number, number>> = {
  'R1-M1':  { 1: 72, 16: 28 },
  'R1-M2':  { 8: 45, 9: 55 },
  'R1-M3':  { 4: 65, 13: 35 },
  'R1-M4':  { 5: 48, 12: 52 },
  'R1-M5':  { 2: 68, 15: 32 },
  'R1-M6':  { 7: 40, 10: 60 },
  'R1-M7':  { 3: 70, 14: 30 },
  'R1-M8':  { 6: 55, 11: 45 },
  'R2-M1':  { 1: 60, 9: 40 },
  'R2-M2':  { 4: 52, 12: 48 },
  'R2-M3':  { 2: 58, 10: 42 },
  'R2-M4':  { 3: 62, 6: 38 },
  'R3-M1':  { 1: 55, 4: 45 },
  'R3-M2':  { 2: 50, 3: 50 },
  'R4-M1':  { 1: 47, 2: 53 },
};

/* ═══════════════════════════════════════════
   BUILD INITIAL BRACKET
   ═══════════════════════════════════════════ */

function buildInitialBracket(): MatchPrediction[] {
  const matches: MatchPrediction[] = [];
  const numRounds = Math.log2(PLAYERS.length);

  // Standard seeding for R1: 1v16, 8v9, 4v13, 5v12, 2v15, 7v10, 3v14, 6v11
  const r1Pairs: [number, number][] = [
    [0, 15], [7, 8], [3, 12], [4, 11],
    [1, 14], [6, 9], [2, 13], [5, 10],
  ];

  // Round 1 — all players known
  for (let i = 0; i < r1Pairs.length; i++) {
    matches.push({
      matchId: `R1-M${i + 1}`,
      round: 1,
      matchNumber: i + 1,
      player1: PLAYERS[r1Pairs[i][0]],
      player2: PLAYERS[r1Pairs[i][1]],
      predictedWinner: null,
    });
  }

  // Rounds 2+ — initially TBD, filled by forward propagation
  for (let r = 2; r <= numRounds; r++) {
    const matchCount = PLAYERS.length / Math.pow(2, r);
    for (let m = 0; m < matchCount; m++) {
      matches.push({
        matchId: `R${r}-M${m + 1}`,
        round: r,
        matchNumber: m + 1,
        player1: null,
        player2: null,
        predictedWinner: null,
      });
    }
  }

  return matches;
}

/* ═══════════════════════════════════════════
   FORWARD PROPAGATION
   ═══════════════════════════════════════════ */

function propagatePredictions(matches: MatchPrediction[]): MatchPrediction[] {
  const updated = matches.map(m => ({ ...m }));
  const numRounds = Math.log2(PLAYERS.length);

  for (let r = 2; r <= numRounds; r++) {
    const prevRoundMatches = updated.filter(m => m.round === r - 1);
    const currRoundMatches = updated.filter(m => m.round === r);

    for (let i = 0; i < currRoundMatches.length; i++) {
      const feederA = prevRoundMatches[i * 2];
      const feederB = prevRoundMatches[i * 2 + 1];

      // Forward propagate: winner of feeder becomes player in next round
      const newP1 = feederA?.predictedWinner
        ? (feederA.player1?.id === feederA.predictedWinner ? feederA.player1
           : feederA.player2?.id === feederA.predictedWinner ? feederA.player2 : null)
        : null;

      const newP2 = feederB?.predictedWinner
        ? (feederB.player1?.id === feederB.predictedWinner ? feederB.player1
           : feederB.player2?.id === feederB.predictedWinner ? feederB.player2 : null)
        : null;

      const target = updated.find(m => m.matchId === currRoundMatches[i].matchId)!;

      // If a forwarded player changed, reset prediction for this match
      const p1Changed = target.player1?.id !== newP1?.id;
      const p2Changed = target.player2?.id !== newP2?.id;

      target.player1 = newP1;
      target.player2 = newP2;

      if (p1Changed || p2Changed) {
        // If the predicted winner is no longer in this match, clear it
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
   MATCH CARD — matches SingleEliminationBracket design
   ═══════════════════════════════════════════ */

function PredictionMatchCard({
  match,
  onPredict,
  canPredict,
  showCommunity,
  totalRounds,
}: {
  match: MatchPrediction;
  onPredict: (matchId: string, winnerId: number) => void;
  canPredict: boolean;
  showCommunity: boolean;
  totalRounds: number;
}) {
  const communityData = COMMUNITY_PREDICTIONS[match.matchId];
  const isPredicted = match.predictedWinner !== null;

  const renderPlayerRow = (player: Player | null, isPicked: boolean, communityPct?: number) => {
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

    const isClickable = canPredict && match.player1 !== null && match.player2 !== null;

    return (
      <button
        onClick={isClickable ? () => onPredict(match.matchId, player.id) : undefined}
        disabled={!isClickable}
        className={`w-full flex justify-between items-center p-2 rounded-md transition-colors text-left ${
          isPicked
            ? 'bg-purple-500/10'
            : isClickable
              ? 'hover:bg-white/[0.04] cursor-pointer'
              : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-full flex-shrink-0">
            <div className={`w-full h-full rounded-full flex items-center justify-center text-[8px] font-bold ${
              isPicked
                ? 'bg-purple-500/30 text-purple-300 ring-1 ring-purple-500/40'
                : 'bg-gray-700/80 text-gray-400 ring-1 ring-gray-700/50'
            }`}>
              {player.seed}
            </div>
          </div>
          <span className={`text-sm truncate ${
            isPicked ? 'font-semibold text-purple-400' : 'text-gray-300'
          }`}>
            {player.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          {showCommunity && communityPct !== undefined && (
            <span className={`text-[10px] font-mono tabular-nums ${
              communityPct >= 60 ? 'text-green-400' : communityPct >= 40 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {communityPct}%
            </span>
          )}
          {isPicked && <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
        </div>
      </button>
    );
  };

  return (
    <div className={`bg-neutral-800/50 backdrop-blur rounded-lg border shadow-lg p-4 w-64 transition-colors ${
      isPredicted ? 'border-purple-500/20' : 'border-gray-700/50 hover:border-gray-600/50'
    }`}>
      {/* Match header */}
      <div className="text-center mb-2">
        <div className="text-xs text-gray-500">Match {match.matchNumber}</div>
        {isPredicted && (
          <div className="text-xs text-purple-400/70">Predicted</div>
        )}
      </div>

      {/* Player rows */}
      <div className="space-y-1">
        {renderPlayerRow(
          match.player1,
          match.predictedWinner === match.player1?.id,
          communityData && match.player1 ? communityData[match.player1.id] : undefined
        )}
        <div className="text-center">
          <span className="text-xs text-gray-600">vs</span>
        </div>
        {renderPlayerRow(
          match.player2,
          match.predictedWinner === match.player2?.id,
          communityData && match.player2 ? communityData[match.player2.id] : undefined
        )}
      </div>

      {/* Community prediction bar (started mode) */}
      {showCommunity && communityData && match.player1 && match.player2 && (
        <div className="mt-3 px-1">
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden flex">
            <div
              className="h-full rounded-l-full bg-purple-500/60 transition-all duration-500"
              style={{ width: `${communityData[match.player1.id] ?? 50}%` }}
            />
            <div
              className="h-full rounded-r-full bg-gray-500/40 transition-all duration-500"
              style={{ width: `${communityData[match.player2.id] ?? 50}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

export default function PredictionDemo() {
  const [mode, setMode] = useState<'predicting' | 'started'>('predicting');
  const [matches, setMatches] = useState<MatchPrediction[]>(() => buildInitialBracket());
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string | null>(null);

  const totalRounds = Math.log2(PLAYERS.length);

  // Forward-propagated bracket
  const bracket = useMemo(() => propagatePredictions(matches), [matches]);

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

  // Predicted champion
  const finalMatch = bracket.find(m => m.round === totalRounds);
  const champion = finalMatch?.predictedWinner
    ? PLAYERS.find(p => p.id === finalMatch.predictedWinner)
    : null;

  // Scoring breakdown
  const scoringBreakdown = useMemo(() => {
    const breakdown: { round: number; name: string; pointsPerCorrect: number; matchCount: number; maxPoints: number }[] = [];
    for (let r = 1; r <= totalRounds; r++) {
      const matchCount = bracket.filter(m => m.round === r).length;
      const pointsPerCorrect = Math.pow(2, r - 1);
      breakdown.push({
        round: r,
        name: getRoundName(r, totalRounds),
        pointsPerCorrect,
        matchCount,
        maxPoints: pointsPerCorrect * matchCount,
      });
    }
    return breakdown;
  }, [bracket, totalRounds]);

  const maxBasePoints = scoringBreakdown.reduce((sum, r) => sum + r.maxPoints, 0);
  const maxWithChampionBonus = maxBasePoints * 2;

  const handlePredict = useCallback((matchId: string, winnerId: number) => {
    if (mode === 'started' || submitted) return;

    setMatches(prev => {
      const updated = prev.map(m =>
        m.matchId === matchId
          ? { ...m, predictedWinner: m.predictedWinner === winnerId ? null : winnerId }
          : m
      );
      return propagatePredictions(updated);
    });
  }, [mode]);

  const handleReset = () => {
    if (submitted) return;
    setMatches(buildInitialBracket());
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!allPredicted || submitted || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setApiStatus(null);

    // Build picks array from bracket
    const picks = bracket.map(m => ({
      match_id: m.dbMatchId ?? 0, // 0 for demo mode
      predicted_winner_id: m.predictedWinner!,
      round: m.round,
    }));

    // Try to submit to real API (tournament ID 1 for testing)
    try {
      const response = await apiRequest('/predictions/1', {
        method: 'POST',
        body: JSON.stringify({ picks }),
      });
      setApiStatus(`✅ API: Predictions saved to database (ID: ${response.predictionId})`);
    } catch (err: any) {
      // API call failed — still lock locally for demo purposes
      setApiStatus(`⚠️ API: ${err.message || 'Not connected'} — predictions locked locally for demo`);
    }

    setSubmitted(true);
    setSubmittedAt(new Date().toISOString());
    setSubmitting(false);
  };

  const canPredict = mode === 'predicting' && !submitted;

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />

      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-8">
        {/* ── HEADER ── */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-purple-400 font-semibold mb-1">Prediction Demo</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                Spring Showdown 2026 — Predictions
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {submitted
                  ? 'Your predictions are locked in. Results will be scored after the tournament concludes.'
                  : mode === 'predicting'
                    ? 'Brackets generated. Predict who will win each match, then submit to lock in your picks.'
                    : 'Tournament has started. Community prediction percentages are now visible.'}
              </p>
            </div>

            {/* Mode toggle + actions */}
            <div className="flex items-center gap-3">
              <div className="flex bg-white/[0.04] rounded-lg border border-white/[0.06] p-0.5">
                <button
                  onClick={() => setMode('predicting')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === 'predicting'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  {submitted ? 'My Picks' : 'Predicting'}
                </button>
                <button
                  onClick={() => setMode('started')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === 'started'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  Started
                </button>
              </div>

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

          {/* Progress bar + champion */}
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
                  style={{ width: `${(predictedCount / totalMatches) * 100}%` }}
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
                    src="/images/default-avatar.png"
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

          {/* Community stats bar (started mode) */}
          {mode === 'started' && (
            <div className="mt-3 bg-green-500/[0.06] rounded-xl border border-green-500/20 p-4 flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-300 font-medium">Community predictions are now visible</p>
                <p className="text-[10px] text-gray-500">
                  <Users className="w-3 h-3 inline mr-0.5" />
                  247 players made predictions for this tournament
                </p>
              </div>
            </div>
          )}

          {/* Locked banner (after submission) */}
          {submitted && (
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

          {/* API status message */}
          {apiStatus && (
            <div className={`mt-3 rounded-xl border p-4 text-xs ${
              apiStatus.startsWith('✅')
                ? 'bg-green-500/[0.06] border-green-500/20 text-green-300'
                : 'bg-yellow-500/[0.06] border-yellow-500/20 text-yellow-300'
            }`}>
              {apiStatus}
            </div>
          )}

          {/* Submit button + scoring breakdown */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            {/* Submit button */}
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

            {/* Scoring info */}
            <div className="flex-1 flex items-center justify-end">
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                {scoringBreakdown.map((r) => (
                  <span key={r.round} className="px-2 py-1 rounded bg-white/[0.02] border border-white/[0.04]">
                    {r.name}: <span className="text-purple-400 font-bold">{r.pointsPerCorrect}pt</span>
                  </span>
                ))}
                <span className="px-2 py-1 rounded bg-yellow-500/[0.06] border border-yellow-500/20">
                  Champion bonus: <span className="text-yellow-400 font-bold">2x total</span>
                </span>
              </div>
            </div>
          </div>

          {/* Scoring breakdown card (after submission) */}
          {submitted && (
            <div className="mt-4 bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Scoring Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {scoringBreakdown.map((r) => (
                  <div key={r.round} className="bg-white/[0.02] rounded-lg border border-white/[0.04] p-3 text-center">
                    <p className="text-[10px] text-gray-500 uppercase">{r.name}</p>
                    <p className="text-lg font-bold text-purple-400">{r.pointsPerCorrect}<span className="text-xs text-gray-500">pt</span></p>
                    <p className="text-[10px] text-gray-600">{r.matchCount} match{r.matchCount > 1 ? 'es' : ''}</p>
                    <p className="text-[10px] text-gray-500">Max: {r.maxPoints}pt</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-500">Maximum base points: <span className="text-white font-bold">{maxBasePoints}</span></span>
                <span className="text-gray-500">With champion bonus: <span className="text-yellow-400 font-bold">{maxWithChampionBonus}</span></span>
              </div>
            </div>
          )}
        </div>

        {/* ── BRACKET ── */}
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
                          showCommunity={mode === 'started'}
                          totalRounds={totalRounds}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </main>
  );
}
