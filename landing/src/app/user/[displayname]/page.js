'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PageShell from '../../components/PageShell';
import { getFlagImageProps } from '@/lib/countryFlags';
import { API_BASE_URL } from '@/lib/api';
import { MapPin, Award } from 'lucide-react';

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
  const [userSeals, setUserSeals] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!displayname) return;    const fetchUserProfile = async () => {
      try {
        // Fetch user profile
        const userRes = await fetch(`${API_BASE_URL}/user/${displayname}`);
        if (!userRes.ok) {
          throw new Error("User not found");
        }
        const userData = await userRes.json();
        setUser(userData);

        // Fetch leaderboard to determine rank
        const leaderboardRes = await fetch(`${API_BASE_URL}/leaderboard`);
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          const userRankIndex = leaderboardData.findIndex(entry => entry.display_name === displayname);
          if (userRankIndex !== -1) {
            setUserRank(userRankIndex + 1);
          }
        }

        // Fetch user seals
        const sealsRes = await fetch(`${API_BASE_URL}/seals/user/${displayname}`);
        if (sealsRes.ok) {
          setUserSeals(await sealsRes.json());
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
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
        <PageShell />
        <section className="flex flex-col items-center justify-center text-center px-4 py-32">
          <LoadingSkeleton />
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
        <PageShell />
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
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
        <PageShell />
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
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />

      {/* ── BANNER ── */}
      <div
        className="relative w-full h-48 md:h-64 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' }}
      >
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* ── PROFILE HEADER (overlaps banner) ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-36 h-36 md:w-40 md:h-40 rounded-full bg-gray-800 border-4 border-gray-700 overflow-hidden">
              <img
                src={user.profile_picture || '/images/default-avatar.png'}
                alt={`${user.display_name}'s profile picture`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Name & Meta */}
          <div className="flex-1 text-center md:text-left pb-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white truncate">
              {user.display_name}
            </h1>
            <div className="flex items-center gap-4 mt-2 justify-center md:justify-start text-xs text-gray-500">
              <span className="flex items-center gap-1">
                {user.country_name ? (
                  <>
                    <img {...getFlagImageProps(user.country_name, user.country_code)} />
                    <span>{user.country_name}</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3 h-3" />
                    <span>Unknown Location</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/[0.06] text-center">
            <p className="text-2xl md:text-3xl font-bold text-purple-400">{user.points}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">EXP</p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/[0.06] text-center">
            <p className="text-2xl md:text-3xl font-bold text-white">{userRank ? `#${userRank}` : '-'}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Rank</p>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 pb-20">
        {/* Seals */}
        <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" /> Seals
          </h2>
          <div className="flex flex-wrap gap-3">
            {userSeals.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No seals earned yet. Seals are awarded for special accomplishments.</p>
            ) : (
              userSeals.map((seal) => (
                <div key={seal.id} className="group relative flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-purple-500/30 overflow-hidden flex items-center justify-center group-hover:border-purple-400 group-hover:scale-110 transition-all">
                    <img src={seal.image_url} alt={seal.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium max-w-[70px] text-center truncate">{seal.name}</span>
                  {seal.description && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-gray-800 border border-gray-700 rounded-lg shadow-lg whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {seal.description}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
