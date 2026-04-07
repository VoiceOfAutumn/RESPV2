// src/app/components/Hero.tsx
import Link from "next/link";
import { Swords, Trophy, TrendingUp, ArrowRight } from "lucide-react";
import FrontPageLeaderboard from "./FrontPageLeaderboard";
import RecentTournaments from "./RecentTournaments";

export default function HeroLanding() {
  return (    <div className="w-full flex sm:flex-row flex-col pt-20 px-4 gap-4">
      {/* Left Column (3/5 width) */}
      <div className="sm:w-3/5 w-full flex flex-col gap-4">
        {/* Hero Banner with backdrop */}
        <div className="flex gap-4">
          {/* Compete - Win - Level Up banner */}
          <div className="relative flex-1 rounded-xl shadow overflow-hidden">
            <img
              src="/images/EmptyHeaderBar.png"
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex items-center gap-6 sm:gap-10">
                <div className="flex flex-col items-center gap-1.5">
                  <Swords className="text-purple-400" size={28} />
                  <span className="text-white font-bold text-sm sm:text-lg">Compete</span>
                </div>
                <span className="text-gray-500 text-xl font-light">—</span>
                <div className="flex flex-col items-center gap-1.5">
                  <Trophy className="text-yellow-400" size={28} />
                  <span className="text-white font-bold text-sm sm:text-lg">Win</span>
                </div>
                <span className="text-gray-500 text-xl font-light">—</span>
                <div className="flex flex-col items-center gap-1.5">
                  <TrendingUp className="text-green-400" size={28} />
                  <span className="text-white font-bold text-sm sm:text-lg">Level Up!</span>
                </div>
              </div>
            </div>
          </div>

          {/* New Player Guide card */}
          <Link href="/guide" className="relative group rounded-xl shadow overflow-hidden w-2/5 flex-shrink-0 block">
            <img
              src="/images/NewPlayerGuide.png"
              alt="New Player Guide"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-transparent to-transparent" />
            {/* Text positioned to the right of the character */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right">
              <p className="text-white font-bold text-sm sm:text-base leading-tight">New Player</p>
              <p className="text-white font-bold text-sm sm:text-base leading-tight">Guide</p>
            </div>
            {/* Arrow button in bottom right */}
            <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-purple-600/80 group-hover:bg-purple-500 border border-purple-400/30 group-hover:border-purple-400/60 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/30">
              <ArrowRight size={16} className="text-white transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>

        {/* Bottom Block with Recent Tournaments */}
        <RecentTournaments />
      </div>

      {/* Right Block (2/5 width) */}
      <div className="sm:w-2/5 w-full flex flex-col gap-6">
        <FrontPageLeaderboard />
      </div>
    </div>
  );
}
