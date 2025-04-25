'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tournament {
  id: number;
  name: string;
  date: string;
  status: string;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/tournaments')
      .then(res => res.json())
      .then(data => setTournaments(data))
      .catch(err => console.error('Failed to fetch tournaments:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Tournaments</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tournaments.map(t => (
          <Link key={t.id} href={`/tournaments/${t.id}`}>
            <div className="bg-gray-800 rounded-2xl p-4 hover:bg-gray-700 cursor-pointer transition">
              <h2 className="text-xl font-semibold">{t.name}</h2>
              <p className="text-sm text-gray-300">Date: {new Date(t.date).toLocaleString()}</p>
              <p className={`text-sm font-semibold mt-1 ${statusColor(t.status)}`}>
                {t.status.toUpperCase()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'upcoming':
      return 'text-yellow-400';
    case 'ongoing':
      return 'text-green-400';
    case 'completed':
      return 'text-gray-400';
    default:
      return 'text-white';
  }
}
