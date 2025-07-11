'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';


interface LeaderboardEntry {
  display_name: string;
  points: number;
  profile_picture: string | null;
}

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedRank, setHighlightedRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch('https://retrosports-backend.onrender.com/leaderboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }

        const data = await response.json();
        setLeaderboardData(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const userIndex = leaderboardData.findIndex(entry =>
      entry.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (userIndex !== -1) {
      const page = Math.floor(userIndex / itemsPerPage) + 1;
      setCurrentPage(page);

      // Delay to allow page update before scrolling and highlighting
      setTimeout(() => {
        const rank = userIndex + 1;
        setHighlightedRank(rank);

        const element = document.getElementById(`rank-${rank}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        setTimeout(() => setHighlightedRank(null), 2000);
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Global Leaderboard</h2>
        </div>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 animate-pulse">
              <div className="w-6 h-6 bg-gray-700 rounded"></div>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                <div className="h-4 w-24 bg-gray-700 rounded"></div>
              </div>
              <div className="h-4 w-16 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-700/50">
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-500 font-medium">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getRankDecoration = (index: number) => {
    const medals = {
      0: { emoji: '🥇', color: 'from-yellow-400/20 to-transparent' },
      1: { emoji: '🥈', color: 'from-gray-400/20 to-transparent' },
      2: { emoji: '🥉', color: 'from-orange-400/20 to-transparent' },
    };
    return medals[index as keyof typeof medals];
  };

  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = leaderboardData.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(leaderboardData.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="w-full">      {/* Search Bar */}      <form onSubmit={handleSearch} className="flex justify-center mb-3">
        <input
          type="text"
          placeholder="Find player..."
          className="px-4 py-1.5 w-64 bg-gray-900/50 text-white placeholder-gray-400 rounded-lg border border-gray-700/50 
            focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      {/* Leaderboard Table */}      <div className="max-w-4xl mx-auto bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700/50 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-700/50">                <th className="w-24 px-6 py-2.5 text-left text-sm font-semibold text-gray-400">Rank</th>
                <th className="px-6 py-2.5 text-left text-sm font-semibold text-gray-400">Player</th>
                <th className="w-40 px-6 py-2.5 text-right text-sm font-semibold text-gray-400">Experience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {currentUsers.map((entry, index) => {
                const rank = indexOfFirstUser + index + 1;
                const isHighlighted = rank === highlightedRank;
                const medal = getRankDecoration(rank - 1);
                const avatarSrc = entry.profile_picture || '/images/default-avatar.png';

                return (
                  <tr
                    key={entry.display_name}
                    id={`rank-${rank}`}
                    className={`transition-colors duration-300 ${
                      isHighlighted ? 'bg-yellow-500/10 animate-pulse' : 'hover:bg-white/5'
                    } ${medal ? `bg-gradient-to-r ${medal.color}` : ''}`}
                  >                    <td className="w-24 px-6 py-2.5 whitespace-nowrap">                      <div className="text-sm font-bold text-white">
                        {medal ? (
                          <span>{medal.emoji}</span>
                        ) : (
                          `#${rank}`
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="absolute inset-0 rounded-full bg-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                          <img
                            src={avatarSrc}
                            alt={`${entry.display_name}'s avatar`}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-700 group-hover:ring-purple-500/50 transition-all duration-300"
                          />
                        </div>
                        <Link 
                          href={`/user/${entry.display_name}`} 
                          className="text-gray-300 hover:text-white font-medium transition-colors duration-300"
                        >
                          {entry.display_name}
                        </Link>
                      </div>
                    </td>
                    <td className="w-40 px-6 py-2.5 whitespace-nowrap text-right">
                      <div className="inline-flex text-white font-bold bg-gray-700/50 px-3 py-1 rounded-full text-sm">
                        {entry.points.toLocaleString()} EXP
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePreviousPage}
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
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 
            disabled:hover:bg-purple-500/10 transition-all duration-300"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
