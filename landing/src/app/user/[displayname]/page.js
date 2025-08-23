'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TopBar from '../../components/TopBar';
import Navbar from '../../components/Navbar';

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-800 text-white rounded-lg shadow-md animate-pulse">
      <div className="flex items-center gap-6">
        <div className="w-32 h-32 rounded-full bg-gray-700"></div>
        <div className="space-y-3">
          <div className="h-8 w-48 bg-gray-700 rounded"></div>
          <div className="h-6 w-32 bg-gray-700 rounded"></div>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <div className="h-6 w-24 bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const { displayname } = useParams();  const [user, setUser] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!displayname) return;    const fetchUserProfile = async () => {
      try {
        // Fetch user profile
        const userRes = await fetch(`https://backend-6wqj.onrender.com/user/${displayname}`);
        if (!userRes.ok) {
          throw new Error("User not found");
        }
        const userData = await userRes.json();
        setUser(userData);

        // Fetch leaderboard to determine rank
        const leaderboardRes = await fetch('https://backend-6wqj.onrender.com/leaderboard');
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          const userRankIndex = leaderboardData.findIndex(entry => entry.display_name === displayname);
          if (userRankIndex !== -1) {
            setUserRank(userRankIndex + 1);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [displayname]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
        <TopBar />
        <Navbar />
        <section className="flex flex-col items-center justify-center text-center px-4 py-32">
          <LoadingSkeleton />
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
        <TopBar />
        <Navbar />
        <section className="flex flex-col items-center justify-center text-center px-4 py-32">
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
            <p className="text-lg font-semibold">{error}</p>
            <p className="text-sm mt-2">Please check the username and try again</p>
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
        <TopBar />
        <Navbar />
        <section className="flex flex-col items-center justify-center text-center px-4 py-32">
          <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 p-4 rounded-lg">
            <p className="text-lg font-semibold">No user data found</p>
            <p className="text-sm mt-2">The user you're looking for might not exist</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />
      <section className="flex flex-col items-center justify-center text-center px-4 py-32">
        <div className="max-w-3xl mx-auto">
          {/* Profile Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl transition-all duration-300 hover:shadow-purple-500/10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center gap-6 relative">
              {/* Profile Picture */}
              <div className="relative w-32 h-32 group">
                <div className="absolute inset-0 bg-purple-500 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <img
                  src={user.profile_picture || '/images/default-avatar.png'}
                  alt={`${user.display_name}'s profile picture`}
                  className="w-32 h-32 rounded-full border-4 border-gray-700 object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* User Info */}
              <div className="flex flex-col items-center md:items-start">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                  {user.display_name}
                </h1>                <div className="flex items-center gap-2 mt-2">
                  {user.country_code ? (
                    <>
                      <img
                        src={`https://flagcdn.com/w40/${user.country_code.toLowerCase()}.png`}
                        alt={user.country_name}
                        className="w-6 h-4 object-cover rounded-sm"
                        loading="lazy"
                      />
                      <span className="text-gray-300">{user.country_name}</span>
                    </>
                  ) : (
                    <>
                      <span role="img" aria-label="Globe" className="text-xl">🌍</span>
                      <span className="text-gray-300">Unknown Location</span>
                    </>
                  )}
                </div>
              </div>

              {/* Stats Card */}
              <div className="md:ml-auto bg-gray-900/50 rounded-xl p-4 backdrop-blur-sm border border-gray-700">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-400">{user.points}</p>
                  <p className="text-xs text-gray-500 mt-1">EXP</p>
                </div>
              </div>
            </div>

            {/* Additional Stats/Badges Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700 transition-all duration-300 hover:border-purple-500/50">
                <p className="text-gray-400 text-sm">Rank</p>
                <p className="text-2xl font-semibold text-white">
                  {userRank ? `#${userRank}` : '-'}
                </p>
              </div>
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700 transition-all duration-300 hover:border-purple-500/50">
                <p className="text-gray-400 text-sm">Member Since</p>
                <p className="text-2xl font-semibold text-white">2025</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
