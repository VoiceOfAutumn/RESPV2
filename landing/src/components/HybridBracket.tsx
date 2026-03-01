'use client';

import React, { useEffect, useState } from 'react';
import SingleEliminationBracket from '@/components/SingleEliminationBracket';
import { Match, Tournament } from '@/app/tournament/[id]/bracket/types';

interface HybridBracketProps {
  tournamentId: string;
  tournament: Tournament;
  matches: Match[];
  isStaff?: boolean;
  onMatchUpdate?: (matchId: number, player1Score: number, player2Score: number) => Promise<void>;
  onVodUpdate?: (matchId: number, vodUrl: string | null) => Promise<void>;
  bracketType?: 'all' | 'winners' | 'losers' | 'finals';
}

export default function HybridBracket({
  tournamentId,
  tournament,
  matches,
  isStaff = false,
  onMatchUpdate,
  onVodUpdate,
  bracketType = 'all',
}: HybridBracketProps) {
  const hasOfficialBrackets = matches.length > 0;
  const tournamentInProgress = tournament.status === 'brackets_generated' || tournament.status === 'in_progress' || tournament.status === 'completed';

  // Filter matches by bracket type for double elimination
  const filteredMatches = bracketType === 'all'
    ? matches
    : matches.filter((m) => m.bracket === bracketType);

  if (!hasOfficialBrackets && !tournamentInProgress) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">Brackets Not Generated</div>
        <div className="text-sm text-gray-500 mb-4">
          Tournament brackets will be available once a staff member generates them.
        </div>
        <div className="text-xs text-blue-400 bg-blue-500/20 px-3 py-2 rounded-lg inline-block">
          Tournament Status: {tournament.status.replace('_', ' ').toUpperCase()}
        </div>
      </div>
    );
  }

  if (filteredMatches.length === 0 && bracketType !== 'all') {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">
          No {bracketType.charAt(0).toUpperCase() + bracketType.slice(1)} Bracket Matches
        </div>
        <div className="text-sm text-gray-500">
          There are no matches in the {bracketType} bracket yet.
        </div>
      </div>
    );
  }

  // Determine section label based on bracket type
  const sectionLabel =
    bracketType === 'winners'
      ? 'Winners Bracket'
      : bracketType === 'losers'
      ? 'Losers Bracket'
      : bracketType === 'finals'
      ? 'Grand Finals'
      : tournament.format === 'DOUBLE_ELIMINATION'
      ? 'All Brackets'
      : 'Tournament Bracket';

  return (
    <div>
      {/* Render bracket sections */}
      {bracketType === 'all' && tournament.format === 'DOUBLE_ELIMINATION' ? (
        <>
          {/* Winners bracket */}
          {(() => {
            const winnersMatches = matches.filter((m) => m.bracket === 'winners');
            return winnersMatches.length > 0 ? (
              <div id="winners-bracket" className="mb-8">
                <h3 className="text-green-400 font-semibold text-lg mb-4">Winners Bracket</h3>
                <SingleEliminationBracket
                  matches={winnersMatches}
                  isStaff={isStaff}
                  onMatchUpdate={onMatchUpdate}
                  onVodUpdate={onVodUpdate}
                  tournamentName=""
                  className="w-full"
                />
              </div>
            ) : null;
          })()}

          {/* Losers bracket */}
          {(() => {
            const losersMatches = matches.filter((m) => m.bracket === 'losers');
            return losersMatches.length > 0 ? (
              <div id="losers-bracket" className="mb-8">
                <h3 className="text-red-400 font-semibold text-lg mb-4">Losers Bracket</h3>
                <SingleEliminationBracket
                  matches={losersMatches}
                  isStaff={isStaff}
                  onMatchUpdate={onMatchUpdate}
                  onVodUpdate={onVodUpdate}
                  tournamentName=""
                  className="w-full"
                />
              </div>
            ) : null;
          })()}

          {/* Finals */}
          {(() => {
            const finalsMatches = matches.filter((m) => m.bracket === 'finals');
            return finalsMatches.length > 0 ? (
              <div id="finals-bracket" className="mb-8">
                <h3 className="text-purple-400 font-semibold text-lg mb-4">Grand Finals</h3>
                <SingleEliminationBracket
                  matches={finalsMatches}
                  isStaff={isStaff}
                  onMatchUpdate={onMatchUpdate}
                  onVodUpdate={onVodUpdate}
                  tournamentName=""
                  className="w-full"
                />
              </div>
            ) : null;
          })()}
        </>
      ) : (
        <SingleEliminationBracket
          matches={filteredMatches}
          isStaff={isStaff}
          onMatchUpdate={onMatchUpdate}
          onVodUpdate={onVodUpdate}
          tournamentName={tournament.name}
          className="w-full"
        />
      )}

      {/* Staff info */}
      {isStaff && (
        <div
          className={`mt-6 p-4 border rounded-lg ${
            hasOfficialBrackets
              ? 'bg-green-500/10 border-green-500/20'
              : 'bg-yellow-500/10 border-yellow-500/20'
          }`}
        >
          <h4
            className={`font-medium mb-2 ${
              hasOfficialBrackets ? 'text-green-400' : 'text-yellow-400'
            }`}
          >
            {hasOfficialBrackets ? '✅ Official Tournament Brackets' : '⚠️ Preview Mode'}
          </h4>
          <ul className="text-sm text-gray-300 space-y-1">
            {hasOfficialBrackets ? (
              <>
                <li>• Official brackets have been generated</li>
                <li>• Match results are being tracked</li>
                <li>• Tournament status: {tournament.status.replace('_', ' ').toUpperCase()}</li>
                <li>• Click on matches to update scores</li>
              </>
            ) : (
              <>
                <li>• This is a preview of the bracket structure</li>
                <li>• Use &quot;Generate Bracket&quot; to create official matches</li>
                <li>• Tournament status: {tournament.status.replace('_', ' ').toUpperCase()}</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
