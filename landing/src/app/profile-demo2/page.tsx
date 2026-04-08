'use client';

import { useState, useEffect, useRef } from 'react';
import PageShell from '../components/PageShell';
import {
  Star, Shield, Crown, Flame, Zap, Gem, Trophy, Sparkles, Lock,
  Palette, Music, MessageSquare, Image, Award, TrendingUp, Swords,
  Globe, Heart, Users, Eye, ChevronDown, ChevronUp, Play,
} from 'lucide-react';

/* ────────────────────────────────────────────
   TIER SYSTEM
   ──────────────────────────────────────────── */

interface Feature {
  label: string;
  icon: React.ReactNode;
  desc: string;
  category: 'profile' | 'social' | 'cosmetic' | 'gameplay';
}

interface Tier {
  level: number;
  name: string;
  exp: string;
  accent: string;       // hex color
  accentTw: string;     // tailwind text
  bgTw: string;         // tailwind bg class for accent areas
  borderTw: string;     // tailwind border
  ringTw: string;       // tailwind ring
  icon: React.ReactNode;
  tagline: string;
  features: Feature[];
}

const TIERS: Tier[] = [
  {
    level: 1, name: 'Newcomer', exp: '0 – 99',
    accent: '#9ca3af', accentTw: 'text-gray-400', bgTw: 'bg-gray-400', borderTw: 'border-gray-500', ringTw: 'ring-gray-500/30',
    icon: <Star className="w-6 h-6" />, tagline: 'Your journey begins here.',
    features: [
      { label: 'Basic Profile', icon: <Eye className="w-4 h-4" />, desc: 'Avatar, display name, country flag, rank & EXP.', category: 'profile' },
      { label: 'Tournament Entry', icon: <Swords className="w-4 h-4" />, desc: 'Sign up for any open tournament.', category: 'gameplay' },
      { label: 'Seal Collection', icon: <Award className="w-4 h-4" />, desc: 'Earn and display achievement seals.', category: 'cosmetic' },
    ],
  },
  {
    level: 5, name: 'Contender', exp: '100 – 499',
    accent: '#4ade80', accentTw: 'text-green-400', bgTw: 'bg-green-400', borderTw: 'border-green-500', ringTw: 'ring-green-500/30',
    icon: <Shield className="w-6 h-6" />, tagline: 'Proving yourself in the arena.',
    features: [
      { label: 'Profile Bio', icon: <MessageSquare className="w-4 h-4" />, desc: 'Write a short tagline that shows under your name.', category: 'profile' },
      { label: 'Banner Gradient', icon: <Palette className="w-4 h-4" />, desc: 'Pick from preset color gradients for your header.', category: 'cosmetic' },
      { label: 'Match History', icon: <TrendingUp className="w-4 h-4" />, desc: 'Public W/L record visible on your profile.', category: 'gameplay' },
      { label: 'Rival System', icon: <Users className="w-4 h-4" />, desc: 'Mark up to 3 players as rivals for quick stat comparison.', category: 'social' },
    ],
  },
  {
    level: 10, name: 'Rival', exp: '500 – 1,499',
    accent: '#60a5fa', accentTw: 'text-blue-400', bgTw: 'bg-blue-400', borderTw: 'border-blue-500', ringTw: 'ring-blue-500/30',
    icon: <Zap className="w-6 h-6" />, tagline: 'A name people recognize.',
    features: [
      { label: 'Custom Banner', icon: <Image className="w-4 h-4" />, desc: 'Upload your own profile banner image.', category: 'cosmetic' },
      { label: 'Favorite Games', icon: <Heart className="w-4 h-4" />, desc: 'Pin up to 3 retro titles you love to your card.', category: 'profile' },
      { label: 'Animated Ring', icon: <Sparkles className="w-4 h-4" />, desc: 'A pulsing colored glow around your avatar.', category: 'cosmetic' },
      { label: 'Profile Visitors', icon: <Eye className="w-4 h-4" />, desc: 'See who visited your profile recently.', category: 'social' },
    ],
  },
  {
    level: 20, name: 'Veteran', exp: '1,500 – 3,999',
    accent: '#c084fc', accentTw: 'text-purple-400', bgTw: 'bg-purple-400', borderTw: 'border-purple-500', ringTw: 'ring-purple-500/30',
    icon: <Flame className="w-6 h-6" />, tagline: 'Battle-hardened and feared.',
    features: [
      { label: 'Profile Theme', icon: <Palette className="w-4 h-4" />, desc: 'Full color theme (purple, red, cyan, lime…) for all profile elements.', category: 'cosmetic' },
      { label: 'Trophy Case', icon: <Trophy className="w-4 h-4" />, desc: 'Pin your top 3 tournament placements for all to see.', category: 'profile' },
      { label: 'Profile Music', icon: <Music className="w-4 h-4" />, desc: 'Visitors can play a short chiptune you choose.', category: 'cosmetic' },
      { label: 'Social Links', icon: <Globe className="w-4 h-4" />, desc: 'Twitch, Discord, X, YouTube links on your profile.', category: 'social' },
      { label: 'Tournament Predictions', icon: <TrendingUp className="w-4 h-4" />, desc: 'Access the prediction system for upcoming brackets.', category: 'gameplay' },
    ],
  },
  {
    level: 35, name: 'Elite', exp: '4,000 – 7,999',
    accent: '#fb923c', accentTw: 'text-orange-400', bgTw: 'bg-orange-400', borderTw: 'border-orange-500', ringTw: 'ring-orange-500/30',
    icon: <Crown className="w-6 h-6" />, tagline: 'Among the very best.',
    features: [
      { label: 'Animated Banner', icon: <Sparkles className="w-4 h-4" />, desc: 'Use GIF/WebP animated banners on your profile.', category: 'cosmetic' },
      { label: 'Custom Title', icon: <Award className="w-4 h-4" />, desc: 'Create a colored title under your name ("The Undefeated").', category: 'cosmetic' },
      { label: 'Clan Tag', icon: <Users className="w-4 h-4" />, desc: 'Show a clan/team tag in brackets and leaderboards.', category: 'social' },
      { label: 'Priority Queue', icon: <Swords className="w-4 h-4" />, desc: 'Priority placement when tournaments are oversubscribed.', category: 'gameplay' },
    ],
  },
  {
    level: 50, name: 'Legend', exp: '8,000+',
    accent: '#facc15', accentTw: 'text-yellow-400', bgTw: 'bg-yellow-400', borderTw: 'border-yellow-500', ringTw: 'ring-yellow-500/30',
    icon: <Gem className="w-6 h-6" />, tagline: 'Immortalized in retro history.',
    features: [
      { label: 'Holographic Card', icon: <Sparkles className="w-4 h-4" />, desc: 'Rainbow shimmer effect on your profile card.', category: 'cosmetic' },
      { label: 'Legend Frame', icon: <Gem className="w-4 h-4" />, desc: 'Animated golden border frame around your avatar everywhere.', category: 'cosmetic' },
      { label: 'Custom Name Color', icon: <Palette className="w-4 h-4" />, desc: 'Pick a gradient color for your display name site-wide.', category: 'cosmetic' },
      { label: 'Profile Emotes', icon: <MessageSquare className="w-4 h-4" />, desc: 'Unlockable retro emotes for your profile wall.', category: 'social' },
      { label: 'Legacy Badge', icon: <Award className="w-4 h-4" />, desc: 'Permanent "Legend" badge visible on every leaderboard.', category: 'profile' },
    ],
  },
];

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  profile: { label: 'Profile', color: 'text-blue-400' },
  social: { label: 'Social', color: 'text-pink-400' },
  cosmetic: { label: 'Cosmetic', color: 'text-amber-400' },
  gameplay: { label: 'Gameplay', color: 'text-green-400' },
};

