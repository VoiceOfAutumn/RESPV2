'use client';

import { useState } from 'react';
import TournamentSeeding from './TournamentSeeding';
import { useToast } from '@/app/components/ToastContext';

import { Tournament, TournamentUpdate } from '@/types/tournament';

interface Props {
  tournament: Tournament;
  setTournament: (tournament: TournamentUpdate) => void;
}

export default function TournamentStaffControls({ tournament, setTournament }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { showToast } = useToast();
  const updateStatus = async (newStatus: Tournament['status']) => {
    setIsUpdating(true);

    try {
      const res = await fetch(`http://localhost:3000/tournaments/${tournament.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });      if (res.ok) {
        setTournament({ id: tournament.id, status: newStatus });
        showToast({
          title: 'Success',
          message: 'Tournament status updated successfully',
          type: 'success'
        });
      } else {
        const error = await res.json();
        showToast({
          title: 'Error',
          message: error.message || 'Failed to update tournament status',
          type: 'error'
        });
      }
    } catch (err) {
      showToast({
        title: 'Error',
        message: 'Error updating tournament status',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };
  const generateBracket = async () => {
    if (tournament.seedType === 'MANUAL' && tournament.status === 'registration_closed') {
      showToast({
        title: 'Info',
        message: 'Please set up participant seeding before generating the bracket',
        type: 'info'
      });
      return;
    }

    setIsUpdating(true);

    try {
      const res = await fetch(`http://localhost:3000/tournaments/${tournament.id}/bracket/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ format: tournament.format }),
      });

      if (res.ok) {
        const newStatus = 'in_progress';
        setTournament({ ...tournament, status: newStatus });
        showToast({
          title: 'Success',
          message: 'Tournament bracket generated successfully',
          type: 'success'
        });
      } else {
        const error = await res.json();
        showToast({
          title: 'Error',
          message: error.message || 'Failed to generate bracket',
          type: 'error'
        });
      }
    } catch (err) {
      showToast({
        title: 'Error',
        message: 'Error generating tournament bracket',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-xl font-semibold mb-4">Staff Controls</h2>
      
      <div className="space-y-6">
        {tournament.status === 'registration_open' && (
          <div>
            <button
              onClick={() => updateStatus('registration_closed')}
              disabled={isUpdating}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-yellow-400"
            >
              Close Registration
            </button>
          </div>
        )}

        {tournament.status === 'registration_closed' && (
          <div className="space-y-6">
            {tournament.seedType === 'MANUAL' && (
              <TournamentSeeding
                tournamentId={tournament.id}
                participants={tournament.participants}
                onSeedingComplete={generateBracket}
              />
            )}
            
            {tournament.seedType === 'RANDOM' && (
              <button
                onClick={generateBracket}
                disabled={isUpdating}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-400"
              >
                Generate Bracket
              </button>
            )}
          </div>
        )}

        {tournament.status === 'in_progress' && tournament.format === 'DOUBLE_ELIMINATION' && (
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-medium text-blue-800 mb-2">Double Elimination Format</h3>
            <p className="text-blue-600 text-sm">
              Players who lose in the winner's bracket will move to the loser's bracket.
              The tournament ends when a player from either bracket wins the final match.
            </p>
          </div>
        )}

        {tournament.status === 'in_progress' && (
          <button
            onClick={() => updateStatus('completed')}
            disabled={isUpdating}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-purple-400"
          >
            End Tournament
          </button>
        )}

        <button
          onClick={() => updateStatus('cancelled')}
          disabled={isUpdating}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-400"
        >
          Cancel Tournament
        </button>
      </div>
    </div>
  );
}