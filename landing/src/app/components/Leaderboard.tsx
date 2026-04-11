'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiRequest } from '@/lib/api';


interface LeaderboardEntry {
  display_name: string;
  points: number;
  profile_picture: string | null;
  rank: number | null;
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
        const data = await apiRequest('/leaderboard');
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

  const podiumStyles = {
    0: {
      border: 'border-yellow-500',
      glow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]',
      bg: 'bg-gradient-to-b from-yellow-500/10 to-transparent',
      icon: '👑',
      label: 'text-yellow-400',
      expBg: 'bg-yellow-500/20 border-yellow-500/40',
    },
    1: {
      border: 'border-gray-400',
      glow: 'shadow-[0_0_15px_rgba(156,163,175,0.3)]',
      bg: 'bg-gradient-to-b from-gray-400/10 to-transparent',
      icon: '🥈',
      label: 'text-gray-300',
      expBg: 'bg-gray-400/20 border-gray-500/40',
    },
    2: {
      border: 'border-orange-600',
      glow: 'shadow-[0_0_15px_rgba(234,88,12,0.3)]',
      bg: 'bg-gradient-to-b from-orange-600/10 to-transparent',
      icon: '🥉',
      label: 'text-orange-400',
      expBg: 'bg-orange-500/20 border-orange-500/40',
    },
  };

  const isFirstPage = currentPage === 1;
  const top3 = leaderboardData.slice(0, 3);
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const tableUsers = isFirstPage
    ? leaderboardData.slice(3, 10)
    : leaderboardData.slice(indexOfFirstUser, indexOfLastUser);
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
    <div className="w-full">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex justify-center mb-3">
        <input
          type="text"
          placeholder="Find player..."
          className="px-4 py-1.5 w-64 bg-gray-900/50 text-white placeholder-gray-400 rounded-lg border border-gray-700/50 
            focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      {/* Top 3 Podium Cards */}
      {isFirstPage && top3.length >= 3 && (
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 mb-4">
          {/* Render in visual order: Silver (#2), Gold (#1), Bronze (#3) */}
          {[1, 0, 2].map((podiumIndex) => {
            const entry = top3[podiumIndex];
            const style = podiumStyles[podiumIndex as keyof typeof podiumStyles];
            const avatarSrc = entry.profile_picture || '/images/default-avatar.png';

            return (
              <div
                key={entry.display_name}
                id={`rank-${podiumIndex + 1}`}
                className={`relative flex flex-col items-center p-4 rounded-xl border ${style.border} ${style.glow} ${style.bg} bg-neutral-800/60 backdrop-blur transition-all duration-300 hover:scale-[1.02] ${
                  podiumIndex + 1 === highlightedRank ? 'ring-2 ring-yellow-400 animate-pulse' : ''
                }`}
              >
                {/* Medal / Crown icon */}
                <span className="text-2xl mb-2">{style.icon}</span>

                {/* Avatar */}
                <img
                  src={avatarSrc}
                  alt={`${entry.display_name}'s avatar`}
                  className={`w-16 h-16 rounded-full object-cover border-2 ${style.border}`}
                  onError={(e) => {
                    e.currentTarget.src = '/images/default-avatar.png';
                    e.currentTarget.onerror = null;
                  }}
                />

                {/* Username */}
                <Link
                  href={`/user/${entry.display_name}`}
                  className={`mt-2 font-semibold text-sm text-center truncate max-w-full hover:text-white transition-colors ${style.label}`}
                >
                  {entry.display_name}
                </Link>

                {/* EXP */}
                <div className={`mt-2 px-3 py-1 rounded-lg border text-white font-bold text-sm ${style.expBg}`}>
                  {entry.points.toLocaleString()} EXP
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="max-w-4xl mx-auto bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700/50 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="w-24 px-6 py-2.5 text-left text-sm font-semibold text-gray-400">Rank</th>
                <th className="px-6 py-2.5 text-left text-sm font-semibold text-gray-400">Player</th>
                <th className="w-40 px-6 py-2.5 text-right text-sm font-semibold text-gray-400">Experience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {tableUsers.map((entry, index) => {
                const rank = entry.rank;
                const displayIndex = isFirstPage ? index + 4 : indexOfFirstUser + index + 1;
                const isHighlighted = displayIndex === highlightedRank;
                const medal = rank ? getRankDecoration(rank - 1) : undefined;
                const avatarSrc = entry.profile_picture || '/images/default-avatar.png';

                return (
                  <tr
                    key={entry.display_name}
                    id={`rank-${displayIndex}`}
                    className={`transition-colors duration-300 ${
                      isHighlighted ? 'bg-yellow-500/10 animate-pulse' : 'hover:bg-white/5'
                    } ${medal ? `bg-gradient-to-r ${medal.color}` : ''}`}
                  >
                    <td className="w-24 px-6 py-2.5 whitespace-nowrap">
                      <div className={`text-sm font-bold ${rank ? 'text-white' : 'text-gray-500 italic'}`}>
                        {rank ? `#${rank}` : 'Unranked'}
                      </div>
                    </td>
                    <td className="px-6 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={avatarSrc}
                            alt={`${entry.display_name}'s avatar`}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-700 hover:ring-purple-500/50 transition-all duration-300"
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
