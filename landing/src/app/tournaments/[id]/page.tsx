'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import TopBar from '../../components/TopBar';
import TournamentStaffControls from '@/components/TournamentStaffControls';
import { useToast } from '@/app/components/ToastContext';
import { Tournament, TournamentUpdate } from '@/types/tournament';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

        const res = await fetch(`https://backend-6wqj.onrender.com/tournaments/${id}`, {
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

      const res = await fetch(`https://backend-6wqj.onrender.com/tournaments/${id}/signup`, {
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

      const res = await fetch(`https://backend-6wqj.onrender.com/tournaments/${id}/signup`, {
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

  // Calculate pagination for participants
  const indexOfLastParticipant = currentPage * itemsPerPage;
  const indexOfFirstParticipant = indexOfLastParticipant - itemsPerPage;
  const currentParticipants = tournament ? tournament.participants.slice(indexOfFirstParticipant, indexOfLastParticipant) : [];
  const totalPages = tournament ? Math.ceil(tournament.participants.length / itemsPerPage) : 0;

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

  const isStaff = user?.role === 'staff' || user?.role === 'admin';
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
                    <span className="font-medium">{new Date(tournament.date).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>{' '}
                    <span className={`font-medium ${getStatusColor(tournament.status)}`}>
                      {tournament.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Participants:</span>{' '}
                    <span className="font-medium">{tournament.participant_count}</span>
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

          <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700/50">
            <div className="p-6 pb-4">
              <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Participants
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-t border-gray-700/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">#</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Player</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {tournament.participants.length > 0 ? (
                    currentParticipants.map((participant, index) => (
                      <tr 
                        key={participant.id}
                        className="hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {indexOfFirstParticipant + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <img
                              src={participant.profile_picture || "/images/default-avatar.png"}
                              alt={participant.display_name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-700/50"
                              onError={(e) => {
                                e.currentTarget.src = '/images/default-avatar.png';
                              }}
                            />
                            <Link 
                              href={`/user/${participant.display_name}`}
                              className="text-gray-300 hover:text-white font-medium transition-colors duration-300"
                            >
                              {participant.display_name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                            Registered
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                        <p className="mb-2">No participants yet</p>
                        {tournament.status === 'registration_open' && !tournament.is_signed_up && (
                          <p className="text-sm">Be the first to sign up!</p>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-700/50">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 
                  disabled:hover:bg-purple-500/10 transition-all duration-300"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      currentPage === page
                        ? 'bg-purple-500 text-white'
                        : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 
                  disabled:hover:bg-purple-500/10 transition-all duration-300"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
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
      return 'text-yellow-400';
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
