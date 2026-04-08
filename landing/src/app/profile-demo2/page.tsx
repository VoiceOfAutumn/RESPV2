'use client';

import { useState } from 'react';
import PageShell from '../components/PageShell';
import {
  Star, Shield, Crown, Flame, Zap, Gem, Trophy, Sparkles,
  Palette, Music, MessageSquare, Image, Award, TrendingUp, Swords,
  Globe, Heart, Users, Eye, Play, MapPin, Calendar,
  ExternalLink,
} from 'lucide-react';

/* ────────────────────────────────────────────
   TIER DEFINITIONS (drives what's visible)
   ──────────────────────────────────────────── */

interface TierDef {
  level: number;
  name: string;
  exp: string;
  accent: string;
  accentTw: string;
  borderTw: string;
  icon: React.ReactNode;
}

const TIERS: TierDef[] = [
  { level: 1,  name: 'Newcomer',  exp: '0 – 99',      accent: '#9ca3af', accentTw: 'text-gray-400',   borderTw: 'border-gray-500',   icon: <Star className="w-4 h-4" /> },
  { level: 5,  name: 'Contender', exp: '100 – 499',    accent: '#4ade80', accentTw: 'text-green-400',  borderTw: 'border-green-500',  icon: <Shield className="w-4 h-4" /> },
  { level: 10, name: 'Rival',     exp: '500 – 1,499',  accent: '#60a5fa', accentTw: 'text-blue-400',   borderTw: 'border-blue-500',   icon: <Zap className="w-4 h-4" /> },
  { level: 20, name: 'Veteran',   exp: '1,500 – 3,999',accent: '#c084fc', accentTw: 'text-purple-400', borderTw: 'border-purple-500', icon: <Flame className="w-4 h-4" /> },
  { level: 35, name: 'Elite',     exp: '4,000 – 7,999',accent: '#fb923c', accentTw: 'text-orange-400', borderTw: 'border-orange-500', icon: <Crown className="w-4 h-4" /> },
  { level: 50, name: 'Legend',    exp: '8,000+',        accent: '#facc15', accentTw: 'text-yellow-400', borderTw: 'border-yellow-500', icon: <Gem className="w-4 h-4" /> },
];

/* ────────────────────────────────────────────
   DEMO PAGE — full-width profile concept
   ──────────────────────────────────────────── */

