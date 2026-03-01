'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import HybridBracket from '@/components/HybridBracket';
import PageShell from '@/app/components/PageShell';
import { Match, Tournament } from '@/app/tournament/[id]/bracket/types';

// ==================== HELPERS ====================

const NAMES = [
  'Alice Johnson', 'Bob Smith', 'Charlie Davis', 'Diana Miller', 'Eve Wilson',
  'Frank Brown', 'Grace Lee', 'Henry Chen', 'Ivy Martinez', 'Jack Taylor',
  'Kate Anderson', 'Liam Garcia', 'Mia Rodriguez', 'Noah Thompson', 'Olivia White',
  'Paul Harris', 'Quinn Clark', 'Ruby Lewis', 'Sam Walker', 'Tina Young',
];

/**
 * Generate mock matches in the same format the backend produces.
 * This keeps the demo in sync with the real bracket components.
 * Winners propagate through ALL rounds, not just R1→R2.
 */
function generateMockMatches(
  numParticipants: number,
  scoreOverrides: Map<number, { p1: number; p2: number }>,
): Match[] {
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
  const totalRounds = Math.ceil(Math.log2(bracketSize));
  const numberOfByes = bracketSize - numParticipants;

  // Build participants list
  const participants = Array.from({ length: numParticipants }, (_, i) => ({
    id: i + 1,
    name: NAMES[i % NAMES.length] || `Player ${i + 1}`,
    picture: '/images/default-avatar.png',
  }));

  // Separate BYE recipients from Round 1 players
  const byeRecipients = participants.slice(0, numberOfByes);
  const round1Players = participants.slice(numberOfByes);

  const matches: Match[] = [];
  let nextId = 1;

  // ---- Round 1 (only real matches, no BYE-only slots) ----
  const round1MatchCount = Math.floor(round1Players.length / 2);
  for (let i = 0; i < round1MatchCount; i++) {
    const p1 = round1Players[i * 2];
    const p2 = round1Players[i * 2 + 1] ?? null;
    const id = nextId++;
    const score = scoreOverrides.get(id);

    const winnerId = score
      ? score.p1 > score.p2
        ? p1.id
        : p2?.id ?? null
      : null;

    matches.push({
      id,
      round: 1,
      match_number: i + 1,
      player1_id: p1.id,
      player2_id: p2?.id ?? null,
      player1_name: p1.name,
      player2_name: p2?.name ?? null,
      player1_picture: p1.picture,
      player2_picture: p2?.picture ?? null,
      player1_score: score?.p1 ?? null,
      player2_score: score?.p2 ?? null,
      winner_id: winnerId,
      winner_name: winnerId === p1.id ? p1.name : p2?.name ?? null,
      next_match_id: null,
      next_match_slot: null,
      bye_match: !p2,
      bracket: 'winners',
    });
  }

  // ---- Round 2+ (iteratively propagate winners) ----
  if (totalRounds >= 2) {
    // Build initial Round 2 slots from BYE recipients + Round 1 winners
    const round2Size = bracketSize / 2;
    let prevSlots: ({ id: number; name: string; picture: string } | null)[] = new Array(round2Size).fill(null);

    // Spread BYE recipients evenly
    if (numberOfByes > 0) {
      const spacing = round2Size / numberOfByes;
      for (let i = 0; i < numberOfByes; i++) {
        const pos = Math.floor(i * spacing);
        prevSlots[pos] = byeRecipients[i];
      }
    }

    // Fill in Round 1 winners
    let r1Idx = 0;
    for (let pos = 0; pos < round2Size; pos++) {
      if (!prevSlots[pos] && r1Idx < round1MatchCount) {
        const r1Match = matches[r1Idx];
        if (r1Match?.winner_id) {
          const winner = participants.find((p) => p.id === r1Match.winner_id);
          prevSlots[pos] = winner ?? null;
        }
        r1Idx++;
      }
    }

    // Now iterate from Round 2 through the final round
    for (let r = 2; r <= totalRounds; r++) {
      const matchesInRound = Math.floor(prevSlots.length / 2);
      const nextSlots: ({ id: number; name: string; picture: string } | null)[] = [];

      for (let i = 0; i < matchesInRound; i++) {
        const p1 = prevSlots[i * 2];
        const p2 = prevSlots[i * 2 + 1];
        const id = nextId++;
        const score = scoreOverrides.get(id);
        const winnerId = score
          ? score.p1 > score.p2
            ? p1?.id ?? null
            : p2?.id ?? null
          : null;

        matches.push({
          id,
          round: r,
          match_number: i + 1,
          player1_id: p1?.id ?? null,
          player2_id: p2?.id ?? null,
          player1_name: p1?.name ?? null,
          player2_name: p2?.name ?? null,
          player1_picture: p1?.picture ?? null,
          player2_picture: p2?.picture ?? null,
          player1_score: score?.p1 ?? null,
          player2_score: score?.p2 ?? null,
          winner_id: winnerId,
          winner_name: winnerId ? (winnerId === p1?.id ? p1?.name : p2?.name) ?? null : null,
          next_match_id: null,
          next_match_slot: null,
          bye_match: false,
          bracket: 'winners',
        });

        // Propagate this match's winner to the next round's slot
        if (winnerId) {
          const winner = winnerId === p1?.id ? p1 : p2;
          nextSlots.push(winner ?? null);
        } else {
          nextSlots.push(null);
        }
      }

      prevSlots = nextSlots;
    }
  }

  return matches;
}

