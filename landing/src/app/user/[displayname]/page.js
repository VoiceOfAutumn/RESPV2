'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
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
  const { displayname } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!displayname) return;

    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`http://localhost:3000/user/${displayname}`);
        if (!res.ok) {
          throw new Error("User not found");
        }
        const data = await res.json();
        setUser(data);
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
                <Image
                  src={user.profile_picture || '/images/default-avatar.png'}
                  alt={`${user.display_name}'s profile picture`}
                  width={128}
                  height={128}
                  className="rounded-full border-4 border-gray-700 object-cover transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>

              {/* User Info */}
              <div className="flex flex-col items-center md:items-start">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                  {user.display_name}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0020 5.5V3.935M12 7v6m0 0v6m0-6h.01M12 13h.01" />
                  </svg>
                  <span className="text-gray-300">{user.country || 'Unknown Location'}</span>
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
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700 transition-all duration-300 hover:border-purple-500/50">
                <p className="text-gray-400 text-sm">Rank</p>
                <p className="text-2xl font-semibold text-white">#1</p>
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
