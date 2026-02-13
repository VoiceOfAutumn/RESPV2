'use client';

import React, { useMemo, useState } from 'react';

// ==================== TYPES ====================

interface Player {
  id: number;
  name: string;
  profilePicture?: string | null;
}

interface BracketMatch {
  id: number;
  round: number;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  player1Score: number | null;
  player2Score: number | null;
  winner: Player | null;
  isBye: boolean;
  nextMatchId: number | null;
  nextMatchSlot: number | null;
}

interface Round {
  roundNumber: number;
  name: string;
  matches: BracketMatch[];
}

interface SingleEliminationBracketProps {
  matches: any[];          // Raw backend match data
  isStaff?: boolean;
  onMatchUpdate?: (matchId: number, player1Score: number, player2Score: number) => Promise<void>;
  tournamentName?: string;
  className?: string;
}

// ==================== SCORE INPUT ====================

function ScoreInput({ match, onMatchUpdate }: {
  match: BracketMatch;
  onMatchUpdate: (matchId: number, p1Score: number, p2Score: number) => Promise<void>;
}) {
  const [p1Score, setP1Score] = useState<string>(match.player1Score?.toString() ?? '');
  const [p2Score, setP2Score] = useState<string>(match.player2Score?.toString() ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;

    const s1 = parseInt(p1Score) || 0;
    const s2 = parseInt(p2Score) || 0;

    if (s1 < 0 || s2 < 0) {
      alert('Scores cannot be negative');
      return;
    }

    if (s1 === s2) {
      if (!confirm('Scores are tied — there must be a winner. Are you sure?')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      await onMatchUpdate(match.id, s1, s2);
    } catch (err) {
      console.error('Error updating match:', err);
      alert('Failed to update match. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <div className="text-xs text-blue-400 mb-2 font-medium">Report Score</div>
      <div className="flex gap-2 items-end">
        <div className="flex flex-col flex-1">
          <span className="text-xs text-gray-400 mb-1 truncate">{match.player1?.name ?? 'TBD'}</span>
          <input
            type="number"
            min="0"
            value={p1Score}
            onChange={(e) => setP1Score(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full px-2 py-1 text-sm bg-gray-700 rounded border border-gray-600 focus:border-blue-400 focus:outline-none text-center"
            disabled={submitting}
          />
        </div>
        <span className="text-xs text-gray-500 pb-1">vs</span>
        <div className="flex flex-col flex-1">
          <span className="text-xs text-gray-400 mb-1 truncate">{match.player2?.name ?? 'TBD'}</span>
          <input
            type="number"
            min="0"
            value={p2Score}
            onChange={(e) => setP2Score(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full px-2 py-1 text-sm bg-gray-700 rounded border border-gray-600 focus:border-blue-400 focus:outline-none text-center"
            disabled={submitting}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {submitting ? '...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ==================== MATCH CARD ====================

function MatchCard({ match, isStaff, onMatchUpdate, hasLiveData }: {
  match: BracketMatch;
  isStaff: boolean;
  onMatchUpdate?: (matchId: number, p1Score: number, p2Score: number) => Promise<void>;
  hasLiveData: boolean;
}) {
  const hasScores = match.player1Score !== null || match.player2Score !== null;

  const renderPlayerRow = (player: Player | null, score: number | null, isWinner: boolean) => (
    <div className={`flex justify-between items-center p-2 rounded-md transition-colors ${
      isWinner ? 'bg-green-500/10' : ''
    }`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-6 h-6 rounded-full flex-shrink-0">
          {player ? (
            <img
              src={player.profilePicture || '/images/default-avatar.png'}
              alt={player.name}
              className="w-full h-full rounded-full object-cover ring-1 ring-gray-700/50"
            />
          ) : (
            <div className="w-full h-full bg-gray-700/50 rounded-full" />
          )}
        </div>
        <span className={`text-sm truncate ${
          isWinner ? 'font-semibold text-green-400' : player ? 'text-gray-300' : 'text-gray-500 italic'
        }`}>
          {player?.name || 'TBD'}
        </span>
      </div>
      <div className="text-sm font-medium text-gray-400 ml-2 tabular-nums">
        {hasScores ? (score ?? '-') : ''}
      </div>
    </div>
  );

  if (match.isBye) {
    return (
      <div className="bg-neutral-800/50 backdrop-blur rounded-lg border border-gray-700/50 shadow-lg p-4 w-64">
        <div className="text-center">
          <div className="text-xs text-yellow-400 font-medium mb-1">BYE</div>
        </div>
        <div className="flex justify-center items-center p-2 bg-green-500/10 rounded-md">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex-shrink-0">
              <img
                src={match.winner?.profilePicture || '/images/default-avatar.png'}
                alt={match.winner?.name || 'Player'}
                className="w-full h-full rounded-full object-cover ring-1 ring-gray-700/50"
              />
            </div>
            <span className="text-sm font-semibold text-green-400">
              {match.winner?.name || 'Unknown'}
            </span>
          </div>
        </div>
        <div className="text-center mt-1">
          <div className="text-xs text-green-400/70">Auto-advances</div>
        </div>
      </div>
    );
  }

  const isCompleted = match.winner !== null;
  const canReport = isStaff && match.player1 && match.player2 && onMatchUpdate;

  return (
    <div className={`bg-neutral-800/50 backdrop-blur rounded-lg border shadow-lg p-4 w-64 transition-colors ${
      isCompleted ? 'border-green-500/20' : 'border-gray-700/50 hover:border-gray-600/50'
    }`}>
      <div className="text-center mb-2">
        <div className="text-xs text-gray-500">Match {match.matchNumber}</div>
        {hasLiveData && isCompleted && (
          <div className="text-xs text-green-400/70">Completed</div>
        )}
      </div>

      <div className="space-y-1">
        {renderPlayerRow(match.player1, match.player1Score, match.winner?.id === match.player1?.id)}
        <div className="text-center">
          <span className="text-xs text-gray-600">vs</span>
        </div>
        {renderPlayerRow(match.player2, match.player2Score, match.winner?.id === match.player2?.id)}
      </div>

      {canReport && <ScoreInput match={match} onMatchUpdate={onMatchUpdate!} />}
    </div>
  );
}

// ==================== CONNECTOR LINES ====================

function ConnectorLines({ roundIndex, matchIndex, matchesInRound, totalRounds }: {
  roundIndex: number;
  matchIndex: number;
  matchesInRound: number;
  totalRounds: number;
}) {
  if (roundIndex >= totalRounds - 1) return null; // No connectors from the final

  // Determine if this match feeds into top or bottom of next match
  const isTopMatch = matchIndex % 2 === 0;
  const nextMatchIndex = Math.floor(matchIndex / 2);

  return (
    <div className="absolute right-0 top-1/2 w-8 -translate-y-px">
      {/* Horizontal line from match to the right */}
      <div className="absolute left-0 top-0 w-4 h-px bg-gray-600" />
      {/* Vertical connector */}
      <div className={`absolute left-4 w-px bg-gray-600 ${
        isTopMatch ? 'top-0 h-[calc(50%+var(--connector-height))]' : 'bottom-0 h-[calc(50%+var(--connector-height))]'
      }`} />
    </div>
  );
}

// ==================== MAIN BRACKET COMPONENT ====================

/**
 * Single Elimination Bracket Display Component.
 *
 * This component is a pure renderer — it takes backend match data and
 * displays it as a bracket. It does NOT generate any bracket structure;
 * that is the backend's job.
 *
 * Features:
 *  - Groups matches into rounds and displays them in columns
 *  - Shows player names, avatars, and scores
 *  - Handles BYE matches with special styling
 *  - Staff can report/change scores via inline score inputs
 *  - Vertical alignment keeps matches lined up with their child matches
 */
export default function SingleEliminationBracket({
  matches,
  isStaff = false,
  onMatchUpdate,
  tournamentName = 'Tournament',
  className = ''
}: SingleEliminationBracketProps) {

  // Transform raw backend matches into structured rounds
  const rounds: Round[] = useMemo(() => {
    if (!matches || matches.length === 0) return [];

    // Group by round number
    const byRound = new Map<number, any[]>();
    let maxRound = 0;

    for (const m of matches) {
      const round = m.round;
      if (!byRound.has(round)) byRound.set(round, []);
      byRound.get(round)!.push(m);
      maxRound = Math.max(maxRound, round);
    }

    const result: Round[] = [];

    for (let r = 1; r <= maxRound; r++) {
      const rawMatches = byRound.get(r) || [];
      // Sort by match_number
      rawMatches.sort((a: any, b: any) => a.match_number - b.match_number);

      let roundName = `Round ${r}`;
      if (r === maxRound) roundName = 'Final';
      else if (r === maxRound - 1 && maxRound > 2) roundName = 'Semifinal';
      else if (r === maxRound - 2 && maxRound > 3) roundName = 'Quarterfinal';

      result.push({
        roundNumber: r,
        name: roundName,
        matches: rawMatches.map((m: any) => ({
          id: m.id,
          round: m.round,
          matchNumber: m.match_number,
          player1: m.player1_id ? {
            id: m.player1_id,
            name: m.player1_name,
            profilePicture: m.player1_picture
          } : null,
          player2: m.player2_id ? {
            id: m.player2_id,
            name: m.player2_name,
            profilePicture: m.player2_picture
          } : null,
          player1Score: m.player1_score,
          player2Score: m.player2_score,
          winner: m.winner_id ? {
            id: m.winner_id,
            name: m.winner_name,
            profilePicture: null
          } : null,
          isBye: m.bye_match,
          nextMatchId: m.next_match_id,
          nextMatchSlot: m.next_match_slot
        }))
      });
    }

    return result;
  }, [matches]);

  if (rounds.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-400 text-lg">No bracket data available</div>
        <div className="text-sm text-gray-500 mt-2">
          Brackets will appear here once they are generated.
        </div>
      </div>
    );
  }

  const hasLiveData = matches && matches.length > 0;
  const totalRounds = rounds.length;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-300">
          {tournamentName}
        </h2>
      </div>

      {/* Bracket Grid */}
      <div className="flex gap-8 pb-6 overflow-x-auto">
        {rounds.map((round, roundIndex) => {
          // Calculate vertical spacing: each subsequent round has double the gap
          // to keep matches aligned with their parent matches
          const spacingMultiplier = Math.pow(2, roundIndex);
          const matchGap = roundIndex === 0 ? 16 : 16 * spacingMultiplier; // px

          return (
            <div key={round.roundNumber} className="flex-shrink-0 flex flex-col">
              {/* Round header */}
              <div className="text-sm font-medium text-gray-400 mb-4 px-3 py-1 bg-green-500/10 rounded-lg text-center whitespace-nowrap">
                {round.name}
              </div>

              {/* Matches in this round */}
              <div
                className="flex flex-col justify-around flex-1"
                style={{ gap: `${matchGap}px` }}
              >
                {round.matches.map((match, matchIndex) => (
                  <div key={match.id} className="relative">
                    <MatchCard
                      match={match}
                      isStaff={isStaff}
                      onMatchUpdate={onMatchUpdate}
                      hasLiveData={hasLiveData}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
        <div>• <span className="text-yellow-400">BYE</span> — Auto-advance (no opponent)</div>
        <div>• <span className="text-green-400">Green</span> — Match winner</div>
        <div>• <span className="text-gray-400 italic">TBD</span> — Waiting for previous result</div>
      </div>
    </div>
  );
}
