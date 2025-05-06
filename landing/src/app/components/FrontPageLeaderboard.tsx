'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LeaderboardEntry {
  display_name: string;
  points: number;
  profile_picture: string | null;
}

const FrontPageLeaderboard = () => {
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
        setLeaderboardData(data.slice(0, 10));
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  if (loading) return <div>Loading leaderboard...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-neutral-800 rounded-2xl shadow-md p-6 flex-1">
      <h2 className="text-lg font-semibold mb-4 text-white">Leaderboard</h2>
      <div className="space-y-3">
        {leaderboardData.map((entry, index) => {
          const avatarSrc = entry.profile_picture && entry.profile_picture.trim() !== ''
            ? entry.profile_picture
            : '/images/default-avatar.png';

          return (
            <div
              key={entry.display_name}
              className="flex items-center justify-between px-4 py-2"
            >
              {/* Rank */}
              <div className="w-6 text-white font-bold text-center">{index + 1}</div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-3 flex-1 ml-4">
                <Image
                  src={avatarSrc}
                  alt={`${entry.display_name}'s avatar`}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
                <Link href={`/user/${entry.display_name}`} className="text-gray-300 hover:text-white font-medium">
                  {entry.display_name}
                </Link>
              </div>

              {/* Points */}
              <div className="text-white font-bold">{entry.points} EXP</div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 text-center">
        <Link href="/leaderboards" className="text-sm text-purple-400 hover:text-white">
          See more
        </Link>
      </div>
    </div>
  );
};

export default FrontPageLeaderboard;
