'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import TopBar from '../../../components/TopBar';
import HybridBracket from '@/components/HybridBracket';
import { useToast } from '@/app/components/ToastContext';
import { BracketData, Match, Tournament } from '@/app/tournament/[id]/bracket/types';

// Bracket Tabs Component
interface BracketTabsProps {
  matches: Match[];
}

function BracketTabs({ matches, onTabChange }: BracketTabsProps & { onTabChange: (tab: 'all' | 'winners' | 'losers' | 'finals') => void }) {
  const [activeTab, setActiveTab] = useState<'all' | 'winners' | 'losers' | 'finals'>('all');
  
  // Count matches of each type for the badge
  const matchCounts = matches.reduce(
    (acc, match) => {
      const bracket = match.bracket || 'winners';
      acc[bracket] = (acc[bracket] || 0) + 1;
      return acc;
    }, 
    {} as Record<string, number>
  );
  
  const handleTabChange = (tab: 'all' | 'winners' | 'losers' | 'finals') => {
    setActiveTab(tab);
    onTabChange(tab); // Notify parent about tab change
    
    // Apply filter to scroll to appropriate section
    setTimeout(() => {
      const element = document.getElementById(`${tab}-bracket`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (tab === 'all') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="flex overflow-x-auto px-6 py-2 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
      <button 
        onClick={() => handleTabChange('all')}
        className={`px-4 py-2 mr-2 font-medium text-sm rounded-t-lg transition-all ${
          activeTab === 'all' 
            ? 'text-white border-b-2 border-purple-500'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        All Brackets
      </button>
      
      <button 
        onClick={() => handleTabChange('winners')}
        className={`px-4 py-2 mr-2 font-medium text-sm rounded-t-lg transition-all flex items-center ${
          activeTab === 'winners' 
            ? 'text-green-400 border-b-2 border-green-500'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        Winners
        {matchCounts['winners'] > 0 && (
          <span className="ml-2 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
            {matchCounts['winners']}
          </span>
        )}
      </button>
      
      <button 
        onClick={() => handleTabChange('losers')}
        className={`px-4 py-2 mr-2 font-medium text-sm rounded-t-lg transition-all flex items-center ${
          activeTab === 'losers' 
            ? 'text-red-400 border-b-2 border-red-500'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        Losers
        {matchCounts['losers'] > 0 && (
          <span className="ml-2 bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
            {matchCounts['losers']}
          </span>
        )}
      </button>
      
      {matchCounts['finals'] > 0 && (
        <button 
          onClick={() => handleTabChange('finals')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all flex items-center ${
            activeTab === 'finals' 
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Finals
          <span className="ml-2 bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full">
            {matchCounts['finals']}
          </span>
        </button>
      )}
    </div>
  );
}

interface User {
  role?: 'user' | 'staff' | 'admin';
}

export default function TournamentBracketPage() {
  const { id } = useParams();
  const [data, setData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);  const { showToast } = useToast();
  const [activeBracketType, setActiveBracketType] = useState<'all' | 'winners' | 'losers' | 'finals'>('all');

  const handleBracketTabChange = (tab: 'all' | 'winners' | 'losers' | 'finals') => {
    setActiveBracketType(tab);
  };

  useEffect(() => {
    // Fetch user data for permissions
    const fetchUser = async () => {
      try {
        // Use the same auth method as TopBar - through Next.js API route
        const authToken = localStorage.getItem('authToken');
        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers
        });
        
        if (res.ok) {
          const userData = await res.json();
          if (userData.isLoggedIn && userData.user) {
            setUser({
              role: userData.user.role
            });
            console.log('Bracket page - User role:', userData.user.role);
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    // Fetch bracket data
    const fetchBracket = async () => {
      try {
        const res = await fetch(`https://backend-6wqj.onrender.com/tournaments/${id}/bracket`, {
          credentials: 'include'
        });
        
        if (!res.ok) throw new Error('Failed to fetch bracket');
        
        const bracketData = await res.json();
        
        // Validate the bracket data structure
        if (!bracketData || !bracketData.tournament) {
          throw new Error('Invalid bracket data format');
        }
        
        // Ensure matches is always an array
        bracketData.matches = bracketData.matches || [];
        
        setData(bracketData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchUser();
    fetchBracket();
  }, [id]);

  const handleVodUpdate = async (matchId: number, vodUrl: string | null): Promise<void> => {
    try {
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`https://backend-6wqj.onrender.com/tournaments/${id}/matches/${matchId}/vod`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ vod_url: vodUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update VOD');
      }

      // Refresh bracket
      const bracketRes = await fetch(`https://backend-6wqj.onrender.com/tournaments/${id}/bracket`, { credentials: 'include' });
      if (bracketRes.ok) {
        const newData = await bracketRes.json();
        newData.matches = newData.matches || [];
        setData(newData);
      }

      showToast({ title: 'Success', message: vodUrl ? 'VOD link saved' : 'VOD link removed', type: 'success' });
    } catch (err) {
      console.error('Error updating VOD:', err);
      showToast({ title: 'Error', message: err instanceof Error ? err.message : 'Failed to update VOD', type: 'error' });
      throw err;
    }
  };

  const handleScoreSubmit = async (matchId: number, player1Score: number, player2Score: number): Promise<void> => {
    if (!data?.matches) {
      showToast({
        title: 'Error',
        message: 'No match data available',
        type: 'error'
      });
      return;
    }

    // Validate scores
    if (player1Score < 0 || player2Score < 0) {
      showToast({
        title: 'Error',
        message: 'Scores cannot be negative',
        type: 'error'
      });
      return;
    }

    try {
      const match = data.matches.find(m => m.id === matchId);
      if (!match) throw new Error('Match not found');

      const winnerId = player1Score > player2Score ? match.player1_id :
                      player2Score > player1Score ? match.player2_id :
                      null;

      console.log('Submitting score update:', {
        matchId,
        player1Score,
        player2Score,
        winnerId,
        player1_name: match.player1_name,
        player2_name: match.player2_name
      });

      // Get auth token for authentication
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`https://backend-6wqj.onrender.com/tournaments/${id}/matches/${matchId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          player1_score: player1Score,
          player2_score: player2Score,
          winner_id: winnerId
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update match');
      }

      const responseData = await res.json();
      console.log('Score update response:', responseData);

      // Refresh bracket data to show the updated results
      const bracketRes = await fetch(`https://backend-6wqj.onrender.com/tournaments/${id}/bracket`, {
        credentials: 'include'
      });
      if (!bracketRes.ok) throw new Error('Failed to refresh bracket');
      
      const newData = await bracketRes.json();
      // Validate the new data
      if (!newData || !newData.tournament) {
        throw new Error('Invalid bracket data format');
      }
      
      // Ensure matches is always an array
      newData.matches = newData.matches || [];
      
      setData(newData);
      
      // Show success message with advancement info
      const successMessage = responseData.winner_advanced 
        ? `Match result updated successfully! Winner advanced to next round.`
        : 'Match result updated successfully';
        
      showToast({
        title: 'Success',
        message: successMessage,
        type: 'success'
      });
    } catch (err) {
      console.error('Error updating match:', err);
      showToast({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to update match',
        type: 'error'
      });
    }
  };
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
        <TopBar />
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700/50 p-8">
            <div className="flex flex-col justify-center items-center h-64 space-y-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent shadow-lg shadow-purple-500/20"></div>
              <p className="text-gray-400">Loading tournament bracket...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }
  // Check if this is a "no brackets yet" situation vs an actual error
  const isBracketNotGeneratedYet = !error && data && data.tournament && (!data.matches || data.matches.length === 0);
  
  if (error || !data || !data.tournament) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
        <TopBar />
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className={`bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg p-8 border ${isBracketNotGeneratedYet ? 'border-yellow-500/20' : 'border-red-500/20'}`}>
            <div className="text-center">
              {isBracketNotGeneratedYet ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-xl font-bold text-white mb-4">Brackets Not Generated Yet</h3>
                  <p className="text-yellow-400 font-medium mb-6">
                    This tournament doesn't have brackets generated yet. Brackets will be available when the tournament starts.
                  </p>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-xl font-bold text-white mb-4">Bracket Not Available</h3>
                  <p className="text-red-400 font-medium mb-6">{error || 'Unable to load tournament bracket data'}</p>
                </>
              )}
              
              <div className="flex justify-center gap-4">
                <a
                  href={`/tournaments/${id}`}
                  className="px-5 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-300"
                >
                  Back to Tournament
                </a>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-5 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all duration-300"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          {/* Bracket Navigation */}
          <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700/50">
            {/* Bracket Tabs - Show only for double elimination */}
            {data.tournament && data.tournament.format === 'DOUBLE_ELIMINATION' && (
              <div className="flex border-b border-gray-700/50">
                <BracketTabs matches={data.matches} onTabChange={handleBracketTabChange} />
              </div>
            )}
            
            <div className="overflow-x-auto p-6">
              <div className="min-w-max">
                {/* Use the hybrid bracket component that can handle both scenarios */}
                {data.tournament && (
                  <HybridBracket
                    tournamentId={id as string}
                    tournament={data.tournament}
                    matches={data.matches || []}
                    isStaff={user?.role === 'staff' || user?.role === 'admin'}
                    onMatchUpdate={handleScoreSubmit}
                    onVodUpdate={handleVodUpdate}
                    bracketType={activeBracketType}
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Back to Tournament Link */}
          <div className="flex justify-start">
            <a 
              href={`/tournaments/${id}`}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Tournament Details
            </a>
          </div>
        </div>
      </div>
      
      {/* Scrollbar styling for bracket container */}
      <style jsx global>{`
        .bracket-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.3) rgba(30, 30, 30, 0.5);
        }
        .bracket-container::-webkit-scrollbar {
          height: 8px;
        }
        .bracket-container::-webkit-scrollbar-track {
          background: rgba(30, 30, 30, 0.5);
          border-radius: 4px;
        }
        .bracket-container::-webkit-scrollbar-thumb {
          background-color: rgba(139, 92, 246, 0.3);
          border-radius: 4px;
        }
        .bracket-container::-webkit-scrollbar-thumb:hover {
          background-color: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </main>
  );
}
