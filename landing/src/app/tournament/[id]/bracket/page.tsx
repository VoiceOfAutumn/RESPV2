'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import TopBar from '../../../components/TopBar';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';

interface Match {
  id: number;
  round: number;
  position: number;
  player1?: {
    id: number;
    name: string;
    score?: number;
  };
  player2?: {
    id: number;
    name: string;
    score?: number;
  };
  winner?: number;
  nextMatchId?: number;
}

export default function TournamentBracketPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournament, setTournament] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:3000/tournaments/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Tournament not found');
        return res.json();
      })
      .then((data) => {
        setTournament(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-16 pl-64">
        <TopBar />
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-800 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-16 pl-64">
        <TopBar />
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Tournament</h2>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!tournament) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-16 pl-64">
      <TopBar />
      <Navbar />
      <div className="max-w-[90rem] mx-auto px-4 py-8">
        {/* Tournament Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href={`/tournaments/${id}`}
              className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-2"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Tournament
            </Link>
            <h1 className="text-3xl font-bold text-white">{tournament.name} - Bracket</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              tournament.status.toLowerCase() === 'registration open' ? 'bg-green-500/20 text-green-400' :
              tournament.status.toLowerCase() === 'in progress' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {tournament.status}
            </span>
          </div>
        </div>

        {/* Bracket Container */}
        <div className="overflow-x-auto">
          <div className="min-w-[1000px] p-8 bg-gray-800/50 backdrop-blur rounded-2xl">
            <div className="flex justify-between space-x-8">
              {/* This is a placeholder for the bracket structure */}
              {/* We'll replace this with actual tournament bracket data later */}
              {[...Array(4)].map((_, roundIndex) => (
                <div key={roundIndex} className="flex-1">
                  <div className="text-sm font-medium text-gray-400 mb-4">
                    {roundIndex === 0 ? 'Quarter Finals' :
                     roundIndex === 1 ? 'Semi Finals' :
                     roundIndex === 2 ? 'Finals' :
                     roundIndex === 3 ? 'Winner' : ''}
                  </div>
                  <div className="space-y-4">
                    {[...Array(Math.max(1, 4 >> roundIndex))].map((_, matchIndex) => (
                      <div
                        key={matchIndex}
                        className="relative p-4 bg-gray-700/50 rounded-lg border border-gray-600"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 rounded bg-gray-800/50">
                            <span className="text-white">TBD</span>
                            <span className="text-gray-400">-</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded bg-gray-800/50">
                            <span className="text-white">TBD</span>
                            <span className="text-gray-400">-</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
