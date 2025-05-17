'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';

interface Tournament {
  id: number;
  name: string;
  date: string;
  status: string;
  image: string | null;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:3000/tournaments')
      .then(res => res.json())
      .then(data => {
        const sortedTournaments = data.sort((a: Tournament, b: Tournament) => b.id - a.id);
        setTournaments(sortedTournaments);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch tournaments:', err);
        setLoading(false);
      });
  }, []);

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />
      <section className="flex flex-col items-center text-center px-4 py-8">
        <h1 className="text-4xl font-semibold mb-8">Tournaments</h1>

        <div className="w-full max-w-7xl overflow-hidden rounded-lg">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder="Search tournaments..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none pr-10"
              />
              <svg 
                className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
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
            <div className="bg-gray-800 rounded-lg p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-gray-800/50 backdrop-blur overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr className="bg-gray-800/80">                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Tournament
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {paginatedTournaments.map((tournament) => (
                        <tr
                          key={tournament.id}
                          className="hover:bg-gray-700/50 transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/tournaments/${tournament.id}`} className="flex items-center space-x-3 group">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  src={tournament.image || 'https://i.imgur.com/4BAhl5o.png'}
                                  alt=""
                                  className="h-10 w-10 rounded object-cover group-hover:ring-2 group-hover:ring-purple-500 transition-all"
                                />
                              </div>
                              <div className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                                {tournament.name}
                              </div>
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <span className="flex text-sm text-gray-300">
                              {new Date(tournament.date).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              tournament.status.toLowerCase() === 'registration open' ? 'bg-green-500/20 text-green-400' :
                              tournament.status.toLowerCase() === 'check-in period' ? 'bg-orange-500/20 text-orange-400' :
                              tournament.status.toLowerCase() === 'in progress' ? 'bg-yellow-500/20 text-yellow-400' :
                              tournament.status.toLowerCase() === 'registration closed' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {tournament.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          currentPage === idx + 1
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* No Results Message */}
              {filteredTournaments.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No tournaments found matching your search.
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
