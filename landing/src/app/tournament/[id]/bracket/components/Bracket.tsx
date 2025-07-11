'use client';

import React from 'react';
import { Match, Tournament } from '../types';
import MatchCard from './MatchCard';

interface BracketProps {
  matches: Match[];
  tournament: Tournament;
  isStaff?: boolean;
  onMatchUpdate?: (matchId: number, player1Score: number, player2Score: number) => Promise<void>;
  activeBracketType?: 'all' | 'winners' | 'losers' | 'finals';
}

export default function Bracket({ matches, tournament, isStaff = false, onMatchUpdate }: BracketProps) {
  return (
    <div className="bracket-container">
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-white">Tournament Bracket</h2>
        
        <div className="grid gap-4">
          {matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              isStaff={isStaff}
              onScoreUpdate={onMatchUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}