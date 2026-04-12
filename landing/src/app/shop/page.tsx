'use client';

import PageShell from "../components/PageShell";

export default function Shop() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />

      <main className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-semibold text-center mb-16">Shop</h1>

        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 md:gap-2">
          {/* Hachi */}
          <img
            src="/images/Hachi.png"
            alt="Hachi"
            className="w-48 md:w-56 flex-shrink-0 drop-shadow-lg"
          />

          {/* Speech bubble */}
          <div className="relative bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-6 max-w-lg shadow-lg">
            {/* Tail pointing left toward Hachi */}
            <div className="hidden md:block absolute top-10 -left-3 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-white/10" />

            <p className="text-lg font-bold text-white mb-3">Hey there Player!</p>
            <p className="text-gray-300 leading-relaxed">
              We&apos;re still building up the shop right now. But don&apos;t worry, once we are set up, you&apos;re
              the first to get a taste of our products! Make sure you stock up on Zenny for our
              grand opening so you can access all our merchandise!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
