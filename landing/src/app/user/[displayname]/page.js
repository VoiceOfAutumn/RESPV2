'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import PageShell from '../../components/PageShell';
import { getFlagImageProps } from '@/lib/countryFlags';
import { API_BASE_URL } from '@/lib/api';
import { getLevelData } from '@/lib/leveling';
import { MapPin, Award, TrendingUp, Users, X, Plus, Trash2, Coins } from 'lucide-react';

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

function VodOverlay({ url, onClose }) {
  const getEmbedUrl = (rawUrl) => {
    try {
      const parsed = new URL(rawUrl);
      let videoId = null;
      if (parsed.hostname.includes('youtube.com')) {
        videoId = parsed.searchParams.get('v');
      } else if (parsed.hostname.includes('youtu.be')) {
        videoId = parsed.pathname.slice(1);
      }
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
    } catch {}
    return null;
  };

  const embedUrl = getEmbedUrl(url);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl">
          <X className="w-6 h-6" />
        </button>
        {embedUrl ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full rounded-lg"
              src={embedUrl}
              title="Match VOD"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-lg p-8 text-center">
            <p className="text-gray-300 mb-4">Could not embed this video. Click below to open it directly.</p>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
              Open Video ↗
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function UserProfile() {
  const { displayname } = useParams();  const [user, setUser] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [userSeals, setUserSeals] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [rivals, setRivals] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [vodUrl, setVodUrl] = useState(null);
  const [rivalInput, setRivalInput] = useState('');
  const [rivalAdding, setRivalAdding] = useState(false);
  const [rivalError, setRivalError] = useState('');
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

        // Fetch leaderboard to determine rank (uses API rank with tie support)
        const leaderboardRes = await fetch(`${API_BASE_URL}/leaderboard`);
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          const entry = leaderboardData.find(e => e.display_name === displayname);
          if (entry && entry.rank) {
            setUserRank(Number(entry.rank));
          }
        }

        // Fetch user seals
        const sealsRes = await fetch(`${API_BASE_URL}/seals/user/${displayname}`);
        if (sealsRes.ok) {
          setUserSeals(await sealsRes.json());
        }

        // Fetch match history
        const matchRes = await fetch(`${API_BASE_URL}/user/${displayname}/matches?limit=5`);
        if (matchRes.ok) {
          setMatchHistory(await matchRes.json());
        }

        // Fetch rivals
        const rivalsRes = await fetch(`${API_BASE_URL}/user/${displayname}/rivals`);
        if (rivalsRes.ok) {
          setRivals(await rivalsRes.json());
        }

        // Fetch current logged-in user
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
          const meRes = await fetch(`${API_BASE_URL}/user/me`, {
            headers: { Authorization: `Bearer ${authToken}` },
            credentials: 'include',
          });
          if (meRes.ok) {
            setCurrentUser(await meRes.json());
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

  const levelData = getLevelData(user.points);
  const { level, tier, progress, expIntoLevel, isMaxLevel } = levelData;
  const expToNext = isMaxLevel ? 0 : levelData.expForNextLevel - levelData.expForCurrentLevel;

  // Admin override: admins get all tier features unlocked but display real tier/exp
  const isAdmin = user.role === 'admin';
  const featureLevel = isAdmin ? 50 : level;
  const hasMatchHistory = featureLevel >= 5;   // Contender (level 5+)
  const hasRivalsFeature = featureLevel >= 10; // Veteran (level 10+)

  // Check if the current logged-in user is viewing their own profile
  const isOwnProfile = currentUser && currentUser.displayName &&
    currentUser.displayName.toLowerCase() === user.display_name.toLowerCase();

  const handleAddRival = async () => {
    if (!rivalInput.trim() || rivalAdding) return;
    setRivalAdding(true);
    setRivalError('');
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/user/rivals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        credentials: 'include',
        body: JSON.stringify({ rival_name: rivalInput.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to add rival');
      }
      // Refresh rivals
      const rivalsRes = await fetch(`${API_BASE_URL}/user/${displayname}/rivals`);
      if (rivalsRes.ok) setRivals(await rivalsRes.json());
      setRivalInput('');
    } catch (err) {
      setRivalError(err.message);
    } finally {
      setRivalAdding(false);
    }
  };

  const handleRemoveRival = async (rivalName) => {
    try {
      const authToken = localStorage.getItem('authToken');
      await fetch(`${API_BASE_URL}/user/rivals/${encodeURIComponent(rivalName)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      setRivals(rivals.filter(r => r.display_name !== rivalName));
    } catch (err) {
      console.error('Error removing rival:', err);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
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
            {/* Level badge */}
            <div
              className="absolute -bottom-1 -right-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-900 border-2"
              style={{ borderColor: tier.accent, color: tier.accent }}
            >
              Lv.{level}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* EXP + Rank card */}
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/[0.06] relative">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-purple-400">{user.points}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">EXP</p>
            </div>
            {userRank ? (
              <a
                href="/leaderboards"
                className="absolute top-2.5 right-3 text-[11px] font-normal text-gray-500 hover:text-purple-400 transition-colors cursor-pointer"
              >
                #{userRank}
              </a>
            ) : null}
          </div>
          {/* Zenny card */}
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/[0.06] text-center">
            <p className="text-2xl md:text-3xl font-bold text-yellow-400 flex items-center justify-center gap-1.5">
              <Coins className="w-5 h-5 md:w-6 md:h-6" />
              {user.lifetime_prediction_points ?? 0}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Zenny</p>
          </div>
          {[
            { label: 'Win Rate', value: `${user.win_rate ?? 0}%`, color: 'text-green-400' },
            { label: 'Tournaments', value: user.tournaments_played ?? 0, color: 'text-blue-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/[0.06] text-center">
              <p className={`text-2xl md:text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match History (Contender+) */}
            {hasMatchHistory && (
              <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" /> Match History
                </h2>
                {matchHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No matches played yet.</p>
                ) : (
                  <div className="space-y-2">
                    {matchHistory.map((m) => (
                      <div key={m.id} className="flex items-center gap-4 bg-white/[0.02] rounded-lg px-4 py-3 border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          m.result === 'W' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {m.result}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium">
                            vs <span className="text-purple-400">{m.opponent}</span>
                          </p>
                          <p className="text-[10px] text-gray-500">{m.tournament}</p>
                        </div>
                        <span className="text-sm text-gray-300 font-mono">{m.score}</span>
                        {m.vod_url && (
                          <button
                            onClick={() => setVodUrl(m.vod_url)}
                            className="text-xs px-2 py-1 rounded bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-colors flex items-center gap-1"
                            title="Watch VOD"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>
                            VOD
                          </button>
                        )}
                        <span className="text-[10px] text-gray-600 hidden sm:block">
                          {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

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

          {/* ── RIGHT COLUMN (1/3) ── */}
          <div className="space-y-6">
            {/* Tier Badge + EXP Progress */}
            <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.04] border text-lg font-bold"
                  style={{ borderColor: tier.accent, color: tier.accent }}
                >
                  {level}
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: tier.accent }}>{tier.name}</p>
                  <p className="text-[10px] text-gray-500">Level {level} · {user.points} EXP</p>
                </div>
              </div>
              {/* EXP Progress */}
              <div className="mt-4">
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: isMaxLevel ? '100%' : `${Math.round(progress * 100)}%`, backgroundColor: tier.accent }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-1.5 text-right">
                  {isMaxLevel ? 'MAX' : `${expIntoLevel} / ${expToNext} EXP`}
                </p>
              </div>
            </section>

            {/* Rivals (Veteran+) */}
            {hasRivalsFeature && (
              <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-400" /> Rivals
                </h2>
                <div className="space-y-2">
                  {rivals.length === 0 && !isOwnProfile && (
                    <p className="text-gray-500 text-sm italic">No rivals set.</p>
                  )}
                  {rivals.map((rival) => {
                    const total = rival.wins + rival.losses;
                    const winPct = total > 0 ? Math.round((rival.wins / total) * 100) : 0;
                    return (
                      <div key={rival.display_name} className="flex items-center gap-3 bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04]">
                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center text-[10px] font-bold text-gray-400">
                          {rival.profile_picture ? (
                            <img src={rival.profile_picture} alt={rival.display_name} className="w-full h-full object-cover" />
                          ) : (
                            rival.display_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{rival.display_name}</p>
                          <p className="text-[10px] text-gray-500">
                            <span className="text-green-400">{rival.wins}W</span> – <span className="text-red-400">{rival.losses}L</span>
                            {total > 0 && <span className="text-gray-600 ml-1">({winPct}%)</span>}
                          </p>
                        </div>
                        {isOwnProfile && (
                          <button
                            onClick={() => handleRemoveRival(rival.display_name)}
                            className="text-gray-600 hover:text-red-400 transition-colors p-1"
                            title="Remove rival"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {/* Add rival input (own profile only, max 3) */}
                  {isOwnProfile && rivals.length < 3 && (
                    <div className="mt-3">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={rivalInput}
                          onChange={(e) => { setRivalInput(e.target.value); setRivalError(''); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddRival()}
                          placeholder="Add rival by name..."
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white/[0.04] rounded-lg border border-white/[0.08] focus:border-purple-500/50 focus:outline-none text-gray-300 placeholder-gray-600"
                        />
                        <button
                          onClick={handleAddRival}
                          disabled={rivalAdding || !rivalInput.trim()}
                          className="px-2.5 py-1.5 text-xs bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-colors disabled:opacity-40 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          {rivalAdding ? '...' : 'Add'}
                        </button>
                      </div>
                      {rivalError && <p className="text-[10px] text-red-400 mt-1">{rivalError}</p>}
                    </div>
                  )}
                  {rivals.length === 0 && isOwnProfile && rivals.length === 0 && !rivalInput && (
                    <p className="text-gray-600 text-[10px] italic">Add up to 3 rivals to track your head-to-head record.</p>
                  )}
                </div>
              </section>
            )}
          </div>

        </div>
      </div>

      {/* VOD Overlay */}
      {vodUrl && <VodOverlay url={vodUrl} onClose={() => setVodUrl(null)} />}
    </main>
  );
}
