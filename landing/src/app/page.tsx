'use client';

import { useEffect } from 'react';
import Navbar from "./components/Navbar";
import TopBar from "./components/TopBar";
import HeroLanding from "./components/HeroLanding";
import { useToast } from './components/ToastContext';

export default function Home() {
  const { showToast } = useToast();

  useEffect(() => {
    const justLoggedIn = localStorage.getItem('justLoggedIn');
    if (justLoggedIn) {
      showToast(`Welcome back, ${justLoggedIn}! 🎮`);
      localStorage.removeItem('justLoggedIn');
    }
  }, [showToast]);
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-2 pl-64">
      <TopBar />
      <Navbar />
      <HeroLanding />
      <section className="flex flex-col items-center justify-center text-center px-4 py-8">
      </section>
    </main>
  );
}
