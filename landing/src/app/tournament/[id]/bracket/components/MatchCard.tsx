'use client';

import { useState } from 'react';
import { Match } from '../types';

interface MatchCardProps {
  match: Match;
  isStaff?: boolean;
  onScoreUpdate?: (matchId: number, player1Score: number, player2Score: number) => Promise<void>;
  bracketType: 'winners' | 'losers' | 'finals';
}

export default function MatchCard({ match, isStaff = false, onScoreUpdate, bracketType }: MatchCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [player1Score, setPlayer1Score] = useState(match.player1_score || 0);
  const [player2Score, setPlayer2Score] = useState(match.player2_score || 0);
  const [loading, setLoading] = useState(false);

  const handleScoreUpdate = async () => {
    if (!onScoreUpdate) return;
    
    setLoading(true);
    try {
      await onScoreUpdate(match.id, player1Score, player2Score);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating score:', error);
    } finally {
      setLoading(false);
    }
  };
  const getBackgroundColor = () => {
    switch (bracketType) {
      case 'winners':
        return 'bg-neutral-800/50 hover:bg-neutral-700/50';
      case 'losers':
        return 'bg-neutral-800/50 hover:bg-neutral-700/50';
      case 'finals':
        return 'bg-neutral-800/50 hover:bg-neutral-700/50';
    }
  };

  const getBorderColor = () => {
    switch (bracketType) {
      case 'winners':
        return 'border-green-500/30';
      case 'losers':
        return 'border-red-500/30';
      case 'finals':
        return 'border-purple-500/30';
    }
  };
  return (
    <div className={`p-4 rounded-lg border backdrop-blur ${getBorderColor()} ${getBackgroundColor()} transition-colors duration-300 shadow-lg`}>
      {match.bye_match ? (
        <div className="text-sm text-gray-400 text-center font-medium">
          Bye Match
        </div>
      ) : (
        <div className="space-y-3">
          {/* Player 1 */}
          <div className={`flex justify-between items-center p-2 ${match.winner_id === match.player1_id ? 'bg-green-500/10 rounded-md' : ''}`}>            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex-shrink-0 relative">
                {match.player1_name ? (
                  <img
                    src={match.player1_picture || '/images/default-avatar.png'}
                    alt={match.player1_name}
                    className="w-full h-full rounded-full object-cover ring-1 ring-gray-700/50"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700/50 rounded-full" />
                )}
              </div>
              <span className={`text-sm ${match.winner_id === match.player1_id ? 'font-semibold text-green-400' : 'text-gray-300'}`}>
                {match.player1_name || 'TBD'}
              </span>
            </div>
            <div>
              {isEditing && isStaff ? (
                <input
                  type="number"
                  min="0"
                  value={player1Score}
                  onChange={(e) => setPlayer1Score(parseInt(e.target.value) || 0)}
                  className="w-16 text-center bg-gray-800 border border-gray-600 rounded text-white p-1 text-sm"
                />
              ) : (
                <span className={`inline-block min-w-8 text-center py-1 px-2 rounded ${match.player1_score !== null ? 'bg-gray-700/50' : ''} text-sm font-medium`}>
                  {match.player1_score ?? '-'}
                </span>
              )}
            </div>
          </div>

          {/* Player 2 */}
          <div className={`flex justify-between items-center p-2 ${match.winner_id === match.player2_id ? 'bg-green-500/10 rounded-md' : ''}`}>            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex-shrink-0 relative">
                {match.player2_name ? (
                  <img
                    src={match.player2_picture || '/images/default-avatar.png'}
                    alt={match.player2_name}
                    className="w-full h-full rounded-full object-cover ring-1 ring-gray-700/50"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700/50 rounded-full" />
                )}
              </div>
              <span className={`text-sm ${match.winner_id === match.player2_id ? 'font-semibold text-green-400' : 'text-gray-300'}`}>
                {match.player2_name || 'TBD'}
              </span>
            </div>
            <div>
              {isEditing && isStaff ? (
                <input
                  type="number"
                  min="0"
                  value={player2Score}
                  onChange={(e) => setPlayer2Score(parseInt(e.target.value) || 0)}
                  className="w-16 text-center bg-gray-800 border border-gray-600 rounded text-white p-1 text-sm"
                />
              ) : (
                <span className={`inline-block min-w-8 text-center py-1 px-2 rounded ${match.player2_score !== null ? 'bg-gray-700/50' : ''} text-sm font-medium`}>
                  {match.player2_score ?? '-'}
                </span>
              )}
            </div>
          </div>

          {/* Staff Controls */}
          {isStaff && !match.bye_match && (
            <div className="mt-3 flex justify-end space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      // Reset scores to original values
                      setPlayer1Score(match.player1_score || 0);
                      setPlayer2Score(match.player2_score || 0);
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs border border-gray-600 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScoreUpdate}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-all duration-300"
                >
                  Edit Score
                </button>              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}