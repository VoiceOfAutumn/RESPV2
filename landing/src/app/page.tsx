'use client';

import PageShell from "./components/PageShell";
import HeroLanding from "./components/HeroLanding";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-2 pl-0 lg:pl-64">
      <PageShell />
      <HeroLanding />
      <section className="flex flex-col items-center justify-center text-center px-4 py-8">
      </section>
    </main>
  );
}
