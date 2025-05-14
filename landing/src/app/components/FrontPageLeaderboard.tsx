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

  if (loading) {
    return (
      <div className="bg-neutral-800 rounded-2xl shadow-md p-6 flex-1">
        <h2 className="text-lg font-semibold mb-4 text-white">Leaderboard</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
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
      <div className="bg-neutral-800 rounded-2xl shadow-md p-6 flex-1">
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

  return (    <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg p-6 flex-1 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Leaderboard</h2>
        <div className="text-xs font-medium text-gray-400">Top 10</div>
      </div>
      
      <div className="space-y-2">
        {leaderboardData.map((entry, index) => {
          const avatarSrc = entry.profile_picture && entry.profile_picture.trim() !== ''
            ? entry.profile_picture
            : '/images/default-avatar.png';
          const medal = getRankDecoration(index);

          return (
            <div
              key={entry.display_name}              className={`group relative flex items-center justify-between p-2 rounded-lg transition-all duration-300 hover:bg-white/5 
                ${medal ? `bg-gradient-to-r ${medal.color}` : ''}`}
            >
              {/* Rank */}
              <div className="w-6 text-white font-bold text-center">
                {medal ? (
                  <span className="text-sm">{medal.emoji}</span>
                ) : (
                  `#${index + 1}`
                )}
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-3 flex-1 ml-2">                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <Image
                    src={avatarSrc}
                    alt={`${entry.display_name}'s avatar`}
                    width={24}
                    height={24}
                    className="rounded-full object-cover ring-1 ring-gray-700 group-hover:ring-purple-500/50 transition-all duration-300"
                  />
                </div>
                <Link 
                  href={`/user/${entry.display_name}`} 
                  className="text-gray-300 hover:text-white font-medium transition-colors duration-300"
                >
                  {entry.display_name}
                </Link>
              </div>

              {/* Points */}
              <div className="text-white font-bold bg-gray-700/50 px-3 py-1 rounded-full text-sm">
                {entry.points.toLocaleString()} EXP
              </div>
            </div>
          );
        })}
      </div>      <div className="flex justify-center mt-6">
        <Link 
          href="/leaderboards"
          className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-purple-500/10 text-purple-400 
            hover:bg-purple-500/20 transition-all duration-300 group text-sm font-medium"
        >
          See Full Leaderboard
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default FrontPageLeaderboard;
