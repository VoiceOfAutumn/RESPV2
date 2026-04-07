'use client';

import { useState } from 'react';
import PageShell from '../components/PageShell';
import {
  Star, Shield, Crown, Flame, Zap, Trophy, Sparkles, Eye, Palette,
  ChevronRight, Lock, Check, Music, MessageSquare, Image, Award,
  TrendingUp, Swords, Globe, Heart, Users, Gem,
} from 'lucide-react';

/* ────────────────────────────────────────────
   LEVEL TIER DEFINITIONS
   ──────────────────────────────────────────── */

interface Unlock {
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface LevelTier {
  level: number;
  name: string;
  exp: string;
  color: string;         // tailwind ring/text color
  bg: string;            // card bg-gradient stops
  glow: string;          // box-shadow glow
  border: string;        // border color class
  badge: React.ReactNode;
  unlocks: Unlock[];
}

const TIERS: LevelTier[] = [
  {
    level: 1,
    name: 'Newcomer',
    exp: '0 – 99',
    color: 'text-gray-400',
    bg: 'from-gray-800/50 to-gray-900/50',
    glow: '0 0 0px transparent',
    border: 'border-gray-700',
    badge: <Star className="w-5 h-5 text-gray-400" />,
    unlocks: [
      { label: 'Basic Profile Card', icon: <Eye className="w-4 h-4" />, description: 'Your profile with avatar, EXP, rank, and country.' },
      { label: 'Tournament Sign-Up', icon: <Swords className="w-4 h-4" />, description: 'Enter any open tournament.' },
    ],
  },
  {
    level: 5,
    name: 'Contender',
    exp: '100 – 499',
    color: 'text-green-400',
    bg: 'from-green-900/20 to-gray-900/50',
    glow: '0 0 20px rgba(74,222,128,0.08)',
    border: 'border-green-800/40',
    badge: <Shield className="w-5 h-5 text-green-400" />,
    unlocks: [
      { label: 'Profile Bio', icon: <MessageSquare className="w-4 h-4" />, description: 'Add a short bio/tagline shown on your profile.' },
      { label: 'Profile Banner Color', icon: <Palette className="w-4 h-4" />, description: 'Choose from preset banner gradient colors.' },
      { label: 'Match History', icon: <TrendingUp className="w-4 h-4" />, description: 'Public match history section on your profile.' },
    ],
  },
  {
    level: 10,
    name: 'Rival',
    exp: '500 – 1,499',
    color: 'text-blue-400',
    bg: 'from-blue-900/20 to-gray-900/50',
    glow: '0 0 24px rgba(96,165,250,0.10)',
    border: 'border-blue-800/40',
    badge: <Zap className="w-5 h-5 text-blue-400" />,
    unlocks: [
      { label: 'Custom Banner Image', icon: <Image className="w-4 h-4" />, description: 'Upload your own profile banner image.' },
      { label: 'Favorite Games', icon: <Heart className="w-4 h-4" />, description: 'Showcase up to 3 favorite retro games.' },
      { label: 'Animated Avatar Ring', icon: <Sparkles className="w-4 h-4" />, description: 'Subtle animated glow around your avatar.' },
    ],
  },
  {
    level: 20,
    name: 'Veteran',
    exp: '1,500 – 3,999',
    color: 'text-purple-400',
    bg: 'from-purple-900/20 to-gray-900/50',
    glow: '0 0 30px rgba(192,132,252,0.12)',
    border: 'border-purple-700/40',
    badge: <Flame className="w-5 h-5 text-purple-400" />,
    unlocks: [
      { label: 'Profile Theme', icon: <Palette className="w-4 h-4" />, description: 'Select a full profile color theme (purple, red, cyan…).' },
      { label: 'Trophy Showcase', icon: <Trophy className="w-4 h-4" />, description: 'Pin top 3 tournament placements on your profile.' },
      { label: 'Profile Music', icon: <Music className="w-4 h-4" />, description: 'Set a short looping chiptune that visitors can play.' },
      { label: 'Social Links', icon: <Globe className="w-4 h-4" />, description: 'Display links to Twitch, X/Twitter, Discord, etc.' },
    ],
  },
  {
    level: 35,
    name: 'Elite',
    exp: '4,000 – 7,999',
    color: 'text-orange-400',
    bg: 'from-orange-900/20 to-gray-900/50',
    glow: '0 0 36px rgba(251,146,60,0.14)',
    border: 'border-orange-700/40',
    badge: <Crown className="w-5 h-5 text-orange-400" />,
    unlocks: [
      { label: 'Animated Profile Banner', icon: <Sparkles className="w-4 h-4" />, description: 'Upload an animated GIF or WebP as your banner.' },
      { label: 'Custom Title', icon: <Award className="w-4 h-4" />, description: 'Set a colored title displayed below your name (e.g. "The Undefeated").' },
      { label: 'Team/Clan Tag', icon: <Users className="w-4 h-4" />, description: 'Display a clan/team tag next to your name.' },
    ],
  },
  {
    level: 50,
    name: 'Legend',
    exp: '8,000+',
    color: 'text-yellow-400',
    bg: 'from-yellow-900/20 to-gray-900/50',
    glow: '0 0 48px rgba(250,204,21,0.18)',
    border: 'border-yellow-600/40',
    badge: <Gem className="w-5 h-5 text-yellow-400" />,
    unlocks: [
      { label: 'Holographic Card Effect', icon: <Sparkles className="w-4 h-4" />, description: 'Your profile card has a rainbow holographic shimmer on hover.' },
      { label: 'Exclusive Legend Frame', icon: <Gem className="w-4 h-4" />, description: 'Golden animated border frame around your avatar.' },
      { label: 'Profile Emotes', icon: <MessageSquare className="w-4 h-4" />, description: 'Unlock animated emotes usable on your profile wall.' },
      { label: 'Name Color', icon: <Palette className="w-4 h-4" />, description: 'Pick a custom gradient color for your display name.' },
    ],
  },
];

/* ────────────────────────────────────────────
   CUMULATIVE UNLOCK LIST PER TIER
   ──────────────────────────────────────────── */

function getCumulativeUnlocks(tierIndex: number) {
  const all: { unlock: Unlock; tierLevel: number; tierName: string; tierColor: string }[] = [];
  for (let i = 0; i <= tierIndex; i++) {
    const t = TIERS[i];
    t.unlocks.forEach((u) => all.push({ unlock: u, tierLevel: t.level, tierName: t.name, tierColor: t.color }));
  }
  return all;
}

/* ────────────────────────────────────────────
   MOCK PROFILE PREVIEW
   ──────────────────────────────────────────── */

function ProfilePreview({ tier, tierIndex }: { tier: LevelTier; tierIndex: number }) {
  const cumulative = getCumulativeUnlocks(tierIndex);
  const hasBio = tierIndex >= 1;
  const hasBannerColor = tierIndex >= 1;
  const hasMatchHistory = tierIndex >= 1;
  const hasBannerImage = tierIndex >= 2;
  const hasFavoriteGames = tierIndex >= 2;
  const hasAnimatedRing = tierIndex >= 2;
  const hasTheme = tierIndex >= 3;
  const hasTrophyShowcase = tierIndex >= 3;
  const hasMusic = tierIndex >= 3;
  const hasSocialLinks = tierIndex >= 3;
  const hasAnimBanner = tierIndex >= 4;
  const hasCustomTitle = tierIndex >= 4;
  const hasClanTag = tierIndex >= 4;
  const hasHolo = tierIndex >= 5;
  const hasLegendFrame = tierIndex >= 5;
  const hasNameColor = tierIndex >= 5;

  return (
    <div className="space-y-6">
      {/* ── Simulated profile card ── */}
      <div
        className={`relative bg-gradient-to-br ${tier.bg} backdrop-blur-sm ${tier.border} border rounded-2xl overflow-hidden transition-all duration-500 ${hasHolo ? 'holo-card' : ''}`}
        style={{ boxShadow: tier.glow }}
      >
        {/* Banner */}
        <div className={`h-28 w-full relative ${hasBannerColor ? 'bg-gradient-to-r from-purple-800/40 via-indigo-900/40 to-blue-900/40' : 'bg-gray-800/60'}`}>
          {hasBannerImage && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
              {hasAnimBanner ? (
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" /> Animated Banner
                </span>
              ) : (
                <span className="flex items-center gap-1"><Image className="w-3 h-3" /> Custom Banner</span>
              )}
            </div>
          )}
          {hasMusic && (
            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5 border border-gray-700/50">
              <Music className="w-3.5 h-3.5 text-purple-400" />
            </div>
          )}
        </div>

        {/* Avatar + Info */}
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <div
                className={`w-24 h-24 rounded-full bg-gray-700 border-4 ${
                  hasLegendFrame ? 'border-yellow-500' : hasAnimatedRing ? 'border-blue-500' : 'border-gray-600'
                } overflow-hidden ${hasAnimatedRing ? 'ring-2 ring-blue-400/40 animate-pulse' : ''} ${hasLegendFrame ? 'ring-2 ring-yellow-400/50' : ''}`}
              >
                <div className="w-full h-full bg-gray-600 flex items-center justify-center text-gray-400 text-2xl font-bold">
                  RR
                </div>
              </div>
              {/* Level badge */}
              <div className={`absolute -bottom-1 -right-1 ${tier.color} bg-gray-900 text-xs font-bold px-2 py-0.5 rounded-full border ${tier.border}`}>
                Lv.{tier.level}
              </div>
            </div>

            {/* Name row */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                {hasClanTag && <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">[RR]</span>}
                <h2 className={`text-2xl font-bold ${hasNameColor ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent' : 'text-white'}`}>
                  RetroPlayer
                </h2>
                {tier.badge}
              </div>
              {hasCustomTitle && (
                <p className="text-orange-400 text-xs font-semibold mt-0.5 tracking-wide">&quot;The Undefeated&quot;</p>
              )}
              {hasBio && (
                <p className="text-gray-400 text-sm mt-1 italic">&quot;Speedrunner and retro purist since &apos;92.&quot;</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-3">
              <div className="bg-gray-900/60 rounded-xl px-4 py-2 text-center border border-gray-700/50">
                <p className="text-xl font-bold text-purple-400">2,480</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">EXP</p>
              </div>
              <div className="bg-gray-900/60 rounded-xl px-4 py-2 text-center border border-gray-700/50">
                <p className="text-xl font-bold text-white">#14</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Rank</p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          {hasSocialLinks && (
            <div className="flex gap-2 mt-4 justify-center sm:justify-start">
              {['Twitch', 'Discord', 'Twitter'].map((s) => (
                <span key={s} className="text-[10px] bg-gray-800 border border-gray-700/50 rounded-full px-3 py-1 text-gray-400">{s}</span>
              ))}
            </div>
          )}

          {/* Favorite Games */}
          {hasFavoriteGames && (
            <div className="mt-4 flex gap-2 justify-center sm:justify-start">
              {['Super Metroid', 'Mega Man X', 'Tetris'].map((g) => (
                <span key={g} className="text-xs bg-blue-500/10 text-blue-300 border border-blue-700/30 rounded-lg px-3 py-1.5">{g}</span>
              ))}
            </div>
          )}

          {/* Trophy Showcase */}
          {hasTrophyShowcase && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { place: '1st', name: 'Spring Showdown', color: 'text-yellow-400 border-yellow-600/40 bg-yellow-500/5' },
                { place: '2nd', name: 'Retro Rumble', color: 'text-gray-300 border-gray-600/40 bg-gray-500/5' },
                { place: '3rd', name: 'NES Championship', color: 'text-orange-400 border-orange-600/40 bg-orange-500/5' },
              ].map((t) => (
                <div key={t.name} className={`rounded-lg p-2 text-center border ${t.color} text-xs`}>
                  <Trophy className="w-4 h-4 mx-auto mb-1" />
                  <p className="font-bold">{t.place}</p>
                  <p className="text-gray-500 text-[10px]">{t.name}</p>
                </div>
              ))}
            </div>
          )}

