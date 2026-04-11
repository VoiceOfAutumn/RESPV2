'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageShell from '../../components/PageShell';
import { EditInfoModal } from '@/components/TournamentStaffControls';
import { useToast } from '@/app/components/ToastContext';
import { Tournament, TournamentUpdate, GameData, GameInfo } from '@/types/tournament';
import { API_BASE_URL } from '@/lib/api';
import { Lock, GitBranch, BarChart3, UserPlus } from 'lucide-react';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupAgreed, setSignupAgreed] = useState(false);
  const [showStaffMenu, setShowStaffMenu] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  // Handler for tournament updates that ensures type safety
  const handleTournamentUpdate = (update: TournamentUpdate) => {
    if (!tournament) return;
    setTournamentState({ ...tournament, ...update });
  };

  const handleStatusChange = async (newStatus: Tournament['status']) => {
    setIsUpdatingStatus(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_BASE_URL}/tournaments/${id}/status`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setTournamentState(prev => prev ? { ...prev, status: newStatus } : prev);
        setShowStaffMenu(false);
        showToast({ title: 'Success', message: 'Tournament status updated', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({}));
        showToast({ title: 'Error', message: err.message || 'Failed to update status', type: 'error' });
      }
    } catch {
      showToast({ title: 'Error', message: 'Error updating status', type: 'error' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleGenerateBrackets = async () => {
    setIsUpdatingStatus(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_BASE_URL}/tournaments/${id}/bracket/generate`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        setTournamentState(prev => prev ? { ...prev, status: 'brackets_generated' as const } : prev);
        setShowStaffMenu(false);
        showToast({ title: 'Success', message: 'Brackets generated', type: 'success' });
        router.push(`/tournaments/${id}/bracket`);
      } else {
        const err = await res.json().catch(() => ({}));
        if (err.message?.includes('already been generated')) {
          router.push(`/tournaments/${id}/bracket`);
        } else {
          showToast({ title: 'Error', message: err.message || 'Failed to generate brackets', type: 'error' });
        }
      }
    } catch {
      showToast({ title: 'Error', message: 'Error generating brackets', type: 'error' });
    } finally {
      setIsUpdatingStatus(false);
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
        await fetchTournament();
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
        await fetchTournament();
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
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
        <PageShell />
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent shadow-lg shadow-purple-500/20"></div>
        </div>
      </main>
    );
  }

  if (error || !tournament) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
        <PageShell />
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
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg p-8 border border-gray-700/50 relative">
            {/* Staff controls — top-right */}
            {isStaff && (
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-medium py-1.5 px-4 rounded-lg text-sm
                    transition-all duration-200"
                >
                  Edit Info
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowStaffMenu(!showStaffMenu)}
                    className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 font-medium py-1.5 px-4 rounded-lg text-sm
                      transition-all duration-200"
                  >
                    Staff Actions
                  </button>
                  {showStaffMenu && (
                    <div className="absolute right-0 top-full mt-1 w-56 rounded-lg bg-gray-800 border border-gray-700/50 shadow-xl overflow-hidden">
                      <div className="py-1">
                        <button
                          onClick={() => handleStatusChange('registration_open')}
                          disabled={tournament.status === 'registration_open' || isUpdatingStatus}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 disabled:opacity-40"
                        >
                          Open Registration
                        </button>
                        <button
                          onClick={() => handleStatusChange('registration_closed')}
                          disabled={tournament.status === 'registration_closed' || isUpdatingStatus}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 disabled:opacity-40"
                        >
                          Close Registration
                        </button>
                        {tournament.status === 'registration_closed' && (
                          <button
                            onClick={handleGenerateBrackets}
                            disabled={isUpdatingStatus}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 disabled:opacity-40"
                          >
                            Generate Brackets
                          </button>
                        )}
                        {tournament.status === 'brackets_generated' && (
                          <button
                            onClick={() => handleStatusChange('in_progress')}
                            disabled={isUpdatingStatus}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 disabled:opacity-40"
                          >
                            Start Tournament
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange('completed')}
                          disabled={tournament.status === 'completed' || isUpdatingStatus}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 disabled:opacity-40"
                        >
                          Complete Tournament
                        </button>
                        <button
                          onClick={() => handleStatusChange('cancelled')}
                          disabled={tournament.status === 'cancelled' || isUpdatingStatus}
                          className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700/50 disabled:opacity-40"
                        >
                          Cancel Tournament
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                    <span className="text-gray-400">Signup Closes:</span>{' '}
                    {tournament.signup_close_date ? (
                      <span className="font-medium">{new Date(tournament.signup_close_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}{' '}{new Date(tournament.signup_close_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} <span className="text-gray-500 text-xs">UTC</span></span>
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
                </div>                <div className="flex flex-wrap gap-3 pt-4">
                  {/* Bracket button */}
                  {tournament.status === 'registration_open' || tournament.status === 'registration_closed' ? (
                    <div className="relative group">
                      <button
                        disabled
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white/[0.04] text-gray-600 border border-white/[0.06] cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                        Bracket
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700/50 text-xs text-gray-300 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-20">
                        Brackets have not yet been generated
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 border-b border-r border-gray-700/50 rotate-45 -mt-1" />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push(`/tournaments/${id}/bracket`)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 transition-all"
                    >
                      <GitBranch className="w-4 h-4" />
                      Bracket
                    </button>
                  )}

                  {/* Predictions button */}
                  {tournament.status === 'registration_open' || tournament.status === 'registration_closed' ? (
                    <div className="relative group">
                      <button
                        disabled
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white/[0.04] text-gray-600 border border-white/[0.06] cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                        Predictions
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700/50 text-xs text-gray-300 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-20">
                        Predictions are not available until the bracket has been generated
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 border-b border-r border-gray-700/50 rotate-45 -mt-1" />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push(`/tournaments/${id}/predictions`)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 transition-all"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Predictions
                    </button>
                  )}

                  {/* Sign Up button */}
                  {canSignUp && (
                    <button
                      onClick={() => { setSignupAgreed(false); setShowSignupModal(true); }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
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

          {/* Sign-up Confirmation Modal */}
          {showSignupModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSignupModal(false)}>
              <div className="bg-neutral-900 border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4">Confirm Sign Up</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  Before signing up, please make sure you&apos;ve read our{' '}
                  <Link href="/guide" className="text-purple-400 hover:text-purple-300 underline">New Player Guide</Link>{' '}
                  and our{' '}
                  <Link href="/rules" className="text-purple-400 hover:text-purple-300 underline">Rules &amp; Guidelines</Link>.
                  These contain important information about how our tournaments work and what is expected of all participants.
                  Not following these guidelines can lead to disqualification, so please ensure you understand them before signing up.
                </p>
                <label className="flex items-start gap-3 cursor-pointer group mb-6">
                  <input
                    type="checkbox"
                    checked={signupAgreed}
                    onChange={(e) => setSignupAgreed(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-gray-300 text-sm leading-relaxed group-hover:text-white transition-colors">
                    By checking this box, you agree to have read the guides and shall follow the rules to uphold fair play throughout the tournament.
                  </span>
                </label>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowSignupModal(false)}
                    className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-700/50 text-gray-300 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setShowSignupModal(false); handleSignup(); }}
                    disabled={!signupAgreed}
                    className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          )}

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

          {/* Edit Info Modal */}
          {showEditModal && tournament && (
            <EditInfoModal
              tournament={tournament}
              onClose={() => setShowEditModal(false)}
              onSave={(updated) => {
                handleTournamentUpdate({ id: tournament.id, ...updated });
                setShowEditModal(false);
              }}
            />
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
    case 'brackets_generated':
      return 'text-cyan-400';
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
