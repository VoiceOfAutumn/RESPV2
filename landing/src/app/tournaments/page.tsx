'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';

interface Tournament {
  id: number;
  name: string;
  date: string;
  status: string; // Updated field name
  image: string | null;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/tournaments')
      .then(res => res.json())
      .then(data => {
        const sortedTournaments = data.sort((a: Tournament, b: Tournament) => b.id - a.id);
        setTournaments(sortedTournaments);
      })
      .catch(err => console.error('Failed to fetch tournaments:', err));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />
      <section className="flex flex-col items-center justify-center text-center px-4 py-8">
        <h1 className="text-4xl font-semibold mb-8">Tournaments</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {tournaments.map(t => (
            <Link key={t.id} href={`/tournaments/${t.id}`}>
              <div className="flex bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 cursor-pointer transition w-full h-40">
                {/* Image section */}
                <div className="relative w-[20%] h-full">
                  <img
                    src={t.image || 'https://i.imgur.com/4BAhl5o.png'}
                    alt={t.name}
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Gradient blend */}
                <div className="w-[5%] h-full bg-gradient-to-r from-gray-800 to-transparent" />

                {/* Content section */}
                <div className="flex-1 p-4 flex flex-col justify-between text-left">
                  <div className="flex flex-col justify-between h-full">
                    <h2 className="text-2xl font-semibold w-full">{t.name}</h2>
                    <p className="text-sm text-gray-400 mt-2">
                      Date: {new Date(t.date).toLocaleString()}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${statusColor(t.status)}`}>
                    {t.status.toUpperCase()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function statusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'check-in period':
      return 'text-orange-400';
    case 'registration open':
      return 'text-green-400';
    case 'registration closed':
      return 'text-red-400';
    case 'finished':
      return 'text-gray-400';
    default:
      return 'text-white';
  }
}
