// src/app/page.tsx
import Navbar from "./components/Navbar";
import TopBar from "./components/TopBar";
import HeroLanding from "./components/HeroLanding";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />
      <HeroLanding />
      <section className="flex flex-col items-center justify-center text-center px-4 py-8">
      </section>
    </main>
  );
}
