'use client';

import { useState } from 'react';
import PageShell from '../components/PageShell';
import {
  Tag,
  Palette,
  Crown,
  Sparkles,
  Coins,
  ShoppingCart,
  Check,
  Star,
  Gamepad2,
  Zap,
  Heart,
  Shield,
  Flame,
  Ghost,
  Swords,
  Trophy,
} from 'lucide-react';

/* ── Catalogue data ── */

type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview?: string; // tag text shown as a preview chip
};

const CATEGORIES = ['All', 'Profile Tags', 'Name Colors', 'Profile Flair', 'Badges'] as const;

const rarityColors: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  common:    { border: 'border-gray-500/30',  bg: 'bg-gray-500/10',   text: 'text-gray-400',   glow: '' },
  rare:      { border: 'border-blue-500/30',  bg: 'bg-blue-500/10',   text: 'text-blue-400',   glow: '' },
  epic:      { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'shadow-purple-500/10 shadow-lg' },
  legendary: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-400', glow: 'shadow-yellow-500/20 shadow-lg' },
};

const items: ShopItem[] = [
  // ── Profile Tags ──
  { id: 'tag-rts',         name: 'RTS Lover',          description: 'Show off your love for real-time strategy games.',               price: 150,  icon: <Swords size={20} />,   category: 'Profile Tags', rarity: 'common',  preview: 'RTS Lover' },
  { id: 'tag-platformer',  name: 'Platformer Lover',   description: 'For those who live for pixel-perfect jumps.',                    price: 150,  icon: <Gamepad2 size={20} />, category: 'Profile Tags', rarity: 'common',  preview: 'Platformer Lover' },
  { id: 'tag-racing',      name: 'Racing Lover',       description: 'Burn rubber across every retro circuit.',                        price: 150,  icon: <Zap size={20} />,      category: 'Profile Tags', rarity: 'common',  preview: 'Racing Lover' },
  { id: 'tag-fighter',     name: 'Fighter Lover',      description: 'Quarter-circle forward is muscle memory.',                       price: 150,  icon: <Flame size={20} />,    category: 'Profile Tags', rarity: 'common',  preview: 'Fighter Lover' },
  { id: 'tag-puzzle',      name: 'Puzzle Lover',       description: 'Big brain energy, one block at a time.',                         price: 150,  icon: <Star size={20} />,     category: 'Profile Tags', rarity: 'common',  preview: 'Puzzle Lover' },
  { id: 'tag-rpg',         name: 'RPG Lover',          description: 'Grinding levels since the 8-bit era.',                           price: 150,  icon: <Shield size={20} />,   category: 'Profile Tags', rarity: 'common',  preview: 'RPG Lover' },
  { id: 'tag-horror',      name: 'Horror Lover',       description: 'Retro scares are still the best scares.',                        price: 200,  icon: <Ghost size={20} />,    category: 'Profile Tags', rarity: 'rare',    preview: 'Horror Lover' },
  { id: 'tag-completionist', name: 'Completionist',    description: 'You don\'t stop until 100%.',                                    price: 300,  icon: <Check size={20} />,    category: 'Profile Tags', rarity: 'rare',    preview: 'Completionist' },
  { id: 'tag-champion',    name: 'Self-Proclaimed Champ', description: 'Bold claim. Back it up in the tournaments.',                  price: 500,  icon: <Trophy size={20} />,   category: 'Profile Tags', rarity: 'epic',    preview: 'Self-Proclaimed Champ' },
  { id: 'tag-og',          name: 'OG Rival',           description: 'For those who were here from the very beginning.',                price: 1000, icon: <Crown size={20} />,    category: 'Profile Tags', rarity: 'legendary', preview: 'OG Rival' },

  // ── Name Colors ──
  { id: 'color-crimson',   name: 'Crimson Name',       description: 'Your display name appears in bold crimson red.',                 price: 400,  icon: <Palette size={20} />,  category: 'Name Colors', rarity: 'rare' },
  { id: 'color-ocean',     name: 'Ocean Blue Name',    description: 'A cool ocean-blue glow on your name.',                           price: 400,  icon: <Palette size={20} />,  category: 'Name Colors', rarity: 'rare' },
  { id: 'color-emerald',   name: 'Emerald Name',       description: 'Rich emerald green — nature\'s flex.',                           price: 400,  icon: <Palette size={20} />,  category: 'Name Colors', rarity: 'rare' },
  { id: 'color-gold',      name: 'Golden Name',        description: 'A prestigious gold shimmer on your display name.',               price: 800,  icon: <Palette size={20} />,  category: 'Name Colors', rarity: 'epic' },
  { id: 'color-rainbow',   name: 'Rainbow Name',       description: 'Animated rainbow gradient. Maximum drip.',                       price: 2000, icon: <Sparkles size={20} />, category: 'Name Colors', rarity: 'legendary' },

  // ── Profile Flair ──
  { id: 'flair-sparkle',   name: 'Sparkle Border',     description: 'Adds a subtle sparkle effect around your profile picture.',      price: 350,  icon: <Sparkles size={20} />, category: 'Profile Flair', rarity: 'rare' },
  { id: 'flair-flame',     name: 'Flame Border',       description: 'Your avatar burns with competitive fire.',                       price: 600,  icon: <Flame size={20} />,    category: 'Profile Flair', rarity: 'epic' },
  { id: 'flair-banner',    name: 'Custom Banner',      description: 'Upload a custom banner image for your profile header.',          price: 750,  icon: <Palette size={20} />,  category: 'Profile Flair', rarity: 'epic' },
  { id: 'flair-animated',  name: 'Animated Avatar Ring', description: 'A glowing animated ring around your profile picture.',         price: 1500, icon: <Heart size={20} />,    category: 'Profile Flair', rarity: 'legendary' },

  // ── Badges ──
  { id: 'badge-supporter', name: 'Supporter Badge',    description: 'Show that you support the Retro Rivals community.',              price: 250,  icon: <Heart size={20} />,    category: 'Badges', rarity: 'common' },
  { id: 'badge-streak',    name: 'Hot Streak Badge',   description: 'A fiery badge for players on a winning tear.',                   price: 500,  icon: <Flame size={20} />,    category: 'Badges', rarity: 'epic' },
  { id: 'badge-legend',    name: 'Legend Badge',        description: 'An exclusive badge that marks you as a true legend.',            price: 2500, icon: <Crown size={20} />,    category: 'Badges', rarity: 'legendary' },
];

