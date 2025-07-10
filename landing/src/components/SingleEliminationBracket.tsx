'use client';

import React, { useMemo, useState } from 'react';

interface Participant {
  id: number;
  name: string;
  profilePicture?: string;
}

interface Match {
  id: number;
  round: number;
  matchNumber: number;
  player1: Participant | null;
  player2: Participant | null;
  winner: Participant | null;
  status: 'pending' | 'completed' | 'bye';
  isBye: boolean;
  player1_score?: number | null;
  player2_score?: number | null;
}

interface Round {
  roundNumber: number;
  roundName: string;
  matches: Match[];
}

/**
 * Score Input Component for Staff
 */
interface ScoreInputProps {
  match: Match;
  onMatchUpdate: (matchId: number, player1Score: number, player2Score: number) => Promise<void>;
}

function ScoreInput({ match, onMatchUpdate }: ScoreInputProps) {
  const [player1Score, setPlayer1Score] = useState<string>(match.player1_score?.toString() || '');
  const [player2Score, setPlayer2Score] = useState<string>(match.player2_score?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    const p1Score = parseInt(player1Score) || 0;
    const p2Score = parseInt(player2Score) || 0;
    
    if (p1Score < 0 || p2Score < 0) {
      alert('Scores cannot be negative');
      return;
    }
    
    if (p1Score === p2Score) {
      if (!confirm('Scores are tied. Are you sure you want to submit this?')) {
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      await onMatchUpdate(match.id as number, p1Score, p2Score);
      // Don't clear scores - let the parent component handle the refresh
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Failed to update match. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <div className="text-xs text-blue-400 mb-2">Staff: Update Score</div>
      <div className="flex gap-2 items-center">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 mb-1">{match.player1?.name}</span>
          <input
            type="number"
            min="0"
            value={player1Score}
            onChange={(e) => setPlayer1Score(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-16 px-2 py-1 text-xs bg-gray-700 rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
            disabled={isSubmitting}
          />
        </div>
        <div className="text-xs text-gray-500 mt-4">vs</div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 mb-1">{match.player2?.name}</span>
          <input
            type="number"
            min="0"
            value={player2Score}
            onChange={(e) => setPlayer2Score(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-16 px-2 py-1 text-xs bg-gray-700 rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
            disabled={isSubmitting}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

interface SingleEliminationBracketProps {
  participants: Participant[];
  className?: string;
  matches?: any[]; // Backend match data if available
  isStaff?: boolean;
  onMatchUpdate?: (matchId: number, player1Score: number, player2Score: number) => Promise<void>;
  matchResults?: Map<number, { player1Score: number; player2Score: number; winnerId: number | null }>; // Demo mode match results
  tournamentName?: string; // Tournament name for the header
}

/**
 * Single Elimination Tournament Bracket Component
 * 
 * This component generates and displays a single-elimination tournament bracket
 * based on a dynamic list of participants passed as props.
 * 
 * When live match data exists, it will use that data instead of generating a new bracket.
 */
export default function SingleEliminationBracket({ 
  participants, 
  className = '', 
  matches = [], 
  isStaff = false, 
  onMatchUpdate,
  matchResults = new Map(),
  tournamentName = "Tournament"
}: SingleEliminationBracketProps) {
  
  /**
   * Shuffles an array using Fisher-Yates algorithm for random participant seeding
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled array
   */
  const shuffleArray = (array: Participant[]): Participant[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  /**
   * Transforms backend match data into the format expected by this component
   */
  const transformBackendMatches = (backendMatches: any[]): { rounds: Round[], metadata: any } => {
    if (!backendMatches || backendMatches.length === 0) {
      return { rounds: [], metadata: { totalRounds: 0, bracketSize: 0, numberOfByes: 0 } };
    }

    // Group matches by round
    const matchesByRound: { [key: number]: any[] } = {};
    backendMatches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });

    // Convert to our format
    const rounds: Round[] = [];
    const totalRounds = Math.max(...Object.keys(matchesByRound).map(Number));
    
    for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
      const roundMatches = matchesByRound[roundNum] || [];
      
      const formattedMatches: Match[] = roundMatches.map(match => ({
        id: match.id,
        round: match.round,
        matchNumber: match.match_number,
        player1: match.player1_id ? {
          id: match.player1_id,
          name: match.player1_name,
          profilePicture: match.player1_picture
        } : null,
        player2: match.player2_id ? {
          id: match.player2_id,
          name: match.player2_name,
          profilePicture: match.player2_picture
        } : null,
        winner: match.winner_id ? {
          id: match.winner_id,
          name: match.winner_name,
          profilePicture: undefined // We might not have winner picture in the match data
        } : null,
        status: match.winner_id ? 'completed' : match.bye_match ? 'bye' : 'pending',
        isBye: match.bye_match,
        player1_score: match.player1_score,
        player2_score: match.player2_score
      }));

      // Generate round name
      let roundName = `Round ${roundNum}`;
      if (roundNum === totalRounds) roundName = 'Final';
      else if (roundNum === totalRounds - 1 && totalRounds > 2) roundName = 'Semifinal';
      else if (roundNum === totalRounds - 2 && totalRounds > 3) roundName = 'Quarterfinal';

      rounds.push({
        roundNumber: roundNum,
        roundName: roundName,
        matches: formattedMatches
      });
    }

    return {
      rounds,
      metadata: {
        totalRounds,
        bracketSize: Math.pow(2, totalRounds),
        numberOfByes: backendMatches.filter(m => m.bye_match).length
      }
    };
  };

  /**
   * Generates the bracket structure
   */
  const bracket = useMemo(() => {
    // If we have live match data, use that instead of generating new bracket
    if (matches && matches.length > 0) {
      return transformBackendMatches(matches);
    }

  // Otherwise, generate a new bracket from participants (correct logic)
  // Validate input
  if (!participants || participants.length < 2) {
    return { rounds: [], metadata: { totalRounds: 0, bracketSize: 0, numberOfByes: 0 } };
  }

  const numParticipants = participants.length;
  
  /**
   * CORRECT BRACKET CALCULATION
   * 
   * For a single-elimination tournament:
   * 1. bracketSize = 2^ceil(log2(N)) - the smallest power of 2 that fits all participants
   * 2. numberOfByes = bracketSize - N - how many top seeds skip Round 1
   * 3. round1MatchCount = (bracketSize / 2) - numberOfByes - actual matches in Round 1
   * 
   * Example: 6 participants in 8-size bracket
   * - bracketSize = 8, numberOfByes = 2, round1MatchCount = 2
   * - Top 2 seeds skip Round 1, remaining 4 play in 2 matches
   * - Round 2: 2 BYE seeds + 2 Round 1 winners = 4 participants in 2 matches
   */
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
  const numberOfByes = bracketSize - numParticipants;
  const round1MatchCount = (bracketSize / 2) - numberOfByes;
  const totalRounds = Math.ceil(Math.log2(bracketSize));
  
  console.log(`Bracket Generator: ${numParticipants} participants, ${bracketSize} bracket size, ${numberOfByes} BYEs, ${round1MatchCount} Round 1 matches, ${totalRounds} total rounds`);

  // Shuffle participants randomly before seeding to prevent predictable matchups
  const shuffledParticipants = shuffleArray(participants);
  
  /**
   * PARTICIPANT SEEDING
   * 
   * Top seeds (numberOfByes) skip Round 1 entirely
   * Remaining participants play in Round 1 matches
   */
  const byeSeeds = shuffledParticipants.slice(0, numberOfByes); // Top seeds get BYEs
  const round1Participants = shuffledParticipants.slice(numberOfByes); // Remaining play Round 1
  
  const rounds: Round[] = [];
  let matchId = 1;

  /**
   * ROUND 1 GENERATION
   * 
   * Only create actual matches between participants who must play.
   * Do NOT create BYE vs BYE matches or empty matches.
   * BYE recipients skip this round entirely.
   */
  const round1Matches: Match[] = [];
  const round1Winners: Participant[] = [];
  
  for (let matchNum = 1; matchNum <= round1MatchCount; matchNum++) {
    const player1Index = (matchNum - 1) * 2;
    const player2Index = player1Index + 1;
    
    const participant1 = round1Participants[player1Index] || null;
    const participant2 = round1Participants[player2Index] || null;
    
    // Only create matches where both participants exist
    if (participant1 && participant2) {
      // Check if this match has results from demo mode
      const result = matchResults?.get(matchId);
      
      let winner: Participant | null = null;
      let status: 'pending' | 'completed' | 'bye' = 'pending';
      
      if (result) {
        // Match has been completed in demo mode
        status = 'completed';
        winner = result.player1Score > result.player2Score ? participant1 : participant2;
        round1Winners.push(winner);
      }
      
      const match: Match = {
        id: matchId,
        round: 1,
        matchNumber: matchNum,
        player1: participant1,
        player2: participant2,
        winner: winner,
        status: status,
        isBye: false,
        player1_score: result?.player1Score || null,
        player2_score: result?.player2Score || null
      };
      
      round1Matches.push(match);
      matchId++;
    }
  }
  
  // Only add Round 1 if there are actual matches to play
  if (round1Matches.length > 0) {
    rounds.push({
      roundNumber: 1,
      roundName: totalRounds === 1 ? 'Final' : 'Round 1',
      matches: round1Matches
    });
  }

  /**
   * ROUND 2 AND SUBSEQUENT ROUNDS GENERATION
   * 
   * Round 2 participants = BYE seeds + Round 1 winners
   * Continue bracket structure until final
   */
  
  // Determine Round 2 participants
  let currentRoundParticipants: (Participant | null)[] = [];
  
  if (totalRounds > 1) {
    /**
     * IMPROVED BYE DISTRIBUTION FOR ROUND 2
     * 
     * Instead of placing all BYEs at the beginning, we spread them evenly
     * across the Round 2 bracket positions to create more balanced matches.
     * 
     * For example, with 6 participants (2 BYEs, 2 Round 1 matches):
     * - Round 2 has 4 positions [0, 1, 2, 3]
     * - Instead of [BYE1, BYE2, R1W1, R1W2]
     * - We distribute as [BYE1, R1W1, BYE2, R1W2] for better spacing
     */
    const round2Size = Math.pow(2, totalRounds - 1); // Corrected: participants in Round 2
    const totalRound2Participants = numberOfByes + round1MatchCount;
    
    // Create array with all Round 2 participants
    const allRound2Participants: (Participant | null)[] = [];
    
    // Add BYE seeds
    byeSeeds.forEach(participant => {
      allRound2Participants.push(participant);
    });
    
    // Add Round 1 winners or placeholders
    for (let i = 0; i < round1MatchCount; i++) {
      const match = round1Matches[i];
      if (match && match.winner) {
        allRound2Participants.push(match.winner);
      } else {
        allRound2Participants.push(null); // TBD winner
      }
    }
    
    // Distribute participants evenly across Round 2 positions
    // Use a distribution pattern that spreads BYEs and Round 1 winners
    currentRoundParticipants = new Array(round2Size).fill(null);
    
    if (numberOfByes > 0 && round1MatchCount > 0) {
      // Mixed distribution: spread BYEs evenly across positions
      // Calculate spacing to distribute BYEs evenly
      const totalPositions = round2Size;
      const spacing = totalPositions / numberOfByes;
      
      // Place BYEs at evenly spaced positions
      for (let i = 0; i < numberOfByes; i++) {
        const position = Math.floor(i * spacing);
        if (position < totalPositions && !currentRoundParticipants[position]) {
          currentRoundParticipants[position] = byeSeeds[i];
        }
      }
      
      // Fill remaining positions with Round 1 winners/placeholders
      let round1Index = 0;
      for (let pos = 0; pos < round2Size; pos++) {
        if (!currentRoundParticipants[pos] && round1Index < round1MatchCount) {
          const match = round1Matches[round1Index];
          currentRoundParticipants[pos] = match?.winner || null;
          round1Index++;
        }
      }
    } else {
      // Single type distribution: all BYEs or all Round 1 participants
      for (let i = 0; i < totalRound2Participants && i < round2Size; i++) {
        currentRoundParticipants[i] = allRound2Participants[i];
      }
    }
    
    console.log(`Round 2 Distribution - Size: ${round2Size}, BYEs: ${numberOfByes}, R1 Matches: ${round1MatchCount}`);
    console.log(`Round 2 Participants:`, currentRoundParticipants.map((p, i) => `Pos ${i}: ${p ? p.name : 'TBD'}`));
  }
  
  // Generate subsequent rounds
  for (let round = (round1Matches.length > 0 ? 2 : 1); round <= totalRounds; round++) {
    const roundMatches: Match[] = [];
    const roundSize = Math.pow(2, totalRounds - round);
    const nextRoundParticipants: (Participant | null)[] = [];
    
    for (let i = 0; i < roundSize; i++) {
      const player1Index = i * 2;
      const player2Index = player1Index + 1;
      
      const participant1 = currentRoundParticipants[player1Index] || null;
      const participant2 = currentRoundParticipants[player2Index] || null;
      
      // Check if this match has results from demo mode
      const result = matchResults?.get(matchId);
      
      let winner: Participant | null = null;
      let status: 'pending' | 'completed' | 'bye' = 'pending';
      
      if (result && participant1 && participant2) {
        // Match has been completed in demo mode
        status = 'completed';
        winner = result.player1Score > result.player2Score ? participant1 : participant2;
        nextRoundParticipants.push(winner);
      } else {
        nextRoundParticipants.push(null); // TBD winner
      }
      
      const match: Match = {
        id: matchId,
        round: round,
        matchNumber: i + 1,
        player1: participant1,
        player2: participant2,
        winner: winner,
        status: status,
        isBye: false,
        player1_score: result?.player1Score || null,
        player2_score: result?.player2Score || null
      };
      
      roundMatches.push(match);
      matchId++;
    }
    
    // Generate round name
    let roundName = `Round ${round}`;
    if (round === totalRounds) roundName = 'Final';
    else if (round === totalRounds - 1 && totalRounds > 2) roundName = 'Semifinal';
    else if (round === totalRounds - 2 && totalRounds > 3) roundName = 'Quarterfinal';
    
    rounds.push({
      roundNumber: round,
      roundName: roundName,
      matches: roundMatches
    });
    
    // Update participants for next round
    currentRoundParticipants = nextRoundParticipants;
  }

  return {
    rounds: rounds,
    metadata: {
      totalRounds: totalRounds,
      bracketSize: bracketSize,
      numberOfByes: numberOfByes
    }
  };
}, [participants, matches, matchResults]);

  /**
   * Calculate spacing between matches for visual bracket layout
   */
  const getMatchSpacing = (round: number): string => {
    const baseSpacing = 16; // 4rem
    const multiplier = Math.pow(2, round - 1);
    return `${baseSpacing * multiplier}px`;
  };

  /**
   * Render a single match card
   */
  const renderMatch = (match: Match, roundIndex: number) => {
    const hasLiveData = matches && matches.length > 0;
    const hasScores = match.player1_score !== null || match.player2_score !== null;

    return (
      <div
        key={match.id}
        className="bg-neutral-800/50 backdrop-blur rounded-lg border border-gray-700/50 hover:bg-neutral-700/50 transition-colors duration-300 shadow-lg p-4 w-72"
      >
        {match.isBye ? (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-sm font-medium text-yellow-400 mb-2">BYE</div>
              <div className="text-xs text-gray-400 mb-3">Auto-Advance</div>
            </div>
            
            {/* Show who advanced */}
            <div className="flex justify-center items-center p-2 bg-green-500/10 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex-shrink-0 relative">
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
            
            <div className="text-center">
              <div className="text-xs text-green-400 font-medium">Advances to Next Round</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2">
                Match {match.matchNumber}
              </div>
              {hasLiveData && (
                <div className="text-xs text-blue-400">
                  {match.status === 'completed' ? 'Completed' : 'Live Match'}
                </div>
              )}
            </div>
            
            {/* Player 1 */}
            <div className={`flex justify-between items-center p-2 ${match.winner?.id === match.player1?.id ? 'bg-green-500/10 rounded-md' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex-shrink-0 relative">
                  {match.player1 ? (
                    <img
                      src={match.player1.profilePicture || '/images/default-avatar.png'}
                      alt={match.player1.name}
                      className="w-full h-full rounded-full object-cover ring-1 ring-gray-700/50"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700/50 rounded-full" />
                  )}
                </div>
                <span className={`text-sm ${match.winner?.id === match.player1?.id ? 'font-semibold text-green-400' : 'text-gray-300'}`}>
                  {match.player1?.name || 'TBD'}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-400">
                {hasScores ? (match.player1_score ?? '-') : '-'}
              </div>
            </div>

            {/* Versus */}
            <div className="text-center">
              <div className="text-xs text-gray-500">vs</div>
            </div>

            {/* Player 2 */}
            <div className={`flex justify-between items-center p-2 ${match.winner?.id === match.player2?.id ? 'bg-green-500/10 rounded-md' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex-shrink-0 relative">
                  {match.player2 ? (
                    <img
                      src={match.player2.profilePicture || '/images/default-avatar.png'}
                      alt={match.player2.name}
                      className="w-full h-full rounded-full object-cover ring-1 ring-gray-700/50"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700/50 rounded-full" />
                  )}
                </div>
                <span className={`text-sm ${match.winner?.id === match.player2?.id ? 'font-semibold text-green-400' : 'text-gray-300'}`}>
                  {match.player2?.name || 'TBD'}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-400">
                {hasScores ? (match.player2_score ?? '-') : '-'}
              </div>
            </div>

            {/* Score input for staff (for both live matches and demo mode) */}
            {isStaff && match.player1 && match.player2 && match.status !== 'completed' && onMatchUpdate && (
              <ScoreInput
                match={match}
                onMatchUpdate={onMatchUpdate}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  if (bracket.rounds.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-400 text-lg">
          Need at least 2 participants to generate a bracket
        </div>
      </div>
    );
  }

  const hasLiveData = matches && matches.length > 0;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Bracket Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-300">
          {tournamentName}
        </h2>
      </div>

      {/* Bracket Rounds */}
      <div className="flex flex-nowrap gap-12 pb-6 overflow-x-auto">
        {bracket.rounds.map((round, roundIndex) => (
          <div key={round.roundNumber} className="flex-shrink-0">
            <div className="text-sm font-medium text-gray-400 mb-4 px-2 py-1 bg-green-500/10 rounded-lg inline-block">
              {round.roundName}
            </div>
            <div className="space-y-6">
              {round.matches.map((match, matchIndex) => (
                <div
                  key={match.id}
                  style={{
                    marginTop: matchIndex > 0 ? getMatchSpacing(round.roundNumber) : '0'
                  }}
                  className="relative"
                >
                  {renderMatch(match, roundIndex)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bracket Legend */}
      <div className="mt-6 text-xs text-gray-500 space-y-1">
        <div>• <span className="text-yellow-400">BYE</span>: Player automatically advances to next round</div>
        <div>• <span className="text-green-400">Winner</span>: Match result (when available)</div>
        <div>• <span className="text-gray-400">TBD</span>: To be determined from previous matches</div>
      </div>
    </div>
  );
}
