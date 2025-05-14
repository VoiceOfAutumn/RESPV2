// src/app/components/Hero.tsx
import FrontPageLeaderboard from "./FrontPageLeaderboard";
import RecentTournaments from "./RecentTournaments";

export default function HeroLanding() {
  return (    <div className="w-full flex sm:flex-row flex-col pt-20 px-4 gap-4">
      {/* Left Column (3/5 width) */}
      <div className="sm:w-3/5 w-full flex flex-col gap-4">
        {/* Top Block as Full Image (not cropped) */}
        <div className="rounded-xl shadow overflow-hidden">
          <img
            src="https://i.imgur.com/yMDEaFh.png"
            alt="Compete - Win - Level Up"
            className="w-full object-contain"
          />
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
