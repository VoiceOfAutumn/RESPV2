'use client';

import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";

export default function Rules() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12 mt-12">
        <h1 className="text-3xl font-bold mb-6 border-b border-neutral-700 pb-2">Rules & Guidelines</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Rule 1</h2>
          <p className="text-gray-300">
            This is where the first rule would go.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Rule 2</h2>
          <p className="text-gray-300">
            This is where the second rule would go.
          </p>
        </section>

        {/* Add more sections as necessary */}

        <p className="pt-6 italic text-gray-400 text-xs">
          Last updated: April 2025
        </p>
      </main>
    </div>
  );
}
