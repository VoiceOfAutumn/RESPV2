'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

// ==================== TYPES ====================

interface Player {
  id: number;
  name: string;
  profilePicture?: string | null;
  points?: number | null;
  siteRank?: number | null;
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
  vodUrl: string | null;
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
  onVodUpdate?: (matchId: number, vodUrl: string | null) => Promise<void>;
  tournamentName?: string;
  className?: string;
}

// ==================== PLAYER HOVER CARD ====================

function PlayerPopover({ player, children }: { player: Player; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.left + rect.width / 2,
      });
    }
    setHovered(true);
  };

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      className="relative"
    >
      {children}
      {hovered && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ top: position.top, left: position.left, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-gray-900 border border-gray-700/50 rounded-xl shadow-xl p-3 flex items-center gap-3 w-max mb-2">
            <img
              src={player.profilePicture || '/images/default-avatar.png'}
              alt={player.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30 flex-shrink-0"
              onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
            />
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm">{player.name}</p>
              <p className="text-gray-400 text-xs">Rank #{player.siteRank ?? '\u2014'}</p>
              <p className="text-gray-500 text-xs">{player.points ?? 0} EXP</p>
            </div>
          </div>
          <div className="w-3 h-3 bg-gray-900 border-b border-r border-gray-700/50 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-0.5"></div>
        </div>,
        document.body
      )}
    </div>
  );
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

// ==================== VOD INPUT ====================