/* helper: total features up to tier index */
function totalUnlocks(upTo: number) {
  let n = 0;
  for (let i = 0; i <= upTo; i++) n += TIERS[i].features.length;
  return n;
}

/* ────────────────────────────────────────────
   MINI PROFILE CARD (lives inside right panel)
   ──────────────────────────────────────────── */

function MiniProfile({ tier, tierIndex }: { tier: Tier; tierIndex: number }) {
  const hasAnimRing = tierIndex >= 2;
  const hasLegendFrame = tierIndex >= 5;
  const hasBio = tierIndex >= 1;
  const hasBannerGrad = tierIndex >= 1;
  const hasBannerImg = tierIndex >= 2;
  const hasAnimBanner = tierIndex >= 4;
  const hasTitle = tierIndex >= 4;
  const hasClan = tierIndex >= 4;
  const hasNameColor = tierIndex >= 5;
  const hasHolo = tierIndex >= 5;
  const hasMusic = tierIndex >= 3;
  const hasSocials = tierIndex >= 3;
  const hasFavGames = tierIndex >= 2;
  const hasTrophies = tierIndex >= 3;
  const hasMatchHistory = tierIndex >= 1;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-white/[0.06] transition-all duration-500 ${hasHolo ? 'holo-card' : ''}`}
      style={{ boxShadow: `0 0 40px ${tier.accent}18, 0 2px 24px rgba(0,0,0,0.5)` }}
    >
      {/* Banner */}
      <div className={`h-24 relative ${hasBannerGrad ? '' : 'bg-gray-800/80'}`}
        style={hasBannerGrad ? { background: `linear-gradient(135deg, ${tier.accent}30, transparent 60%, ${tier.accent}15)` } : undefined}
      >
        {hasBannerImg && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-600 text-[10px] flex items-center gap-1">
              {hasAnimBanner ? <><Sparkles className="w-3 h-3 text-orange-400 animate-pulse" /> Animated Banner</> : <><Image className="w-3 h-3" /> Custom Banner</>}
            </span>
          </div>
        )}
        {hasMusic && (
          <button className="absolute top-2 right-2 bg-black/50 backdrop-blur rounded-full p-1.5 border border-white/10 hover:border-purple-500/50 transition-colors">
            <Play className="w-3 h-3 text-purple-400" />
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-950 to-transparent" />
      </div>

      {/* Body */}
      <div className="bg-gray-950 px-5 pb-5 -mt-8 relative z-10">
        <div className="flex items-end gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-16 h-16 rounded-full bg-gray-700 border-[3px] flex items-center justify-center text-lg font-bold text-gray-400 ${
                hasLegendFrame ? 'border-yellow-500 ring-2 ring-yellow-400/40' :
                hasAnimRing ? 'border-blue-500 ring-2 ring-blue-400/30 animate-pulse' :
                'border-gray-600'
              }`}
            >
              RR
            </div>
            <span className={`absolute -bottom-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-900 border ${tier.borderTw} ${tier.accentTw}`}>
              {tier.level}
            </span>
          </div>
          {/* Name + Title */}
          <div className="min-w-0 pb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {hasClan && <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 rounded">[RR]</span>}
              <span className={`font-bold text-base leading-tight ${hasNameColor ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent' : 'text-white'}`}>
                RetroPlayer
              </span>
              <span className={tier.accentTw}>{tier.icon}</span>
            </div>
            {hasTitle && <p className="text-orange-400 text-[10px] font-semibold leading-tight">&quot;The Undefeated&quot;</p>}
            {hasBio && <p className="text-gray-500 text-[10px] mt-0.5 leading-tight truncate">&quot;Speedrunner since &apos;92&quot;</p>}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 flex gap-2">
          <div className="flex-1 bg-white/[0.03] rounded-lg py-1.5 text-center border border-white/[0.04]">
            <p className="text-sm font-bold text-purple-400">2,480</p>
            <p className="text-[8px] text-gray-600 uppercase tracking-wider">EXP</p>
          </div>
          <div className="flex-1 bg-white/[0.03] rounded-lg py-1.5 text-center border border-white/[0.04]">
            <p className="text-sm font-bold text-white">#14</p>
            <p className="text-[8px] text-gray-600 uppercase tracking-wider">Rank</p>
          </div>
          <div className="flex-1 bg-white/[0.03] rounded-lg py-1.5 text-center border border-white/[0.04]">
            <p className="text-sm font-bold text-white">87%</p>
            <p className="text-[8px] text-gray-600 uppercase tracking-wider">Win Rate</p>
          </div>
        </div>

        {/* Social links */}
        {hasSocials && (
          <div className="mt-3 flex gap-1.5">
            {['Twitch', 'Discord', 'X'].map((s) => (
              <span key={s} className="text-[9px] bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-0.5 text-gray-500">{s}</span>
            ))}
          </div>
        )}

        {/* Fav games */}
        {hasFavGames && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {['Super Metroid', 'Mega Man X', 'Tetris'].map((g) => (
              <span key={g} className="text-[9px] bg-blue-500/8 text-blue-300/80 border border-blue-700/20 rounded px-2 py-0.5">{g}</span>
            ))}
          </div>
        )}

        {/* Trophies */}
        {hasTrophies && (
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[
              { p: '1st', t: 'Spring', c: 'text-yellow-400 border-yellow-700/30' },
              { p: '2nd', t: 'Rumble', c: 'text-gray-300 border-gray-700/30' },
              { p: '3rd', t: 'NES Cup', c: 'text-orange-400 border-orange-700/30' },
            ].map((x) => (
              <div key={x.t} className={`text-center rounded-lg py-1.5 border ${x.c} bg-white/[0.02] text-[10px]`}>
                <Trophy className="w-3 h-3 mx-auto mb-0.5" /><span className="font-bold">{x.p}</span>
                <p className="text-gray-600 text-[8px]">{x.t}</p>
              </div>
            ))}
          </div>
        )}

        {/* Match history */}
        {hasMatchHistory && (
          <div className="mt-3 space-y-1">
            {[
              { vs: 'PixelKing', r: 'W', s: '2–0' },
              { vs: 'ArcadeGhost', r: 'W', s: '2–1' },
              { vs: 'NESMaster', r: 'L', s: '0–2' },
            ].map((m) => (
              <div key={m.vs} className="flex items-center justify-between bg-white/[0.02] rounded px-2.5 py-1 text-[10px] border border-white/[0.03]">
                <span className="text-gray-400">vs <span className="text-gray-200">{m.vs}</span></span>
                <span className="text-gray-600">{m.s}</span>
                <span className={m.r === 'W' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{m.r}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   MAIN PAGE
   ──────────────────────────────────────────── */

export default function ProfileDemo2Page() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedTier, setExpandedTier] = useState<number | null>(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const tier = TIERS[activeIndex];

  /* scroll-spy: highlight tier when its section is in view */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />

      <style>{`
        .holo-card { position: relative; }
        .holo-card::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.04) 55%, transparent 70%);
          background-size: 200% 200%;
          animation: holoShimmer 4s ease-in-out infinite;
          border-radius: inherit; z-index: 2; pointer-events: none;
        }
        @keyframes holoShimmer {
          0%, 100% { background-position: -100% 0; }
          50% { background-position: 200% 0; }
        }
        .tier-line { position: relative; }
        .tier-line::before {
          content: ''; position: absolute; left: 19px; top: 0; bottom: 0; width: 2px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
        }
      `}</style>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* ═══════════════ LEFT: Scrollable Tier Sections ═══════════════ */}
        <div className="flex-1 overflow-y-auto scroll-smooth" id="tier-scroll">
          {/* Hero */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent pointer-events-none" />
            <div className="px-6 md:px-12 pt-16 pb-12 max-w-3xl">
              <p className="text-purple-400 text-xs font-bold uppercase tracking-[0.25em] mb-3">Concept V2</p>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Level Up.<br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Unlock More.</span>
              </h1>
              <p className="text-gray-400 mt-4 text-sm max-w-md leading-relaxed">
                Every match earns EXP. Every tier unlocks new profile features, cosmetics, social tools, and gameplay perks. Scroll down to explore every tier.
              </p>
              <div className="mt-6 flex gap-4 text-[10px] uppercase tracking-widest font-semibold text-gray-500">
                <span>6 tiers</span>
                <span className="text-gray-700">•</span>
                <span>{TIERS.reduce((a, t) => a + t.features.length, 0)} unlocks</span>
                <span className="text-gray-700">•</span>
                <span>4 categories</span>
              </div>
            </div>
          </div>

          {/* Tier Sections */}
          <div className="px-6 md:px-12 pb-24 space-y-0 tier-line">
            {TIERS.map((t, i) => {
              const isActive = i === activeIndex;
              const isExpanded = expandedTier === i;
              return (
                <div
                  key={t.level}
                  ref={(el) => { sectionRefs.current[i] = el; }}
                  className="relative pl-12 py-10 first:pt-4"
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-2.5 top-12 first:top-6 w-5 h-5 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${
                      isActive ? `${t.borderTw} ${t.bgTw}/20` : 'border-gray-700 bg-gray-900'
                    }`}
                  >
                    {i <= activeIndex ? (
                      <div className={`w-2 h-2 rounded-full ${t.bgTw} transition-all duration-500 ${isActive ? 'scale-100' : 'scale-75 opacity-50'}`} />
                    ) : (
                      <Lock className="w-2.5 h-2.5 text-gray-600" />
                    )}
                  </div>

                  {/* Tier Header */}
                  <button
                    onClick={() => {
                      setActiveIndex(i);
                      setExpandedTier(isExpanded ? null : i);
                    }}
                    className={`w-full text-left group transition-all duration-300 rounded-xl p-4 -ml-2 ${
                      isActive ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`transition-colors duration-300 ${isActive ? t.accentTw : 'text-gray-600'}`}>
                          {t.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className={`text-lg font-bold transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                              {t.name}
                            </h2>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all duration-300 ${
                              isActive ? `${t.accentTw} bg-white/[0.06]` : 'text-gray-600 bg-white/[0.02]'
                            }`}>
                              Lv.{t.level}
                            </span>
                            <span className="text-[10px] text-gray-600">{t.exp} EXP</span>
                          </div>
                          <p className={`text-xs mt-0.5 transition-colors ${isActive ? 'text-gray-400' : 'text-gray-600'}`}>{t.tagline}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium ${t.accentTw} opacity-60`}>
                          {t.features.length} unlock{t.features.length !== 1 ? 's' : ''}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                      </div>
                    </div>

                    {/* Feature pills (always visible, compact) */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {t.features.map((f, fi) => (
                        <span
                          key={fi}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all duration-300 ${
                            isActive
                              ? `${t.accentTw} border-current/20 bg-current/5`
                              : 'text-gray-600 border-gray-800 bg-white/[0.01]'
                          }`}
                          style={isActive ? { borderColor: `${t.accent}30`, backgroundColor: `${t.accent}08` } : undefined}
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </button>

                  {/* Expanded details */}
                  <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[600px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-2 pl-2">
                      {t.features.map((f, fi) => {
                        const cat = CATEGORY_META[f.category];
                        return (
                          <div key={fi} className="flex items-start gap-3 bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                            <div className={`mt-0.5 ${t.accentTw}`}>{f.icon}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">{f.label}</span>
                                <span className={`text-[9px] font-medium ${cat.color} bg-white/[0.04] px-1.5 py-0.5 rounded`}>{cat.label}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Cumulative count */}
                    <p className="text-[10px] text-gray-600 mt-3 pl-2">
                      Total features unlocked by Level {t.level}: <span className={`font-bold ${t.accentTw}`}>{totalUnlocks(i)}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════ RIGHT: Sticky Preview ═══════════════ */}
        <div className="hidden lg:flex w-[380px] flex-shrink-0 flex-col border-l border-white/[0.04] bg-gray-950/50">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Live Preview</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={tier.accentTw}>{tier.icon}</span>
              <span className="text-sm font-bold text-white">{tier.name}</span>
              <span className="text-[10px] text-gray-600">Lv.{tier.level}</span>
            </div>
          </div>

          {/* Scrollable preview card */}
          <div className="flex-1 overflow-y-auto p-5">
            <MiniProfile tier={tier} tierIndex={activeIndex} />

            {/* Category breakdown */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              {(['profile', 'cosmetic', 'social', 'gameplay'] as const).map((cat) => {
                const meta = CATEGORY_META[cat];
                let count = 0;
                for (let i = 0; i <= activeIndex; i++) {
                  count += TIERS[i].features.filter((f) => f.category === cat).length;
                }
                return (
                  <div key={cat} className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04] text-center">
                    <p className={`text-lg font-bold ${meta.color}`}>{count}</p>
                    <p className="text-[9px] text-gray-600 uppercase tracking-wider">{meta.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Progress */}
            <div className="mt-5">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                <span>Tier {activeIndex + 1} / {TIERS.length}</span>
                <span>{totalUnlocks(activeIndex)} / {totalUnlocks(TIERS.length - 1)} unlocks</span>
              </div>
              <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${(totalUnlocks(activeIndex) / totalUnlocks(TIERS.length - 1)) * 100}%`,
                    backgroundColor: tier.accent,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
