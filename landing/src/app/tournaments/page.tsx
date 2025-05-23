'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import { Search, Calendar, Users, TrendingUp } from 'lucide-react';

interface Tournament {
  id: number;
  name: string;
  date: string;
  status: string;
  format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
  participant_count: number;
}

interface User {
  role?: 'user' | 'staff' | 'admin';
  displayName?: string;
  profile_picture?: string;
}

interface DropdownPortalProps {
  children: React.ReactNode;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

const DropdownPortal = ({ children, buttonRef }: DropdownPortalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !buttonRef.current) return null;

  const rect = buttonRef.current.getBoundingClientRect();
  const top = rect.bottom + window.scrollY;
  const right = window.innerWidth - rect.right;

  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        right: `${right}px`,
        zIndex: 9999,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const itemsPerPage = 10;

  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const actionButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('Fetching user data...');
        const res = await fetch('http://localhost:3000/user/me', {
          credentials: 'include'
        });
        console.log('Response status:', res.status);
        if (res.ok) {
          const userData = await res.json();
          console.log('User data:', userData);
          setUser(userData);
        } else {
          console.log('Failed to fetch user data:', await res.text());
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    console.log('Current user state:', user);
    console.log('Staff status:', isStaff);
  }, [user, isStaff]);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:3000/tournaments', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        const sortedTournaments = data.sort((a: Tournament, b: Tournament) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setTournaments(sortedTournaments);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch tournaments:', err);
        setLoading(false);
      });
  }, []);

  const handleStatusChange = async (tournamentId: number, newStatus: string) => {
    try {
      console.log(`Attempting to change tournament ${tournamentId} status to ${newStatus}`);
      const response = await fetch(`http://localhost:3000/tournaments/${tournamentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });      console.log('Status change response:', response.status);
      
      let errorMessage;
      try {
        const responseData = await response.json();
        console.log('Status change response data:', responseData);

        if (response.ok) {
          // Update the tournament status locally
          setTournaments(tournaments.map(t => 
            t.id === tournamentId ? { ...t, status: newStatus } : t
          ));
          setShowActionMenu(null);
          return;
        }
        
        errorMessage = responseData.error || responseData.message || 'Failed to update tournament status';
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        errorMessage = 'Invalid server response';
      }      // If we get here, there was an error
      console.error('Failed to update tournament status:', errorMessage);
      alert(`Failed to update tournament status: ${errorMessage}`);
      throw new Error(errorMessage);
    } catch (error) {
      console.error('Failed to update tournament status:', error instanceof Error ? error.message : error);
      // Show a user-friendly error message
      alert(error instanceof Error ? error.message : 'Failed to update tournament status');
    }
  };  const handleGenerateBrackets = async (tournamentId: number) => {
    try {
      console.log(`Attempting to generate brackets for tournament ${tournamentId}`);
      const response = await fetch(`http://localhost:3000/tournaments/${tournamentId}/bracket/generate`, {
        method: 'POST',
        credentials: 'include',
      });

      console.log('Generate brackets response:', response.status);

      // First check if the response is OK
      if (response.ok) {
        // Try to parse the response as JSON
        try {
          const responseData = await response.json();
          console.log('Generate brackets response data:', responseData);
          router.push(`/tournaments/${tournamentId}/bracket`);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          // Don't throw, just navigate to brackets
          router.push(`/tournaments/${tournamentId}/bracket`);
        }
      } else {
        // Try to get error message from response
        let errorMessage = 'Failed to generate brackets';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If we can't parse the error response, try to get text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            // If all else fails, use the status text
            errorMessage = response.statusText || errorMessage;
          }
        }
        
        console.error('Failed to generate brackets:', errorMessage);
        
        // If brackets already exist, just navigate to the bracket page
        if (errorMessage.includes('already been generated')) {
          router.push(`/tournaments/${tournamentId}/bracket`);
          return;
        }
        
        throw new Error(errorMessage);      }
    } catch (error) {
      console.error('Failed to generate brackets:', error);
      // Show error toast
      alert(error instanceof Error ? error.message : 'Failed to generate brackets');
    }
  };

  // Filter tournaments based on search term
  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);
  const paginatedTournaments = filteredTournaments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

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

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'bg-green-500/10 text-green-400';
      case 'registration_closed':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-400';
      case 'completed':
        return 'bg-purple-500/10 text-purple-400';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <Navbar />
      <TopBar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">Tournaments</h1>
          
          {isStaff && (
            <Link
              href="/tournaments/create"
              className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 font-semibold py-2 px-6 rounded-lg 
                transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Create Tournament
            </Link>
          )}
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-900/50 text-white placeholder-gray-400 rounded-lg border border-gray-700/50 
                focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent shadow-lg shadow-purple-500/20"></div>
          </div>
        ) : paginatedTournaments.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-700/50">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Tournament</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Format</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Participants</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {paginatedTournaments.map((tournament) => (
                  <tr
                    key={tournament.id}
                    className="bg-neutral-800/30 backdrop-blur hover:bg-neutral-700/30 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{tournament.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {new Date(tournament.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {tournament.format.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {tournament.participant_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                        {getStatusText(tournament.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2 items-center">
                        <Link
                          href={`/tournaments/${tournament.id}`}
                          className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-3 py-1 rounded-lg 
                            transition-all duration-300 transform hover:scale-105 active:scale-95"
                        >
                          Details
                        </Link>

                        {tournament.status === 'in_progress' && (
                          <Link
                            href={`/tournaments/${tournament.id}/bracket`}
                            className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-3 py-1 rounded-lg 
                              transition-all duration-300 transform hover:scale-105 active:scale-95"
                          >
                            Bracket
                          </Link>
                        )}

                        {isStaff && (
                          <div className="relative">
                            <button
                              ref={el => {
                                if (el) actionButtonRefs.current[tournament.id] = el;
                              }}
                              onClick={() => setShowActionMenu(showActionMenu === tournament.id ? null : tournament.id)}
                              className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-3 py-1 rounded-lg 
                                transition-all duration-300 transform hover:scale-105 active:scale-95"
                            >
                              Staff Actions
                            </button>                            {showActionMenu === tournament.id && actionButtonRefs.current[tournament.id] && (
                              <DropdownPortal buttonRef={{ current: actionButtonRefs.current[tournament.id]! }}>
                                <div className="w-56 rounded-lg bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
                                  <div className="py-1">
                                    {/* Status Management */}
                                    <button
                                      onClick={() => handleStatusChange(tournament.id, 'registration_open')}
                                      disabled={tournament.status === 'registration_open'}
                                      className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 disabled:opacity-50"
                                    >
                                      Open Registration
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(tournament.id, 'registration_closed')}
                                      disabled={tournament.status === 'registration_closed'}
                                      className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 disabled:opacity-50"
                                    >
                                      Close Registration
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(tournament.id, 'in_progress')}
                                      disabled={tournament.status === 'in_progress'}
                                      className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 disabled:opacity-50"
                                    >
                                      Start Tournament
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(tournament.id, 'completed')}
                                      disabled={tournament.status === 'completed'}
                                      className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 disabled:opacity-50"
                                    >
                                      Complete Tournament
                                    </button>
                                    
                                    {/* Bracket Management */}
                                    {tournament.status === 'registration_closed' && (
                                      <button
                                        onClick={() => handleGenerateBrackets(tournament.id)}
                                        className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50"
                                      >
                                        Generate Brackets
                                      </button>
                                    )}
                                    
                                    {tournament.status === 'in_progress' && (
                                      <Link
                                        href={`/tournaments/${tournament.id}/bracket`}
                                        className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50"
                                      >
                                        Manage Matches
                                      </Link>
                                    )}
                                    
                                    {/* Cancel Tournament */}
                                    <button
                                      onClick={() => handleStatusChange(tournament.id, 'cancelled')}
                                      disabled={tournament.status === 'cancelled'}
                                      className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700/50 disabled:opacity-50"
                                    >
                                      Cancel Tournament
                                    </button>
                                  </div>
                                </div>
                              </DropdownPortal>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg p-12 border border-gray-700/50 text-center">
            <p className="text-gray-400">No tournaments found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 
                disabled:hover:bg-purple-500/10 transition-all duration-300"
            >
              Previous
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
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