/* ── Component ── */

export default function ShopDemo() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [cart, setCart] = useState<Set<string>>(new Set());
  const userZenny = 3200; // mock balance

  const filtered = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);
  const cartTotal = items.filter(i => cart.has(i.id)).reduce((sum, i) => sum + i.price, 0);

  const toggle = (id: string) => {
    setCart(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Zenny Shop</h1>
            <p className="text-gray-400 text-sm mt-1">Spend your hard-earned Zenny on cosmetics and flair</p>
          </div>
          <div className="flex items-center gap-6">
            {/* Balance */}
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2">
              <Coins className="text-yellow-400" size={18} />
              <span className="text-yellow-400 font-bold text-lg">{userZenny.toLocaleString()}</span>
              <span className="text-yellow-400/60 text-xs uppercase tracking-wider">Zenny</span>
            </div>
            {/* Cart summary */}
            {cart.size > 0 && (
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2">
                <ShoppingCart className="text-purple-400" size={18} />
                <span className="text-purple-400 font-bold">{cart.size}</span>
                <span className="text-purple-400/60 text-xs">|</span>
                <Coins className="text-yellow-400" size={14} />
                <span className="text-yellow-400 font-semibold text-sm">{cartTotal.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Item grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => {
            const r = rarityColors[item.rarity];
            const inCart = cart.has(item.id);
            return (
              <div
                key={item.id}
                className={`relative rounded-xl border ${r.border} ${r.bg} backdrop-blur-sm p-5 flex flex-col gap-3 transition-all hover:scale-[1.02] ${r.glow}`}
              >
                {/* Rarity badge */}
                <span className={`absolute top-3 right-3 text-[9px] uppercase tracking-widest font-bold ${r.text}`}>
                  {item.rarity}
                </span>

                {/* Icon + name */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${r.bg} border ${r.border} flex items-center justify-center ${r.text}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm leading-tight">{item.name}</p>
                    {item.preview && (
                      <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${r.bg} border ${r.border} ${r.text}`}>
                        {item.preview}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-xs leading-relaxed flex-1">{item.description}</p>

                {/* Price + buy */}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5">
                    <Coins className="text-yellow-400" size={14} />
                    <span className="text-yellow-400 font-bold text-sm">{item.price.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => toggle(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      inCart
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    {inCart ? <><Check size={13} /> Added</> : <><ShoppingCart size={13} /> Add to Cart</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkout bar */}
        {cart.size > 0 && (
          <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 px-6 py-4 z-50">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">{cart.size} item{cart.size !== 1 && 's'} selected</span>
                <div className="flex items-center gap-1.5">
                  <Coins className="text-yellow-400" size={16} />
                  <span className="text-yellow-400 font-bold">{cartTotal.toLocaleString()}</span>
                </div>
                {cartTotal > userZenny && (
                  <span className="text-red-400 text-xs">Not enough Zenny!</span>
                )}
              </div>
              <button
                disabled={cartTotal > userZenny}
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold text-sm transition-all"
              >
                Purchase
              </button>
            </div>
          </div>
        )}

        {/* Bottom spacer for checkout bar */}
        {cart.size > 0 && <div className="h-20" />}
      </main>
    </div>
  );
}
