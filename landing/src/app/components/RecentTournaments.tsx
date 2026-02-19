'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface Tournament {
  id: number;
  name: string;
  date: string;
  status: string;
  image: string | null;
}

const RecentTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError,] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data: Tournament[] = await apiRequest('/tournaments');
        // Sort by status priority (open > closed > completed) then by date (newest first)
        const statusPriority: Record<string, number> = {
          registration_open: 0,
          registration_closed: 1,
          in_progress: 2,
          completed: 3,
          finished: 3,
          cancelled: 4,
        };
        const sortedTournaments = data
          .sort((a, b) => {
            const pa = statusPriority[a.status] ?? 99;
            const pb = statusPriority[b.status] ?? 99;
            if (pa !== pb) return pa - pb;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          })
          .slice(0, 3);
        setTournaments(sortedTournaments);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  if (loading) {
    return (
      <div className="bg-neutral-800/50 backdrop-blur rounded-2xl shadow-lg p-8 flex-1 border border-gray-700/50">
        <h2 className="text-lg font-bold text-white mb-4">Recent Tournaments</h2>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 items-center animate-pulse">
              <div className="w-16 h-16 bg-gray-700 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-gray-700 rounded"></div>
                <div className="h-2 w-1/2 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-800/50 backdrop-blur rounded-2xl shadow-lg p-8 flex-1 border border-gray-700/50">
        <div className="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-red-500 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-500 font-medium text-lg">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-6 py-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    }) + ' UTC';
  };

  return (
    <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg p-6 flex-1 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournaments.map((tournament) => (
          <Link 
            key={tournament.id}
            href={`/tournaments/${tournament.id}`}
            className="group block p-4 rounded-xl bg-neutral-900/50 hover:bg-neutral-900 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300"
          >
            <div className="relative w-full aspect-video mb-4">
              <img
                src={tournament.image || 'https://i.imgur.com/4BAhl5o.png'}
                alt={tournament.name}
                className="rounded-lg object-cover w-full h-full ring-1 ring-gray-700 group-hover:ring-purple-500/50 transition-all duration-300"
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg text-white font-semibold group-hover:text-purple-400 transition-colors line-clamp-2">
                {tournament.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(tournament.date)}
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide uppercase border ${
                tournament.status === 'registration_open' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                tournament.status === 'registration_closed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                tournament.status === 'completed' || tournament.status === 'finished' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                tournament.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                'bg-gray-500/10 text-gray-400 border-gray-500/20'
              }`}>
                {tournament.status.replace(/_/g, ' ')}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {tournaments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No tournaments available</p>
        </div>
      )}      <div className="flex justify-center mt-6">
        <Link 
          href="/tournaments"
          className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-purple-500/10 text-purple-400 
            hover:bg-purple-500/20 transition-all duration-300 group text-sm font-medium"
        >
          Browse All Tournaments
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default RecentTournaments;
