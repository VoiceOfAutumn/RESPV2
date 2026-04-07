// src/app/components/Hero.tsx
import Link from "next/link";
import { Swords, Trophy, TrendingUp, ChevronRight } from "lucide-react";
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
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex items-center gap-4 sm:gap-8">
                <div className="flex flex-col items-center gap-1.5">
                  <Swords className="text-white" size={26} />
                  <span className="text-white font-extrabold text-xs sm:text-base tracking-[0.2em] uppercase">COMPETE</span>
                </div>
                <span className="text-white/40 text-lg font-light">—</span>
                <div className="flex flex-col items-center gap-1.5">
                  <Trophy className="text-white" size={26} />
                  <span className="text-white font-extrabold text-xs sm:text-base tracking-[0.2em] uppercase">WIN</span>
                </div>
                <span className="text-white/40 text-lg font-light">—</span>
                <div className="flex flex-col items-center gap-1.5">
                  <TrendingUp className="text-white" size={26} />
                  <span className="text-white font-extrabold text-xs sm:text-base tracking-[0.2em] uppercase">LEVEL UP!</span>
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
            <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/30 to-transparent" />
            {/* Text covering the right side empty space */}
            <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-right">
              <p className="text-white font-extrabold text-base sm:text-xl lg:text-2xl tracking-[0.15em] uppercase leading-tight">NEW</p>
              <p className="text-white font-extrabold text-base sm:text-xl lg:text-2xl tracking-[0.15em] uppercase leading-tight">PLAYER</p>
              <p className="text-white font-extrabold text-base sm:text-xl lg:text-2xl tracking-[0.15em] uppercase leading-tight">GUIDE</p>
            </div>
            {/* Arrow button in bottom right */}
            <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-purple-500/80 group-hover:border-purple-400/60 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/40">
              <ChevronRight size={20} className="text-white/70 group-hover:text-white transition-all duration-300 group-hover:translate-x-0.5" />
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
