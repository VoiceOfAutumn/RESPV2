'use client';

import React, { useEffect, useState } from 'react';
import { Match, Tournament } from '@/app/tournament/[id]/bracket/types';
import SingleEliminationBracket from '@/components/SingleEliminationBracket';

interface Participant {
  id: number;
  name: string;
  profilePicture?: string;
}

interface HybridBracketProps {
  tournamentId: string;
  tournament: Tournament;
  matches: Match[];
  isStaff?: boolean;
  onMatchUpdate?: (matchId: number, player1Score: number, player2Score: number) => Promise<void>;
  bracketType?: 'all' | 'winners' | 'losers' | 'finals';
}

/**
 * Always use the new SingleEliminationBracket component
 * This component fetches participants and renders the bracket using the new logic
 */
export default function HybridBracket({ 
  tournamentId, 
  tournament, 
  matches, 
  isStaff = false, 
  onMatchUpdate, 
  bracketType = 'all' 
}: HybridBracketProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Always fetch participants to use the new bracket component
  useEffect(() => {
    const fetchParticipants = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`http://localhost:3000/tournaments/${tournamentId}/participants`, {
          credentials: 'include'
        });
        
        if (res.ok) {
          const participantsData = await res.json();
          const formattedParticipants = participantsData.map((p: any) => ({
            id: p.id,
            name: p.display_name,
            profilePicture: p.profile_picture
          }));
          setParticipants(formattedParticipants);
        } else {
          throw new Error('Failed to fetch participants');
        }
      } catch (err) {
        console.error('Error fetching participants:', err);
        setError(err instanceof Error ? err.message : 'Failed to load participants');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [tournamentId]);

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
        <div className="text-gray-400">Loading tournament bracket...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-lg mb-4">Error loading bracket</div>
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    );
  }

  // No participants available
  if (participants.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">No participants registered</div>
        <div className="text-sm text-gray-500">
          Players need to register before brackets can be generated
        </div>
      </div>
    );
  }

  // Check if brackets have been officially generated
  const hasOfficialBrackets = matches.length > 0;
  const tournamentInProgress = tournament.status === 'in_progress' || tournament.status === 'completed';
  
  // Only show brackets if:
  // 1. Brackets have been officially generated (matches exist), OR
  // 2. Tournament is in progress/completed, OR  
  // 3. User is staff and wants to see a preview
  const shouldShowBracket = hasOfficialBrackets || tournamentInProgress || isStaff;

  if (!shouldShowBracket) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">Brackets Not Generated</div>
        <div className="text-sm text-gray-500 mb-4">
          Tournament brackets will be available once a staff member generates them.
        </div>
        <div className="text-xs text-blue-400 bg-blue-500/20 px-3 py-2 rounded-lg inline-block">
          Tournament Status: {tournament.status.replace('_', ' ').toUpperCase()} • {participants.length} participants registered
        </div>
      </div>
    );
  }

  // Always render with the new SingleEliminationBracket component
  return (
    <div>
      {/* Always use the new bracket component */}
      <SingleEliminationBracket 
        participants={participants}
        matches={matches}
        isStaff={isStaff && hasOfficialBrackets} // Only allow score updates if brackets are official
        onMatchUpdate={hasOfficialBrackets ? onMatchUpdate : undefined} // Only allow updates for official brackets
        tournamentName={tournament.name} // Pass the tournament name
        className="w-full"
      />
      
      {/* Additional info for staff */}
      {isStaff && (
        <div className={`mt-6 p-4 border rounded-lg ${
          hasOfficialBrackets 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-yellow-500/10 border-yellow-500/20'
        }`}>
          <h4 className={`font-medium mb-2 ${
            hasOfficialBrackets ? 'text-green-400' : 'text-yellow-400'
          }`}>
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
                <li>• Participants are randomly shuffled for fair seeding</li>
                <li>• BYEs are properly handled in Round 1 only</li>
                <li>• Use "Generate Bracket" to create official matches for score tracking</li>
                <li>• Tournament status: {tournament.status.replace('_', ' ').toUpperCase()}</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