export default function ProfileDemo2Page() {
  const [tierIndex, setTierIndex] = useState(0);
  const t = TIERS[tierIndex];

  // Feature flags driven by tier
  const hasBio        = tierIndex >= 1;
  const hasBannerGrad = tierIndex >= 1;
  const hasMatchHist  = tierIndex >= 1;
  const hasRivals     = tierIndex >= 1;
  const hasBannerImg  = tierIndex >= 2;
  const hasFavGames   = tierIndex >= 2;
  const hasAnimRing   = tierIndex >= 2;
  const hasVisitors   = tierIndex >= 2;
  const hasTheme      = tierIndex >= 3;
  const hasTrophies   = tierIndex >= 3;
  const hasMusic      = tierIndex >= 3;
  const hasSocials    = tierIndex >= 3;
  const hasAnimBanner = tierIndex >= 4;
  const hasTitle      = tierIndex >= 4;
  const hasClan       = tierIndex >= 4;
  const hasHolo       = tierIndex >= 5;
  const hasLegendFrame= tierIndex >= 5;
  const hasNameColor  = tierIndex >= 5;
  const hasEmotes     = tierIndex >= 5;

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />

      <style>{`
        .holo-shimmer { position: relative; overflow: hidden; }
        .holo-shimmer::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 70%);
          background-size: 200% 200%;
          animation: hShimmer 4s ease-in-out infinite;
          pointer-events: none; z-index: 1;
        }
        @keyframes hShimmer { 0%,100%{background-position:-100% 0} 50%{background-position:200% 0} }
        .legend-ring { animation: legendPulse 3s ease-in-out infinite; }
        @keyframes legendPulse { 0%,100%{box-shadow:0 0 0 0 rgba(250,204,21,0.3)} 50%{box-shadow:0 0 0 8px rgba(250,204,21,0)} }
      `}</style>

      {/* ── Tier Switcher (demo control) ── */}
      <div className="sticky top-16 z-40 bg-black/60 backdrop-blur-lg border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 overflow-x-auto">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex-shrink-0 mr-1">Demo Tier</span>
          {TIERS.map((tier, i) => (
            <button
              key={tier.level}
              onClick={() => setTierIndex(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                i === tierIndex
                  ? `${tier.accentTw} bg-white/[0.08] ${tier.borderTw} border`
                  : 'text-gray-600 hover:text-gray-400 border border-transparent'
              }`}
            >
              {tier.icon}
              <span className="hidden sm:inline">{tier.name}</span>
              <span className="text-[9px] opacity-50">Lv.{tier.level}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          FULL-WIDTH PROFILE PAGE
          ═══════════════════════════════════════════ */}
      <div className={`${hasHolo ? 'holo-shimmer' : ''}`}>

        {/* ── BANNER ── */}
        <div
          className="relative w-full h-48 md:h-64 overflow-hidden"
          style={hasBannerGrad
            ? { background: `linear-gradient(135deg, ${t.accent}25 0%, transparent 40%, ${t.accent}10 100%)` }
            : { background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' }
          }
        >
          {hasBannerImg && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs gap-1.5">
              {hasAnimBanner
                ? <><Sparkles className="w-4 h-4 text-orange-400 animate-pulse" /> Animated Banner</>
                : <><Image className="w-4 h-4" /> Custom Banner Image</>
              }
            </div>
          )}
          {hasMusic && (
            <button className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm rounded-full p-2.5 border border-white/10 hover:border-purple-500/40 transition-all hover:scale-105 group">
              <Play className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
            </button>
          )}
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>

        {/* ── PROFILE HEADER (overlaps banner) ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className={`w-36 h-36 md:w-40 md:h-40 rounded-full bg-gray-800 border-4 flex items-center justify-center text-4xl font-bold text-gray-500 overflow-hidden ${
                  hasLegendFrame ? 'border-yellow-500 legend-ring' :
                  hasAnimRing ? 'border-blue-500 ring-4 ring-blue-400/20' :
                  'border-gray-700'
                }`}
              >
                <img src="/images/default-avatar.png" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              {/* Level badge */}
              <div
                className={`absolute -bottom-1 -right-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-900 border-2 ${t.borderTw} ${t.accentTw}`}
              >
                Lv.{t.level}
              </div>
            </div>

            {/* Name & Meta */}
            <div className="flex-1 text-center md:text-left pb-1 min-w-0">
              <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                {hasClan && (
                  <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">[RETRO]</span>
                )}
                <h1 className={`text-3xl md:text-4xl font-extrabold truncate ${
                  hasNameColor
                    ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent'
                    : 'text-white'
                }`}>
                  RetroPlayer
                </h1>
                <span className={`${t.accentTw} flex-shrink-0`}>{t.icon}</span>
              </div>
              {hasTitle && (
                <p className="text-orange-400/80 text-sm font-semibold mt-0.5">&quot;The Undefeated&quot;</p>
              )}
              {hasBio && (
                <p className="text-gray-400 text-sm mt-1 max-w-md">&quot;Speedrunner and retro purist since &apos;92. Let&apos;s settle it in the arena.&quot;</p>
              )}
              <div className="flex items-center gap-4 mt-2 justify-center md:justify-start text-xs text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Netherlands</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined 2025</span>
                {hasVisitors && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> 1,247 views</span>}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0 pb-1">
              {hasRivals && (
                <button className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm font-medium text-gray-300 hover:bg-white/[0.1] transition-colors">
                  Add Rival
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'EXP', value: '2,480', color: 'text-purple-400' },
              { label: 'Rank', value: '#14', color: 'text-white' },
              { label: 'Win Rate', value: '74%', color: 'text-green-400' },
              { label: 'Tournaments', value: '23', color: 'text-blue-400' },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 border border-white/[0.06] text-center">
                <p className={`text-2xl md:text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SOCIAL LINKS (Veteran+) ── */}
        {hasSocials && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
            <div className="flex gap-2 flex-wrap">
              {[
                { name: 'Twitch', color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
                { name: 'Discord', color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
                { name: 'X / Twitter', color: 'text-gray-300 border-gray-600/30 bg-gray-500/5' },
                { name: 'YouTube', color: 'text-red-400 border-red-500/20 bg-red-500/5' },
              ].map((link) => (
                <span key={link.name} className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${link.color} flex items-center gap-1.5`}>
                  <ExternalLink className="w-3 h-3" />{link.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT GRID ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ════ LEFT COLUMN ════ */}
            <div className="lg:col-span-2 space-y-6">

              {/* Favorite Games (Rival+) */}
              {hasFavGames && (
                <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-400" /> Favorite Games
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { name: 'Super Metroid', platform: 'SNES', hours: '340h' },
                      { name: 'Mega Man X', platform: 'SNES', hours: '215h' },
                      { name: 'Tetris', platform: 'NES', hours: '980h' },
                    ].map((game) => (
                      <div key={game.name} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04] hover:border-white/[0.1] transition-colors">
                        <div className="w-full h-20 bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                          <Swords className="w-6 h-6 text-gray-600" />
                        </div>
                        <p className="text-sm font-semibold text-white">{game.name}</p>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500">
                          <span>{game.platform}</span>
                          <span>{game.hours}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Trophy Case (Veteran+) */}
              {hasTrophies && (
                <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" /> Trophy Case
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { place: '1st', name: 'Spring Showdown 2025', game: 'Super Metroid', border: 'border-yellow-600/30', text: 'text-yellow-400', bg: 'bg-yellow-500/5' },
                      { place: '2nd', name: 'Retro Rumble #4', game: 'Mega Man X', border: 'border-gray-500/30', text: 'text-gray-300', bg: 'bg-gray-500/5' },
                      { place: '3rd', name: 'NES Championship', game: 'Tetris', border: 'border-orange-600/30', text: 'text-orange-400', bg: 'bg-orange-500/5' },
                    ].map((trophy) => (
                      <div key={trophy.name} className={`${trophy.bg} ${trophy.border} border rounded-xl p-4 text-center`}>
                        <Trophy className={`w-8 h-8 mx-auto mb-2 ${trophy.text}`} />
                        <p className={`text-lg font-extrabold ${trophy.text}`}>{trophy.place}</p>
                        <p className="text-xs text-white font-medium mt-1">{trophy.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{trophy.game}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Match History (Contender+) */}
              {hasMatchHist && (
                <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" /> Match History
                  </h2>
                  <div className="space-y-2">
                    {[
                      { vs: 'PixelKing', tournament: 'Spring Showdown', result: 'W', score: '2 – 0', date: 'Mar 12' },
                      { vs: 'ArcadeGhost', tournament: 'Spring Showdown', result: 'W', score: '2 – 1', date: 'Mar 12' },
                      { vs: 'NESMaster', tournament: 'Retro Rumble #4', result: 'L', score: '0 – 2', date: 'Feb 28' },
                      { vs: 'SpeedDemon', tournament: 'Retro Rumble #4', result: 'W', score: '2 – 0', date: 'Feb 28' },
                      { vs: 'ClassicHero', tournament: 'NES Championship', result: 'W', score: '2 – 1', date: 'Jan 15' },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center gap-4 bg-white/[0.02] rounded-lg px-4 py-3 border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          m.result === 'W' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {m.result}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium">
                            vs <span className="text-purple-400">{m.vs}</span>
                          </p>
                          <p className="text-[10px] text-gray-500">{m.tournament}</p>
                        </div>
                        <span className="text-sm text-gray-300 font-mono">{m.score}</span>
                        <span className="text-[10px] text-gray-600 hidden sm:block">{m.date}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ════ RIGHT COLUMN ════ */}
            <div className="space-y-6">

              {/* Tier Badge */}
              <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.04] border ${t.borderTw} ${t.accentTw}`}>
                    {t.icon}
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${t.accentTw}`}>{t.name}</p>
                    <p className="text-[10px] text-gray-500">Level {t.level} · {t.exp} EXP</p>
                  </div>
                </div>
                {/* EXP Progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                    <span>2,480 EXP</span>
                    <span>{tierIndex < TIERS.length - 1 ? `Next: ${TIERS[tierIndex + 1].name}` : 'Max Tier'}</span>
                  </div>
                  <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: tierIndex < TIERS.length - 1 ? '62%' : '100%', backgroundColor: t.accent }}
                    />
                  </div>
                </div>
              </section>

              {/* Seals */}
              <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" /> Seals
                </h2>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'First Win', emoji: '🏆' },
                    { name: 'Speedster', emoji: '⚡' },
                    { name: '10 Streak', emoji: '🔥' },
                    { name: 'Supporter', emoji: '💜' },
                  ].map((seal) => (
                    <div key={seal.name} className="group relative flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-purple-500/30 flex items-center justify-center text-lg group-hover:border-purple-400 group-hover:scale-110 transition-all">
                        {seal.emoji}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{seal.name}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Rivals (Contender+) */}
              {hasRivals && (
                <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-400" /> Rivals
                  </h2>
                  <div className="space-y-2">
                    {[
                      { name: 'PixelKing', wins: 5, losses: 2 },
                      { name: 'NESMaster', wins: 3, losses: 4 },
                      { name: 'ArcadeGhost', wins: 7, losses: 1 },
                    ].map((rival) => (
                      <div key={rival.name} className="flex items-center gap-3 bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04]">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-400">
                          {rival.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{rival.name}</p>
                          <p className="text-[10px] text-gray-500">
                            <span className="text-green-400">{rival.wins}W</span> – <span className="text-red-400">{rival.losses}L</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Profile Music (Veteran+) */}
              {hasMusic && (
                <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Music className="w-4 h-4 text-pink-400" /> Profile Music
                  </h2>
                  <div className="flex items-center gap-3 bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
                    <button className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center hover:bg-purple-500/20 transition-colors">
                      <Play className="w-4 h-4 text-purple-400" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white">Green Hill Zone</p>
                      <p className="text-[10px] text-gray-500">Chiptune · 0:32 loop</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Emotes (Legend) */}
              {hasEmotes && (
                <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-yellow-400" /> Emotes
                  </h2>
                  <div className="flex gap-2 flex-wrap">
                    {['🎮', '⚔️', '🏆', '🔥', '💀', '👑', '🎯', '✨'].map((e, i) => (
                      <div key={i} className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-lg hover:scale-110 hover:bg-white/[0.08] transition-all cursor-pointer">
                        {e}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Profile Theme (Veteran+) */}
              {hasTheme && (
                <section className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-400" /> Theme
                  </h2>
                  <div className="flex gap-2">
                    {[
                      { name: 'Purple', from: '#7c3aed', to: '#a855f7' },
                      { name: 'Red', from: '#dc2626', to: '#f97316' },
                      { name: 'Cyan', from: '#06b6d4', to: '#3b82f6' },
                      { name: 'Lime', from: '#65a30d', to: '#22d3ee' },
                    ].map((theme) => (
                      <button
                        key={theme.name}
                        className="w-8 h-8 rounded-full border-2 border-white/10 hover:border-white/30 transition-colors hover:scale-110"
                        style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
                        title={theme.name}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
