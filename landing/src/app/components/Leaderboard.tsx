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
        const response = await fetch('http://localhost:3000/leaderboard', {
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

  if (loading) return <div>Loading leaderboard...</div>;
  if (error) return <div>Error: {error}</div>;

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
    <div className="w-full">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Find player..."
          className="px-3 py-1.5 w-64 text-sm bg-gray-800 text-white placeholder-gray-400 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>


      {/* Table */}
      <div className="w-full overflow-x-auto bg-gray-900 rounded-lg shadow-md mb-4">
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr className="text-gray-400">
              <th className="px-6 py-3 text-left">Rank</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">EXP</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((entry, index) => {
              const rank = indexOfFirstUser + index + 1;
              const isHighlighted = rank === highlightedRank;

              return (
                <tr
                  key={entry.display_name}
                  id={`rank-${rank}`}
                  className={`border-t border-gray-700 transition-all duration-300 ${isHighlighted ? 'bg-yellow-500/10 animate-pulse' : 'hover:bg-gray-700'
                    }`}
                >
                  <td className="px-6 py-3 text-left text-gray-300">{rank}</td>
                  <td className="px-6 py-3 text-left text-gray-300 flex items-center gap-3">
                    <img
                      src={entry.profile_picture || '/images/default-avatar.png'}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border border-gray-700"
                    />
                    <Link
                      href={`/user/${entry.display_name}`}
                      className="text-white hover:text-gray-300"
                    >
                      {entry.display_name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-left text-gray-300 font-bold">{entry.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center space-x-6 py-4">
        <button
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          aria-label="Previous Page"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-white text-sm">
          Page {currentPage} of {totalPages}
        </span>

        <button
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