          {/* Match History */}
          {hasMatchHistory && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Recent Matches</p>
              <div className="space-y-1.5">
                {[
                  { vs: 'PixelKing', result: 'W', score: '2 – 0' },
                  { vs: 'ArcadeGhost', result: 'W', score: '2 – 1' },
                  { vs: 'NESMaster', result: 'L', score: '0 – 2' },
                ].map((m) => (
                  <div key={m.vs} className="flex items-center justify-between bg-gray-900/40 rounded-lg px-3 py-1.5 text-xs border border-gray-800/50">
                    <span className="text-gray-300">vs <span className="text-white font-medium">{m.vs}</span></span>
                    <span className="text-gray-500">{m.score}</span>
                    <span className={m.result === 'W' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{m.result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Unlock inventory ── */}
      <div className="bg-gray-900/40 border border-gray-700/50 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Unlocked Features ({cumulative.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {cumulative.map(({ unlock, tierName, tierColor }, i) => (
            <div key={i} className="flex items-start gap-2.5 bg-gray-800/40 rounded-lg p-2.5 border border-gray-700/30">
              <div className={`mt-0.5 ${tierColor}`}>{unlock.icon}</div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">{unlock.label}</p>
                <p className="text-[10px] text-gray-500 leading-tight">{unlock.description}</p>
                <p className={`text-[9px] mt-0.5 ${tierColor} font-medium`}>{tierName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   MAIN DEMO PAGE
   ──────────────────────────────────────────── */

export default function ProfileDemoPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tier = TIERS[selectedIndex];

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />

      {/* Holographic shimmer keyframes */}
      <style>{`
        .holo-card {
          position: relative;
        }
        .holo-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255,255,255,0.04) 45%,
            rgba(255,255,255,0.06) 50%,
            rgba(255,255,255,0.04) 55%,
            transparent 70%
          );
          background-size: 200% 200%;
          animation: holoShimmer 4s ease-in-out infinite;
          border-radius: inherit;
          z-index: 1;
          pointer-events: none;
        }
        @keyframes holoShimmer {
          0%, 100% { background-position: -100% 0; }
          50% { background-position: 200% 0; }
        }
      `}</style>

      <section className="px-4 py-16 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-purple-400 text-sm font-semibold uppercase tracking-[0.2em] mb-2">Concept Demo</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            Profile Progression
          </h1>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            The more you compete, the more you unlock. Every level tier adds new features, customization, and visual flair to your profile.
          </p>
        </div>

        {/* Tier Selector Bar */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TIERS.map((t, i) => {
            const active = i === selectedIndex;
            return (
              <button
                key={t.level}
                onClick={() => setSelectedIndex(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                  active
                    ? `${t.border} ${t.color} bg-white/5 scale-105`
                    : 'border-gray-700/50 text-gray-500 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                {t.badge}
                <span className="hidden sm:inline">{t.name}</span>
                <span className="text-[10px] opacity-60">Lv.{t.level}</span>
              </button>
            );
          })}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Tier info + unlock roadmap */}
          <div className="lg:col-span-4 space-y-6">
            {/* Current Tier Card */}
            <div className={`bg-gradient-to-br ${tier.bg} ${tier.border} border rounded-2xl p-6`} style={{ boxShadow: tier.glow }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl bg-white/5 ${tier.color}`}>{tier.badge}</div>
                <div>
                  <h2 className={`text-xl font-bold ${tier.color}`}>{tier.name}</h2>
                  <p className="text-xs text-gray-500">Level {tier.level} · {tier.exp} EXP</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                New unlocks at this tier:
              </p>
              <ul className="space-y-2">
                {tier.unlocks.map((u, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.color}`} />
                    <div>
                      <span className="text-white font-medium">{u.label}</span>
                      <p className="text-xs text-gray-500 leading-tight">{u.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Full Roadmap */}
            <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Level Roadmap</h3>
              <div className="space-y-1">
                {TIERS.map((t, i) => {
                  const unlocked = i <= selectedIndex;
                  return (
                    <button
                      key={t.level}
                      onClick={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                        i === selectedIndex
                          ? `bg-white/5 ${t.border} border`
                          : 'hover:bg-white/[0.02] border border-transparent'
                      }`}
                    >
                      <div className={`flex-shrink-0 ${unlocked ? t.color : 'text-gray-600'}`}>
                        {unlocked ? t.badge : <Lock className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${unlocked ? 'text-white' : 'text-gray-600'}`}>
                          {t.name}
                        </p>
                        <p className="text-[10px] text-gray-500">Lv.{t.level} · {t.unlocks.length} unlock{t.unlocks.length !== 1 ? 's' : ''}</p>
                      </div>
                      {i === selectedIndex && <ChevronRight className={`w-4 h-4 ${t.color}`} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Profile preview */}
          <div className="lg:col-span-8">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
              Profile Preview — {tier.name} (Level {tier.level})
            </p>
            <ProfilePreview tier={tier} tierIndex={selectedIndex} />
          </div>
        </div>
      </section>
    </main>
  );
}
