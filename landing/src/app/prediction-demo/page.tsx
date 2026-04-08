'use client';

import React, { useState, useMemo, useCallback } from 'react';
import PageShell from '../components/PageShell';
import { Trophy, ChevronRight, Check, Lock, BarChart3, RotateCcw, Users } from 'lucide-react';

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
  round: number;
  matchNumber: number;
  player1: Player | null;   // null = TBD (depends on prior prediction)
  player2: Player | null;
  predictedWinner: number | null; // player id
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
   PLAYER SLOT COMPONENT
   ═══════════════════════════════════════════ */

function PlayerSlot({
  player,
  isWinner,
  canSelect,
  onSelect,
  communityPct,
  showCommunity,
}: {
  player: Player | null;
  isWinner: boolean;
  canSelect: boolean;
  onSelect: () => void;
  communityPct?: number;
  showCommunity: boolean;
}) {
  if (!player) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-dashed border-white/[0.06]">
        <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700/50" />
        <span className="text-xs text-gray-600 italic">TBD</span>
      </div>
    );
  }

  return (
    <button
      onClick={canSelect ? onSelect : undefined}
      disabled={!canSelect}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all text-left group relative ${
        isWinner
          ? 'bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20'
          : canSelect
            ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-purple-500/20 cursor-pointer'
            : 'bg-white/[0.02] border-white/[0.06] opacity-70'
      }`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
        isWinner ? 'bg-purple-500/30 text-purple-300 ring-1 ring-purple-500/40' : 'bg-gray-700 text-gray-400'
      }`}>
        {player.seed}
      </div>
      <span className={`text-sm font-medium flex-1 truncate ${
        isWinner ? 'text-purple-300' : 'text-gray-300'
      }`}>
        {player.name}
      </span>
      {isWinner && (
        <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
      )}
      {showCommunity && communityPct !== undefined && (
        <span className={`text-[10px] font-mono flex-shrink-0 ${
          communityPct >= 60 ? 'text-green-400' : communityPct >= 40 ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {communityPct}%
        </span>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════
   MATCH CARD COMPONENT
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
  const isFinal = match.round === totalRounds;
  const isPredicted = match.predictedWinner !== null;

  return (
    <div className={`w-64 rounded-lg border shadow-lg p-3 transition-all ${
      isFinal
        ? isPredicted
          ? 'bg-yellow-500/[0.06] border-yellow-500/20 backdrop-blur'
          : 'bg-neutral-800/50 border-yellow-500/10 backdrop-blur'
        : isPredicted
          ? 'bg-neutral-800/50 border-purple-500/20 backdrop-blur'
          : 'bg-neutral-800/50 border-white/[0.06] backdrop-blur'
    }`}>
      {/* Match label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-600 font-medium">
          Match {match.matchNumber}
        </span>
        {isPredicted && (
          <span className="text-[10px] text-purple-400 font-medium flex items-center gap-0.5">
            <Check className="w-2.5 h-2.5" /> Predicted
          </span>
        )}
      </div>

      {/* Players */}
      <div className="space-y-1.5">
        <PlayerSlot
          player={match.player1}
          isWinner={match.predictedWinner === match.player1?.id}
          canSelect={canPredict && match.player1 !== null && match.player2 !== null}
          onSelect={() => match.player1 && onPredict(match.matchId, match.player1.id)}
          communityPct={communityData && match.player1 ? communityData[match.player1.id] : undefined}
          showCommunity={showCommunity}
        />
        <div className="text-center">
          <span className="text-[9px] text-gray-700 uppercase tracking-widest">vs</span>
        </div>
        <PlayerSlot
          player={match.player2}
          isWinner={match.predictedWinner === match.player2?.id}
          canSelect={canPredict && match.player1 !== null && match.player2 !== null}
          onSelect={() => match.player2 && onPredict(match.matchId, match.player2.id)}
          communityPct={communityData && match.player2 ? communityData[match.player2.id] : undefined}
          showCommunity={showCommunity}
        />
      </div>

      {/* Community bar (started mode) */}
      {showCommunity && communityData && match.player1 && match.player2 && (
        <div className="mt-2.5">
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
          <div className="flex justify-between mt-0.5">
            <span className="text-[8px] text-gray-600">{communityData[match.player1.id] ?? 50}%</span>
            <span className="text-[8px] text-gray-600">{communityData[match.player2.id] ?? 50}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CONNECTOR LINES
   ═══════════════════════════════════════════ */

function ConnectorLines({ roundIndex, matchCount, matchHeight, gap }: {
  roundIndex: number;
  matchCount: number;
  matchHeight: number;
  gap: number;
}) {
  const lines = [];
  for (let i = 0; i < matchCount; i += 2) {
    const topY = i * (matchHeight + gap) + matchHeight / 2;
    const bottomY = (i + 1) * (matchHeight + gap) + matchHeight / 2;
    const midY = (topY + bottomY) / 2;

    lines.push(
      <g key={i}>
        {/* Horizontal from top match */}
        <line x1="0" y1={topY} x2="20" y2={topY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        {/* Vertical connecting top to bottom */}
        <line x1="20" y1={topY} x2="20" y2={bottomY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        {/* Horizontal from bottom match */}
        <line x1="0" y1={bottomY} x2="20" y2={bottomY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        {/* Horizontal to next round */}
        <line x1="20" y1={midY} x2="48" y2={midY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      </g>
    );
  }

  const totalHeight = matchCount * matchHeight + (matchCount - 1) * gap;

  return (
    <svg className="flex-shrink-0" width="48" height={totalHeight} style={{ minWidth: 48 }}>
      {lines}
    </svg>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

export default function PredictionDemo() {
  const [mode, setMode] = useState<'predicting' | 'started'>('predicting');
  const [matches, setMatches] = useState<MatchPrediction[]>(() => buildInitialBracket());

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

  const handlePredict = useCallback((matchId: string, winnerId: number) => {
    if (mode === 'started') return;

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
    setMatches(buildInitialBracket());
  };

  const canPredict = mode === 'predicting';

  // Match card height estimate for connectors
  const MATCH_H = 140;
  const BASE_GAP = 16;

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
                {mode === 'predicting'
                  ? 'Brackets generated. Predict who will win each match before the tournament starts.'
                  : 'Tournament has started. Community prediction percentages are now visible.'}
              </p>
            </div>

            {/* Mode toggle + stats */}
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
                  Predicting
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

              {canPredict && (
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                champion ? 'bg-yellow-500/20' : 'bg-white/[0.04]'
              }`}>
                <Trophy className={`w-5 h-5 ${champion ? 'text-yellow-400' : 'text-gray-600'}`} />
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
        </div>

        {/* ── BRACKET ── */}
        <div className="bg-neutral-900/30 rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto p-6" style={{ cursor: 'grab' }}>
            <div className="flex items-start gap-0" style={{ minWidth: 'max-content' }}>
              {rounds.map((round, roundIndex) => {
                const gap = BASE_GAP * Math.pow(2, roundIndex);
                const matchesInRound = round.matches.length;

                return (
                  <React.Fragment key={round.round}>
                    <div className="flex flex-col flex-shrink-0">
                      {/* Round header */}
                      <div className={`text-center mb-4 px-3 py-1.5 rounded-lg mx-auto ${
                        round.round === totalRounds
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        <span className="text-xs font-semibold">{round.name}</span>
                      </div>

                      {/* Match cards */}
                      <div
                        className="flex flex-col"
                        style={{
                          justifyContent: roundIndex === 0 ? 'flex-start' : 'space-around',
                          gap: `${gap}px`,
                          minHeight: roundIndex === 0
                            ? undefined
                            : `${rounds[0].matches.length * (MATCH_H + BASE_GAP) - BASE_GAP}px`,
                        }}
                      >
                        {round.matches.map((match) => (
                          <PredictionMatchCard
                            key={match.matchId}
                            match={match}
                            onPredict={handlePredict}
                            canPredict={canPredict}
                            showCommunity={mode === 'started'}
                            totalRounds={totalRounds}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Connector lines between rounds */}
                    {roundIndex < rounds.length - 1 && (
                      <div
                        className="flex-shrink-0 flex items-start"
                        style={{
                          paddingTop: `${40 + MATCH_H / 2}px`,
                          minHeight: roundIndex === 0
                            ? undefined
                            : `${rounds[0].matches.length * (MATCH_H + BASE_GAP)}px`,
                        }}
                      >
                        <ConnectorLines
                          roundIndex={roundIndex}
                          matchCount={matchesInRound}
                          matchHeight={MATCH_H}
                          gap={gap}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── INFO CARD ── */}
        <div className="mt-6 bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">How predictions work</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-purple-400">1</span>
              </div>
              <div>
                <p className="text-xs font-medium text-white">Pick winners</p>
                <p className="text-[10px] text-gray-500">Click on who you think will win each match, round by round.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-purple-400">2</span>
              </div>
              <div>
                <p className="text-xs font-medium text-white">Forward propagation</p>
                <p className="text-[10px] text-gray-500">Your picks automatically advance winners into the next round.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-purple-400">3</span>
              </div>
              <div>
                <p className="text-xs font-medium text-white">Community odds</p>
                <p className="text-[10px] text-gray-500">Once the tournament starts, see what % of players predicted each winner.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