function VodInput({ match, onVodUpdate }: {
  match: BracketMatch;
  onVodUpdate: (matchId: number, vodUrl: string | null) => Promise<void>;
}) {
  const [url, setUrl] = useState<string>(match.vodUrl || '');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onVodUpdate(match.id, url.trim() || null);
      setOpen(false);
    } catch (err) {
      console.error('Error updating VOD:', err);
      alert('Failed to update VOD link.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 w-full text-xs px-2 py-1 rounded border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-1"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>
        {match.vodUrl ? 'Edit VOD' : 'Add VOD'}
      </button>
    );
  }

  return (
    <div className="mt-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
      <div className="text-xs text-purple-400 mb-1 font-medium">YouTube VOD Link</div>
      <div className="flex gap-1">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 px-2 py-1 text-xs bg-gray-700 rounded border border-gray-600 focus:border-purple-400 focus:outline-none text-gray-300"
          disabled={submitting}
        />
        <button
          onClick={handleSave}
          disabled={submitting}
          className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50"
        >
          {submitting ? '...' : 'Save'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-2 py-1 text-xs text-gray-400 rounded hover:bg-gray-700 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ==================== VOD PLAY BUTTON ====================

function VodButton({ url }: { url: string }) {
  const [showModal, setShowModal] = useState(false);

  // Convert YouTube URL to embed URL
  const getEmbedUrl = (rawUrl: string): string | null => {
    try {
      const parsed = new URL(rawUrl);
      let videoId: string | null = null;

      if (parsed.hostname.includes('youtube.com')) {
        videoId = parsed.searchParams.get('v');
      } else if (parsed.hostname.includes('youtu.be')) {
        videoId = parsed.pathname.slice(1);
      }

      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}`;
      }
    } catch {}
    return null;
  };

  const embedUrl = getEmbedUrl(url);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="mt-2 w-full text-xs px-2 py-1 rounded bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-colors flex items-center justify-center gap-1"
        title="Watch VOD"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>
        Watch VOD
      </button>

      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl"
            >
              ✕
            </button>
            {embedUrl ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full rounded-lg"
                  src={embedUrl}
                  title="Match VOD"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="bg-neutral-900 rounded-lg p-8 text-center">
                <p className="text-gray-300 mb-4">Could not embed this video. Click below to open it directly.</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Open Video ↗
                </a>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ==================== MATCH CARD ====================

function MatchCard({ match, isStaff, onMatchUpdate, onVodUpdate, hasLiveData }: {
  match: BracketMatch;
  isStaff: boolean;
  onMatchUpdate?: (matchId: number, p1Score: number, p2Score: number) => Promise<void>;
  onVodUpdate?: (matchId: number, vodUrl: string | null) => Promise<void>;
  hasLiveData: boolean;
}) {
  const hasScores = match.player1Score !== null || match.player2Score !== null;

  const renderPlayerRow = (player: Player | null, score: number | null, isWinner: boolean) => (
    <div className={`flex justify-between items-center p-2 rounded-md transition-colors ${
      isWinner ? 'bg-green-500/10' : ''
    }`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {player ? (
          <PlayerPopover player={player}>
            <Link href={`/user/${player.name}`} className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full flex-shrink-0">
                <img
                  src={player.profilePicture || '/images/default-avatar.png'}
                  alt={player.name}
                  className="w-full h-full rounded-full object-cover ring-1 ring-gray-700/50 hover:ring-purple-500/50 transition-all duration-200 cursor-pointer"
                  onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
                />
              </div>
              <span className={`text-sm truncate ${
                isWinner ? 'font-semibold text-green-400' : 'text-gray-300'
              }`}>
                {player.name}
              </span>
            </Link>
          </PlayerPopover>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full flex-shrink-0">
              <div className="w-full h-full bg-gray-700/50 rounded-full" />
            </div>
            <span className="text-sm truncate text-gray-500 italic">TBD</span>
          </div>
        )}
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
          {match.winner ? (
            <PlayerPopover player={match.winner}>
              <Link href={`/user/${match.winner.name}`} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex-shrink-0">
                  <img
                    src={match.winner.profilePicture || '/images/default-avatar.png'}
                    alt={match.winner.name}
                    className="w-full h-full rounded-full object-cover ring-1 ring-gray-700/50 hover:ring-purple-500/50 transition-all duration-200 cursor-pointer"
                    onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
                  />
                </div>
                <span className="text-sm font-semibold text-green-400">
                  {match.winner.name}
                </span>
              </Link>
            </PlayerPopover>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex-shrink-0">
                <div className="w-full h-full bg-gray-700/50 rounded-full" />
              </div>
              <span className="text-sm font-semibold text-green-400">Unknown</span>
            </div>
          )}
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

      {/* VOD play button — visible to everyone when a VOD exists */}
      {match.vodUrl && !isStaff && <VodButton url={match.vodUrl} />}

      {/* Staff: VOD input (also shows play button if VOD already set) */}
      {isStaff && onVodUpdate && (
        <>
          {match.vodUrl && <VodButton url={match.vodUrl} />}
          <VodInput match={match} onVodUpdate={onVodUpdate} />
        </>
      )}
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
  onVodUpdate,
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
            profilePicture: m.player1_picture,
            points: m.player1_points != null ? Number(m.player1_points) : null,
            siteRank: m.player1_rank != null ? Number(m.player1_rank) : null,
          } : null,
          player2: m.player2_id ? {
            id: m.player2_id,
            name: m.player2_name,
            profilePicture: m.player2_picture,
            points: m.player2_points != null ? Number(m.player2_points) : null,
            siteRank: m.player2_rank != null ? Number(m.player2_rank) : null,
          } : null,
          player1Score: m.player1_score,
          player2Score: m.player2_score,
          winner: m.winner_id ? {
            id: m.winner_id,
            name: m.winner_name,
            profilePicture: m.winner_picture || null,
            points: m.winner_points != null ? Number(m.winner_points) : null,
            siteRank: m.winner_rank != null ? Number(m.winner_rank) : null,
          } : null,
          isBye: m.bye_match,
          nextMatchId: m.next_match_id,
          nextMatchSlot: m.next_match_slot,
          vodUrl: m.vod_url || null
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
                      onVodUpdate={onVodUpdate}
                      hasLiveData={hasLiveData}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
