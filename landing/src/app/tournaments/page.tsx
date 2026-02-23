'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import { Search, Calendar, Users, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface Tournament {
  id: number;
  name: string;
  date: string;
  status: string;
  format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
  participant_count: number;
  image: string | null;
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
  const [currentPage, setCurrentPage] = useState(1);  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const itemsPerPage = 6;

  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const actionButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('Fetching user data...');
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
        
        console.log('Response status:', res.status);
        if (res.ok) {
          const userData = await res.json();
          console.log('User data:', userData);
          if (userData.isLoggedIn && userData.user) {
            setUser({
              role: userData.user.role
            });
            console.log('Tournaments page - User role:', userData.user.role);
          }
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
    fetch(`${API_BASE_URL}/tournaments`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        const statusOrder: Record<string, number> = {
          registration_open: 0,
          in_progress: 1,
          registration_closed: 2,
          completed: 3,
          cancelled: 4,
        };
        const now = Date.now();
        const sortedTournaments = data.sort((a: Tournament, b: Tournament) => {
          const aOrder = statusOrder[a.status] ?? 99;
          const bOrder = statusOrder[b.status] ?? 99;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return Math.abs(new Date(a.date).getTime() - now) - Math.abs(new Date(b.date).getTime() - now);
        });
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
      
      // Get auth token for authentication
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/status`, {
        method: 'PUT',
        headers,
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
      
      // Get auth token for authentication
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {};
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/bracket/generate`, {
        method: 'POST',
        headers,
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

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'registration_closed':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'completed':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
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

        <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-300">
          <svg className="h-5 w-5 flex-shrink-0 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86l-8.6 14.86A1 1 0 002.56 20h18.88a1 1 0 00.87-1.28l-8.6-14.86a1 1 0 00-1.72 0z" />
          </svg>
          <span>
            Being in our{' '}
            <a
              href="https://discord.gg/hjGrrbTKVT"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-yellow-200 underline underline-offset-2 hover:text-white transition-colors"
            >
              Discord Server
            </a>{' '}
            is currently mandatory for participating in the tournaments.
          </span>
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
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                          <img
                            src={tournament.image || '/images/default-avatar.png'}
                            alt={tournament.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-sm font-medium text-white">{tournament.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {new Date(tournament.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}{' '}
                        <span className="text-gray-400">
                          {new Date(tournament.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                        </span>{' '}
                        <span className="text-gray-500 text-xs">UTC</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide uppercase ${getStatusBadgeStyle(tournament.status)}`}>
                        {getStatusText(tournament.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2 items-center">                        <Link
                          href={`/tournaments/${tournament.id}`}
                          className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-3 py-1 rounded-lg 
                            transition-all duration-300 transform hover:scale-105 active:scale-95"
                        >
                          Details
                        </Link>

                        <Link
                          href={`/tournaments/${tournament.id}/bracket`}
                          className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-3 py-1 rounded-lg 
                            transition-all duration-300 transform hover:scale-105 active:scale-95"
                        >
                          Bracket
                        </Link>

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
                                    
                                    <Link
                                      href={`/tournaments/${tournament.id}/bracket`}
                                      className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50"
                                    >
                                      {tournament.status === 'in_progress' ? 'Manage Matches' : 'View Bracket'}
                                    </Link>
                                    
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 
                disabled:hover:bg-purple-500/10 transition-all duration-300"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-gray-400 text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages} 
              className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 
                disabled:hover:bg-purple-500/10 transition-all duration-300"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
