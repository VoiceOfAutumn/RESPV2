'use client';

import { Match, Tournament } from '../types';
import MatchCard from './MatchCard';

interface BracketProps {
  matches: Match[];
  tournament: Tournament;
  isStaff?: boolean;
  onMatchUpdate?: (matchId: number, player1Score: number, player2Score: number) => Promise<void>;
}

export default function Bracket({ matches, tournament, isStaff = false, onMatchUpdate }: BracketProps) {
  // Group matches by bracket type and round
  const matchesByBracket = matches.reduce<{
    winners: { [key: number]: Match[] };
    losers: { [key: number]: Match[] };
    finals: Match[];
  }>((acc, match) => {
    if (match.bracket === 'finals') {
      acc.finals.push(match);
    } else {
      const bracketType = match.bracket || 'winners';
      if (!acc[bracketType][match.round]) {
        acc[bracketType][match.round] = [];
      }
      acc[bracketType][match.round].push(match);
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
  return (
    <div className="flex flex-nowrap gap-12 pb-6 bracket-container">
      {/* Winners Bracket */}
      <div className="flex-shrink-0">
        <h2 className="text-xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-300 pb-1 border-b border-green-500/20">
          Winners Bracket
        </h2>
        <div className="flex gap-12">
          {Object.entries(matchesByBracket.winners)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([round, roundMatches]) => (
              <div key={`winners-${round}`} className="flex-shrink-0 w-72">
                <div className="text-sm font-medium text-gray-400 mb-4 px-2 py-1 bg-green-500/10 rounded-lg inline-block">
                  Round {round}
                  {Number(round) === maxRounds && tournament.format === 'SINGLE_ELIMINATION' && ' (Final)'}
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
                          bracketType="winners"
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {tournament.format === 'DOUBLE_ELIMINATION' && (
        <>
          {/* Finals */}
          {matchesByBracket.finals.length > 0 && (
            <div className="flex-shrink-0">
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

          {/* Losers Bracket */}
          <div className="flex-shrink-0">
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
        </>
      )}
    </div>
  );
}