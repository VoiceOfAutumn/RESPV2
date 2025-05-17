'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import TopBar from '../../components/TopBar';

interface Tournament {
  id: number;
  name: string;
  description: string;
  date: string;
  status: string;
  image: string | null;
  rules: string;
  game: string;
  externalLinks: {
    discord?: string;
    twitch?: string;
    bracket?: string;
  };
  staff: Array<{
    role: string;
    userId: number;
    displayName: string;
    profilePicture?: string;
  }>;
}

export default function TournamentDetailPage() {
  const { id } = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-gray-800 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-800 rounded w-1/3"></div>
              <div className="h-4 bg-gray-800 rounded w-1/4"></div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-16 pl-64">      <TopBar />
      <Navbar />
        {/* Hero Section with Tournament Image, Details, and Status */}
      <section className="relative h-64 mt-8 mx-4 rounded-3xl overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={tournament.image || 'https://i.imgur.com/4BAhl5o.png'}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/30" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">          <div className="flex flex-col h-full">
            {/* Tournament Info */}
            <div className="flex flex-col justify-end flex-grow pb-8">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{tournament.name}</h1>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(tournament.date).toLocaleString()}
                    </div>
                    <div className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      {tournament.game}
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">
                  {tournament.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - General Information */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <section className="bg-gray-800/50 backdrop-blur rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">About</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{tournament.description}</p>
          </section>

          {/* Rules Section */}
          <section className="bg-gray-800/50 backdrop-blur rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Rules</h2>
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 whitespace-pre-wrap">{tournament.rules}</div>
            </div>
          </section>

          {/* External Links */}
          {tournament.externalLinks && Object.keys(tournament.externalLinks).length > 0 && (
            <section className="bg-gray-800/50 backdrop-blur rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Links</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tournament.externalLinks.discord && (
                  <a
                    href={tournament.externalLinks.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-6 h-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                    </svg>
                    <span className="text-white">Discord</span>
                  </a>
                )}
                {tournament.externalLinks.twitch && (
                  <a
                    href={tournament.externalLinks.twitch}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-6 h-6 text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                    </svg>
                    <span className="text-white">Twitch</span>
                  </a>
                )}
                {tournament.externalLinks.bracket && (
                  <a
                    href={tournament.externalLinks.bracket}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-white">Bracket</span>
                  </a>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Column - Staff Section */}
        <div>
          <section className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-white mb-4">Staff</h2>
            <div className="space-y-6">
              {tournament.staff?.map((member) => (
                <div key={member.userId} className="flex items-center gap-4">
                  <img
                    src={member.profilePicture || 'https://i.imgur.com/4BAhl5o.png'}
                    alt={member.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium text-white">{member.displayName}</div>
                    <div className="text-sm text-gray-400">{member.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
