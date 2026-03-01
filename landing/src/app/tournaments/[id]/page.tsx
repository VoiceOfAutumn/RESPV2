'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import TopBar from '../../components/TopBar';
import TournamentStaffControls from '@/components/TournamentStaffControls';
import { useToast } from '@/app/components/ToastContext';
import { Tournament, TournamentUpdate, GameData, GameInfo } from '@/types/tournament';
import { API_BASE_URL } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

interface User {
  role?: 'user' | 'staff' | 'admin';
}

export default function TournamentDetailPage() {
  const { id } = useParams();
  const [tournament, setTournamentState] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  // Handler for tournament updates that ensures type safety
  const handleTournamentUpdate = (update: TournamentUpdate) => {
    if (!tournament) return;
    setTournamentState({ ...tournament, ...update });
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Use the same auth method as TopBar - through Next.js API route
        const authToken = localStorage.getItem('authToken');
        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers
        });
        
        if (res.ok) {
          const userData = await res.json();
          if (userData.isLoggedIn && userData.user) {
            setUser({
              role: userData.user.role
            });
            console.log('Tournament page - User role:', userData.user.role);
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    const fetchTournament = async () => {
      try {
        // Include auth token to get proper signup status
        const authToken = localStorage.getItem('authToken');
        const headers: HeadersInit = {};
        
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const res = await fetch(`${API_BASE_URL}/tournaments/${id}`, {
          headers,
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          console.log('Tournament data with signup status:', data);
          setTournamentState(data);
        } else {
          setError('Tournament not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    fetchTournament();
  }, [id]);

  const handleSignup = async () => {
    try {
      // Get auth token for authentication
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {};
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/tournaments/${id}/signup`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      
      if (res.ok && tournament) {
        handleTournamentUpdate({
          id: tournament.id,
          is_signed_up: true,
          participant_count: tournament.participant_count + 1
        });
        showToast({
          title: 'Success',
          message: 'Successfully signed up for tournament!',
          type: 'success'
        });
      } else {
        const error = await res.json();
        showToast({
          title: 'Error',
          message: error.message || 'Failed to sign up for tournament',
          type: 'error'
        });
      }
    } catch (err) {
      showToast({
        title: 'Error',
        message: 'Error signing up for tournament',
        type: 'error'
      });
    }
  };

  const handleCancelSignup = async () => {
    try {
      // Get auth token for authentication
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {};
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/tournaments/${id}/signup`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      
      if (res.ok && tournament) {
        handleTournamentUpdate({
          id: tournament.id,
          is_signed_up: false,
          participant_count: tournament.participant_count - 1
        });
        showToast({
          title: 'Success',
          message: 'Successfully cancelled tournament signup',
          type: 'success'
        });
      } else {
        const error = await res.json();
        showToast({
          title: 'Error',
          message: error.message || 'Failed to cancel tournament signup',
          type: 'error'
        });
      }
    } catch (err) {
      showToast({
        title: 'Error',
        message: 'Error cancelling tournament signup',
        type: 'error'
      });
    }
  };

  const handleViewBracket = () => {
    router.push(`/tournaments/${id}/bracket`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
        <TopBar />
        <Navbar />
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent shadow-lg shadow-purple-500/20"></div>
        </div>
      </main>
    );
  }

  if (error || !tournament) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
        <TopBar />
        <Navbar />
        <div className="flex justify-center items-center h-full">
          <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg p-6 border border-red-500/20">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-500 font-medium">{error || 'Tournament not found'}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isStaff = user?.role === 'admin';
  const canSignUp = tournament.status === 'registration_open' && user && !tournament.is_signed_up;
  const canCancel = tournament.status === 'registration_open' && user && tournament.is_signed_up;

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg p-8 border border-gray-700/50">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-1/3">
                <div className="relative aspect-video w-full">
                  <img
                    src={tournament.image || '/images/default-avatar.png'}
                    alt={tournament.name}
                    className="rounded-lg object-cover w-full h-full ring-1 ring-gray-700/50"
                  />
                </div>
              </div>
              
              <div className="flex-1 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    {tournament.name}
                  </h1>
                  <p className="text-gray-400 mt-2">{tournament.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Date:</span>{' '}
                    {tournament.date ? (
                      <span className="font-medium">{new Date(tournament.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}{' '}{new Date(tournament.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} <span className="text-gray-500 text-xs">UTC</span></span>
                    ) : (
                      <span className="font-medium">T.B.D.</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>{' '}
                    <span className={`font-medium ${getStatusColor(tournament.status)}`}>
                      {tournament.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                </div>                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => router.push(`/tournaments/${id}/bracket`)}
                    className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 font-semibold py-2 px-6 rounded-lg 
                      transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    View Bracket
                  </button>

                  {canSignUp && (
                    <button
                      onClick={handleSignup}
                      className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 font-semibold py-2 px-6 rounded-lg 
                        transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sign Up
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={handleCancelSignup}
                      className="bg-red-500/10 text-red-400 hover:bg-red-500/20 font-semibold py-2 px-6 rounded-lg 
                        transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      Cancel Signup
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Game Information Section */}
          {tournament.game_data && (
            <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 mb-4">
                Game Information
              </h2>
              {tournament.game_data.differsPerRound && tournament.game_data.rounds ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(['round_of_128', 'round_of_64', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'] as const)
                    .filter((roundKey) => {
                      const info = tournament.game_data!.rounds![roundKey];
                      return info && (info.gameName || info.platform || info.challengeDescription);
                    })
                    .map((roundKey) => {
                      const info = tournament.game_data!.rounds![roundKey];
                      const labels: Record<string, string> = {
                        round_of_128: 'Round of 128',
                        round_of_64: 'Round of 64',
                        round_of_32: 'Round of 32',
                        round_of_16: 'Round of 16',
                        quarter_final: 'Quarter-Final',
                        semi_final: 'Semi-Final',
                        final: 'Final',
                      };
                      return (
                        <div key={roundKey} className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
                          <h3 className="text-sm font-semibold text-purple-400 mb-2">{labels[roundKey] || roundKey}</h3>
                          {info.gameName && (
                            <p className="text-sm"><span className="text-gray-400">Game:</span> <span className="text-white">{info.gameName}</span></p>
                          )}
                          {info.platform && (
                            <p className="text-sm"><span className="text-gray-400">Platform:</span> {info.platformUrl ? (
                              <a href={info.platformUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">{info.platform}</a>
                            ) : (
                              <span className="text-white">{info.platform}</span>
                            )}</p>
                          )}
                          {info.challengeDescription && (
                            <p className="text-sm mt-1"><span className="text-gray-400">Challenge:</span> <span className="text-white">{info.challengeDescription}</span></p>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : tournament.game_data.game ? (
                <div className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/30 max-w-md">
                  {tournament.game_data.game.gameName && (
                    <p className="text-sm"><span className="text-gray-400">Game:</span> <span className="text-white">{tournament.game_data.game.gameName}</span></p>
                  )}
                  {tournament.game_data.game.platform && (
                    <p className="text-sm"><span className="text-gray-400">Platform:</span> {tournament.game_data.game.platformUrl ? (
                      <a href={tournament.game_data.game.platformUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">{tournament.game_data.game.platform}</a>
                    ) : (
                      <span className="text-white">{tournament.game_data.game.platform}</span>
                    )}</p>
                  )}
                  {tournament.game_data.game.challengeDescription && (
                    <p className="text-sm mt-1"><span className="text-gray-400">Challenge:</span> <span className="text-white">{tournament.game_data.game.challengeDescription}</span></p>
                  )}
                </div>
              ) : null}
            </div>
          )}

          <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Participants
              </h2>
              <span className="text-sm text-gray-400">{tournament.participants.length} player{tournament.participants.length !== 1 ? 's' : ''}</span>
            </div>

            {tournament.participants.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tournament.participants.map((participant) => (
                  <div key={participant.id} className="relative group">
                    <Link href={`/user/${participant.display_name}`}>
                      <img
                        src={participant.profile_picture || "/images/default-avatar.png"}
                        alt={participant.display_name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-700/50 hover:ring-purple-500/50 transition-all duration-200 cursor-pointer"
                        onError={(e) => {
                          e.currentTarget.src = '/images/default-avatar.png';
                        }}
                      />
                    </Link>
                    {/* Hover popover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50">
                      <div className="bg-gray-900 border border-gray-700/50 rounded-xl shadow-xl p-3 flex items-center gap-3 w-max">
                        <img
                          src={participant.profile_picture || "/images/default-avatar.png"}
                          alt={participant.display_name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30 flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = '/images/default-avatar.png';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-sm">{participant.display_name}</p>
                          <p className="text-gray-400 text-xs">Rank #{participant.site_rank ?? '—'}</p>
                          <p className="text-gray-500 text-xs">{participant.points ?? 0} EXP</p>
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="w-3 h-3 bg-gray-900 border-b border-r border-gray-700/50 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                <p className="mb-1">No participants yet</p>
                {tournament.status === 'registration_open' && !tournament.is_signed_up && (
                  <p className="text-sm">Be the first to sign up!</p>
                )}
              </div>
            )}
          </div>

          {/* Staff Controls */}
          {isStaff && (
            <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700/50 p-6">
              <TournamentStaffControls tournament={tournament} setTournament={handleTournamentUpdate} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'registration_open':
      return 'text-green-400';
    case 'registration_closed':
      return 'text-red-400';
    case 'in_progress':
      return 'text-blue-400';
    case 'completed':
      return 'text-purple-400';
    case 'cancelled':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};
