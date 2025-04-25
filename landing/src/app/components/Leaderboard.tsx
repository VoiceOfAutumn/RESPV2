// components/Leaderboard.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  display_name: string;
  points: number;
}

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <div>Loading leaderboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="w-full overflow-x-auto bg-gray-900 rounded-lg shadow-md">
      <table className="min-w-full table-auto text-sm">
        <thead>
          <tr className="text-gray-400">
            <th className="px-6 py-3 text-left">Rank</th>
            <th className="px-6 py-3 text-left">Name</th>
            <th className="px-6 py-3 text-left">EXP</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((entry, index) => (
            <tr key={entry.display_name} className="border-t border-gray-700">
              <td className="px-6 py-3 text-left text-gray-300">{index + 1}</td>
              <td className="px-6 py-3 text-left text-gray-300">
                <Link href={`/user/${entry.display_name}`} className="text-blue-400 hover:text-blue-600">
                  {entry.display_name}
                </Link>
              </td>
              <td className="px-6 py-3 text-left text-gray-300">{entry.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
