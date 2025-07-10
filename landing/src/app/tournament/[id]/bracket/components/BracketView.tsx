'use client';

import React, { useState, useEffect } from 'react';
import { Match, Tournament } from '../types';
import MatchCard from './MatchCard';

interface BracketProps {
  matches: Match[];
  tournament: Tournament;
  isStaff?: boolean;
  onMatchUpdate?: (matchId: number, player1Score: number, player2Score: number) => Promise<void>;
  bracketType?: 'all' | 'winners' | 'losers' | 'finals';
}

export default function BracketView({ matches, tournament, isStaff = false, onMatchUpdate, bracketType = 'all' }: BracketProps) {  // Convert 'all' to null for internal state
  const initialBracketType = bracketType === 'all' ? null : bracketType;
  
  // State to track which bracket view is active (null for all brackets)
  const [activeBracketType, setActiveBracketType] = useState<'winners' | 'losers' | 'finals' | null>(initialBracketType);
  
  // Update internal state when prop changes
  useEffect(() => {
    const newBracketType = bracketType === 'all' ? null : bracketType;
    setActiveBracketType(newBracketType);
  }, [bracketType]);
  
  // For single elimination, all matches are in the "winners" bracket
  // For double elimination, group matches by bracket type and round
  const matchesByBracket = matches.reduce<{
    winners: { [key: number]: Match[] };
    losers: { [key: number]: Match[] };
    finals: Match[];
  }>((acc, match) => {
    if (tournament.format === 'SINGLE_ELIMINATION') {
      // For single elimination, all matches go to winners bracket
      if (!acc.winners[match.round]) {
        acc.winners[match.round] = [];
      }
      acc.winners[match.round].push(match);
    } else {
      // For double elimination, use bracket property
      if (match.bracket === 'finals') {
        acc.finals.push(match);
      } else {
        const bracketType = match.bracket || 'winners';
        if (!acc[bracketType][match.round]) {
          acc[bracketType][match.round] = [];
        }
        acc[bracketType][match.round].push(match);
      }
    }
    return acc;
  }, { winners: {}, losers: {}, finals: [] });

  const maxRounds = Math.max(
    ...matches.map(m => m.round)
  );

  const getMatchSpacing = (round: number) => {
    // Exponentially increase spacing for later rounds
    const baseSpacing = 16; // 4rem
    const multiplier = Math.pow(2, round - 1);
    return `${baseSpacing * multiplier}px`;
  };

  const getRoundName = (roundNumber: number) => {
    if (tournament.format === 'SINGLE_ELIMINATION') {
      if (roundNumber === maxRounds) return 'Final';
      if (roundNumber === maxRounds - 1) return 'Semifinal';
      if (roundNumber === maxRounds - 2) return 'Quarterfinal';
      return `Round ${roundNumber}`;
    } else {
      return `Round ${roundNumber}`;
    }
  };
  
  // Tab controls for bracket view
  const BracketViewSelector = () => {
    return (
      <div className="flex mb-6 gap-3">
        <button
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeBracketType === null 
              ? 'bg-purple-500/20 text-white' 
              : 'bg-gray-800/50 text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveBracketType(null)}
        >
          All Brackets
        </button>
        <button
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeBracketType === 'winners' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gray-800/50 text-gray-400 hover:text-green-400'
          }`}
          onClick={() => setActiveBracketType('winners')}
        >
          Winners Bracket
        </button>
        {tournament.format === 'DOUBLE_ELIMINATION' && (
          <>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeBracketType === 'losers' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-gray-800/50 text-gray-400 hover:text-red-400'
              }`}
              onClick={() => setActiveBracketType('losers')}
            >
              Losers Bracket
            </button>
            {matchesByBracket.finals.length > 0 && (
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeBracketType === 'finals' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'bg-gray-800/50 text-gray-400 hover:text-purple-400'
                }`}
                onClick={() => setActiveBracketType('finals')}
              >
                Finals
              </button>
            )}
          </>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex flex-col">
      {/* Show bracket selector only for double elimination */}
      {tournament.format === 'DOUBLE_ELIMINATION' && <BracketViewSelector />}
      
      <div className="flex flex-nowrap gap-12 pb-6 bracket-container">
        {/* Winners Bracket - always show for single elimination, or when no filter or winners filter is active */}
        {(activeBracketType === null || activeBracketType === 'winners' || tournament.format === 'SINGLE_ELIMINATION') && (
          <div id="winners-bracket" className="flex-shrink-0">
            <h2 className="text-xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-300 pb-1 border-b border-green-500/20">
              {tournament.format === 'SINGLE_ELIMINATION' ? 'Tournament Bracket' : 'Winners Bracket'}
            </h2>
            <div className="flex gap-12">
              {Object.entries(matchesByBracket.winners)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([round, roundMatches]) => (
                  <div key={`winners-${round}`} className="flex-shrink-0 w-72">
                    <div className="text-sm font-medium text-gray-400 mb-4 px-2 py-1 bg-green-500/10 rounded-lg inline-block">
                      {getRoundName(Number(round))}
                    </div>
                    <div className="space-y-6">
                      {roundMatches
                        .sort((a, b) => a.match_number - b.match_number)
                        .map((match, index) => (
                          <div
                            key={match.id}
                            style={{
                              marginTop: index > 0 ? getMatchSpacing(Number(round)) : '0'
                            }}
                            className="relative"
                          >
                            <MatchCard
                              match={match}
                              isStaff={isStaff}
                              onScoreUpdate={onMatchUpdate}
                              bracketType={tournament.format === 'SINGLE_ELIMINATION' ? 'winners' : 'winners'}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tournament.format === 'DOUBLE_ELIMINATION' && (
          <>
            {/* Finals - show when no filter or finals filter is active */}
            {(activeBracketType === null || activeBracketType === 'finals') && matchesByBracket.finals.length > 0 && (
              <div id="finals-bracket" className="flex-shrink-0">
                <h2 className="text-xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300 pb-1 border-b border-purple-500/20">
                  Finals
                </h2>
                <div className="mt-16">
                  {matchesByBracket.finals.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isStaff={isStaff}
                      onScoreUpdate={onMatchUpdate}
                      bracketType="finals"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Losers Bracket - show when no filter or losers filter is active */}
            {(activeBracketType === null || activeBracketType === 'losers') && (
              <div id="losers-bracket" className="flex-shrink-0">
                <h2 className="text-xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-300 pb-1 border-b border-red-500/20">
                  Losers Bracket
                </h2>
                <div className="flex gap-12">
                  {Object.entries(matchesByBracket.losers)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([round, roundMatches]) => (
                      <div key={`losers-${round}`} className="flex-shrink-0 w-72">
                        <div className="text-sm font-medium text-gray-400 mb-4 px-2 py-1 bg-red-500/10 rounded-lg inline-block">
                          Round {round}
                        </div>
                        <div className="space-y-6">
                          {roundMatches
                            .sort((a, b) => a.match_number - b.match_number)
                            .map((match, index) => (
                              <div
                                key={match.id}
                                style={{
                                  marginTop: index > 0 ? getMatchSpacing(Number(round)) : '0'
                                }}
                                className="relative"
                              >
                                <MatchCard
                                  match={match}
                                  isStaff={isStaff}
                                  onScoreUpdate={onMatchUpdate}
                                  bracketType="losers"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