// ==================== BRACKET TABS ====================

function BracketTabs({
  matches,
  activeTab,
  onTabChange,
}: {
  matches: Match[];
  activeTab: 'all' | 'winners' | 'losers' | 'finals';
  onTabChange: (tab: 'all' | 'winners' | 'losers' | 'finals') => void;
}) {
  const matchCounts = matches.reduce<Record<string, number>>((acc, m) => {
    const bracket = m.bracket || 'winners';
    acc[bracket] = (acc[bracket] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex overflow-x-auto px-6 py-2 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
      <button
        onClick={() => onTabChange('all')}
        className={`px-4 py-2 mr-2 font-medium text-sm rounded-t-lg transition-all ${
          activeTab === 'all'
            ? 'text-white border-b-2 border-purple-500'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        All Brackets
      </button>
      <button
        onClick={() => onTabChange('winners')}
        className={`px-4 py-2 mr-2 font-medium text-sm rounded-t-lg transition-all flex items-center ${
          activeTab === 'winners'
            ? 'text-green-400 border-b-2 border-green-500'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        Winners
        {matchCounts['winners'] > 0 && (
          <span className="ml-2 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
            {matchCounts['winners']}
          </span>
        )}
      </button>
      <button
        onClick={() => onTabChange('losers')}
        className={`px-4 py-2 mr-2 font-medium text-sm rounded-t-lg transition-all flex items-center ${
          activeTab === 'losers'
            ? 'text-red-400 border-b-2 border-red-500'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        Losers
        {matchCounts['losers'] > 0 && (
          <span className="ml-2 bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
            {matchCounts['losers']}
          </span>
        )}
      </button>
      {matchCounts['finals'] > 0 && (
        <button
          onClick={() => onTabChange('finals')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all flex items-center ${
            activeTab === 'finals'
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Finals
          <span className="ml-2 bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full">
            {matchCounts['finals']}
          </span>
        </button>
      )}
    </div>
  );
}

// ==================== DEMO PAGE ====================

export default function BracketDemo() {
  const [numParticipants, setNumParticipants] = useState(7);
  const [tournamentStatus, setTournamentStatus] = useState<Tournament['status']>('in_progress');
  const [tournamentFormat, setTournamentFormat] = useState<Tournament['format']>('SINGLE_ELIMINATION');
  const [userRole, setUserRole] = useState<'user' | 'staff' | 'admin'>('staff');
  const [activeBracketType, setActiveBracketType] = useState<'all' | 'winners' | 'losers' | 'finals'>('all');
  const [scoreOverrides, setScoreOverrides] = useState<Map<number, { p1: number; p2: number }>>(new Map());

  // Drag-to-scroll for the bracket container
  const bracketScrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const scrollLeftStart = useRef(0);
  const scrollTopStart = useRef(0);

  const handleBracketMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const tag = (e.target as HTMLElement).closest('a, button, input, select, textarea');
    if (tag) return;
    isDragging.current = true;
    dragStartX.current = e.pageX;
    dragStartY.current = e.pageY;
    scrollLeftStart.current = bracketScrollRef.current?.scrollLeft ?? 0;
    scrollTopStart.current = bracketScrollRef.current?.scrollTop ?? 0;
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !bracketScrollRef.current) return;
      bracketScrollRef.current.scrollLeft = scrollLeftStart.current - (e.pageX - dragStartX.current);
      bracketScrollRef.current.scrollTop = scrollTopStart.current - (e.pageY - dragStartY.current);
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

  const mockTournament: Tournament = {
    id: 999999,
    name: 'Demo Tournament',
    format: tournamentFormat,
    status: tournamentStatus,
  };

  const mockMatches = generateMockMatches(numParticipants, scoreOverrides);
  const isStaff = userRole === 'staff' || userRole === 'admin';

  const handleScoreSubmit = useCallback(
    async (matchId: number, player1Score: number, player2Score: number): Promise<void> => {
      if (player1Score < 0 || player2Score < 0) throw new Error('Scores cannot be negative');
      if (player1Score === player2Score) throw new Error('Matches cannot end in a tie');

      // Simulate API delay
      await new Promise((r) => setTimeout(r, 300));

      setScoreOverrides((prev) => {
        const next = new Map(prev);
        next.set(matchId, { p1: player1Score, p2: player2Score });
        return next;
      });
    },
    [],
  );

  const handleParticipantChange = (n: number) => {
    setNumParticipants(n);
    setScoreOverrides(new Map());
  };

  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numParticipants)));

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />

      <div className="container mx-auto px-4 py-8">
        {/* Demo Controls */}
        <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700/50 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-400">
            Bracket Demo
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Uses the same <code>HybridBracket</code> + <code>SingleEliminationBracket</code> components
            as the real tournament pages.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Participants */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Participants ({numParticipants}):
              </label>
              <input
                type="number"
                min="2"
                max="20"
                value={numParticipants}
                onChange={(e) => handleParticipantChange(parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm mb-2"
              />
              <div className="flex flex-wrap gap-1">
                {[2, 3, 5, 7, 8, 12, 16].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleParticipantChange(num)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      numParticipants === num
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Tournament Status */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Tournament Status:
              </label>
              <select
                value={tournamentStatus}
                onChange={(e) => setTournamentStatus(e.target.value as Tournament['status'])}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="registration_open">Registration Open</option>
                <option value="registration_closed">Registration Closed</option>
                <option value="check_in">Check In</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* User Role */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                User Role:
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as 'user' | 'staff' | 'admin')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="user">Regular User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Format & Actions */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Format:
              </label>
              <select
                value={tournamentFormat}
                onChange={(e) => setTournamentFormat(e.target.value as Tournament['format'])}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm mb-2"
              >
                <option value="SINGLE_ELIMINATION">Single Elimination</option>
                <option value="DOUBLE_ELIMINATION">Double Elimination</option>
              </select>
              <button
                onClick={() => setScoreOverrides(new Map())}
                className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded text-sm hover:bg-purple-500/30 w-full"
              >
                Reset All Scores
              </button>
            </div>
          </div>

          {/* Debug Info (staff only) */}
          {isStaff && (
            <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="text-purple-400 font-medium mb-2">Bracket Structure</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Participants</div>
                  <div className="text-white font-medium">{numParticipants}</div>
                </div>
                <div>
                  <div className="text-gray-400">Bracket Size</div>
                  <div className="text-white font-medium">{bracketSize}</div>
                </div>
                <div>
                  <div className="text-gray-400">BYEs Needed</div>
                  <div className="text-white font-medium">{bracketSize - numParticipants}</div>
                </div>
                <div>
                  <div className="text-gray-400">Total Matches</div>
                  <div className="text-white font-medium">{mockMatches.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {scoreOverrides.size > 0 && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h4 className="text-green-400 font-medium mb-2">Tournament Progress</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Matches Completed</div>
                  <div className="text-white font-medium">{scoreOverrides.size}</div>
                </div>
                <div>
                  <div className="text-gray-400">Total Matches</div>
                  <div className="text-white font-medium">{mockMatches.length}</div>
                </div>
                <div>
                  <div className="text-gray-400">Completion</div>
                  <div className="text-white font-medium">
                    {Math.round((scoreOverrides.size / Math.max(mockMatches.length, 1)) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bracket Display — uses the exact same components as the real page */}
        <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700/50">
          {tournamentFormat === 'DOUBLE_ELIMINATION' && (
            <div className="flex border-b border-gray-700/50">
              <BracketTabs
                matches={mockMatches}
                activeTab={activeBracketType}
                onTabChange={setActiveBracketType}
              />
            </div>
          )}

          <div
            ref={bracketScrollRef}
            onMouseDown={handleBracketMouseDown}
            className="overflow-x-auto p-6 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="min-w-max">
              <HybridBracket
                tournamentId="demo-tournament"
                tournament={mockTournament}
                matches={mockMatches}
                isStaff={isStaff}
                onMatchUpdate={handleScoreSubmit}
                bracketType={activeBracketType}
              />
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="flex justify-start mt-6">
          <a
            href="/tournaments"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tournaments
          </a>
        </div>
      </div>

      <style jsx global>{`
        .bracket-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.3) rgba(30, 30, 30, 0.5);
        }
        .bracket-container::-webkit-scrollbar { height: 8px; }
        .bracket-container::-webkit-scrollbar-track { background: rgba(30, 30, 30, 0.5); border-radius: 4px; }
        .bracket-container::-webkit-scrollbar-thumb { background-color: rgba(139, 92, 246, 0.3); border-radius: 4px; }
        .bracket-container::-webkit-scrollbar-thumb:hover { background-color: rgba(139, 92, 246, 0.5); }
      `}</style>
    </main>
  );
}
