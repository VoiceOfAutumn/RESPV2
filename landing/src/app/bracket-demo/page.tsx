'use client';

import React, { useState } from 'react';
import HybridBracket from '@/components/HybridBracket';
import SingleEliminationBracket from '@/components/SingleEliminationBracket';
import Navbar from '@/app/components/Navbar';
import TopBar from '@/app/components/TopBar';
import { Match, Tournament } from '@/app/tournament/[id]/bracket/types';

// Demo participant interface
interface DemoParticipant {
  id: number;
  display_name: string;
  profile_picture?: string;
}

// Mock user interface
interface MockUser {
  role: 'user' | 'staff' | 'admin';
}

// Bracket Tabs Component (same as real tournament page)
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
    onTabChange(tab);
    
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

export default function BracketDemo() {
  const [numParticipants, setNumParticipants] = useState(7);
  const [tournamentStatus, setTournamentStatus] = useState<Tournament['status']>('registration_closed');
  const [tournamentFormat, setTournamentFormat] = useState<Tournament['format']>('SINGLE_ELIMINATION');
  const [userRole, setUserRole] = useState<MockUser['role']>('staff');
  const [hasOfficialBrackets, setHasOfficialBrackets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBracketType, setActiveBracketType] = useState<'all' | 'winners' | 'losers' | 'finals'>('all');
  
  // New state for demo match results
  const [matchResults, setMatchResults] = useState<Map<number, { player1Score: number; player2Score: number; winnerId: number | null }>>(new Map());

  // Reset match results when participants change
  const handleParticipantChange = (newCount: number) => {
    setNumParticipants(newCount);
    setMatchResults(new Map()); // Clear all match results
  };

  // Generate sample participants in the format expected by the API
  const generateParticipants = (count: number): DemoParticipant[] => {
    const names = [
      'Alice Johnson', 'Bob Smith', 'Charlie Davis', 'Diana Miller', 'Eve Wilson',
      'Frank Brown', 'Grace Lee', 'Henry Chen', 'Ivy Martinez', 'Jack Taylor',
      'Kate Anderson', 'Liam Garcia', 'Mia Rodriguez', 'Noah Thompson', 'Olivia White',
      'Paul Harris', 'Quinn Clark', 'Ruby Lewis', 'Sam Walker', 'Tina Young'
    ];
    
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      display_name: names[i % names.length] || `Player ${i + 1}`,
      profile_picture: '/images/default-avatar.png'
    }));
  };

  const participants = generateParticipants(numParticipants);

  // Mock tournament object
  const mockTournament: Tournament = {
    id: 999999, // Demo tournament ID
    name: "Demo Tournament",
    format: tournamentFormat,
    status: tournamentStatus
  };

  // Mock user object
  const mockUser: MockUser = {
    role: userRole
  };

  // Generate mock matches if official brackets are enabled
  const generateMockMatches = (): Match[] => {
    if (!hasOfficialBrackets) return [];

    // Use the corrected bracket generation logic
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
    const numberOfByes = bracketSize - numParticipants;
    const round1MatchCount = (bracketSize / 2) - numberOfByes;
    const totalRounds = Math.ceil(Math.log2(bracketSize));
    
    console.log(`Demo Mock Matches: ${numParticipants} participants, ${numberOfByes} BYEs, ${round1MatchCount} Round 1 matches`);

    // Shuffle participants for seeding
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
    const byeSeeds = shuffledParticipants.slice(0, numberOfByes);
    const round1Participants = shuffledParticipants.slice(numberOfByes);

    const matches: Match[] = [];
    let matchId = 1;

    // Round 1 matches - only create actual matches between participants
    for (let i = 0; i < round1MatchCount; i++) {
      const player1 = round1Participants[i * 2];
      const player2 = round1Participants[i * 2 + 1] || null;
      
      // Get results for this match if they exist
      const result = matchResults.get(matchId);
      
      matches.push({
        id: matchId++,
        round: 1,
        match_number: i + 1,
        player1_id: player1?.id || null,
        player2_id: player2?.id || null,
        player1_name: player1?.display_name || null,
        player2_name: player2?.display_name || null,
        player1_picture: player1?.profile_picture || null,
        player2_picture: player2?.profile_picture || null,
        player1_score: result?.player1Score || null,
        player2_score: result?.player2Score || null,
        winner_id: result?.winnerId || null,
        winner_name: result?.winnerId === player1?.id ? player1?.display_name || null : 
                    result?.winnerId === player2?.id ? player2?.display_name || null : null,
        next_match_id: null,
        bye_match: !player2,
        bracket: 'winners'
      });
    }

    // Generate Round 2 matches with improved BYE distribution
    if (totalRounds > 1) {
      const round2Size = Math.pow(2, totalRounds - 1);
      const round2Participants: any[] = new Array(round2Size).fill(null);
      
      // Distribute BYE seeds evenly across Round 2 positions
      if (numberOfByes > 0) {
        const spacing = round2Size / numberOfByes;
        for (let i = 0; i < numberOfByes; i++) {
          const position = Math.floor(i * spacing);
          if (position < round2Size) {
            round2Participants[position] = {
              id: byeSeeds[i].id,
              name: byeSeeds[i].display_name,
              picture: byeSeeds[i].profile_picture
            };
          }
        }
      }
      
      // Fill remaining positions with Round 1 winners/placeholders
      let round1Index = 0;
      for (let pos = 0; pos < round2Size; pos++) {
        if (!round2Participants[pos] && round1Index < round1MatchCount) {
          const round1Match = matches.find(m => m.round === 1 && m.match_number === round1Index + 1);
          if (round1Match?.winner_id) {
            round2Participants[pos] = {
              id: round1Match.winner_id,
              name: round1Match.winner_name,
              picture: round1Match.winner_id === round1Match.player1_id ? round1Match.player1_picture : round1Match.player2_picture
            };
          } else {
            round2Participants[pos] = null; // TBD
          }
          round1Index++;
        }
      }
      
      // Create Round 2 matches
      const round2MatchCount = Math.floor(round2Size / 2);
      for (let i = 0; i < round2MatchCount; i++) {
        const player1 = round2Participants[i * 2];
        const player2 = round2Participants[i * 2 + 1];
        const result = matchResults.get(matchId);
        
        matches.push({
          id: matchId++,
          round: 2,
          match_number: i + 1,
          player1_id: player1?.id || null,
          player2_id: player2?.id || null,
          player1_name: player1?.name || null,
          player2_name: player2?.name || null,
          player1_picture: player1?.picture || null,
          player2_picture: player2?.picture || null,
          player1_score: result?.player1Score || null,
          player2_score: result?.player2Score || null,
          winner_id: result?.winnerId || null,
          winner_name: result?.winnerId === player1?.id ? player1?.name || null : 
                      result?.winnerId === player2?.id ? player2?.name || null : null,
          next_match_id: null,
          bye_match: false,
          bracket: 'winners'
        });
      }
    }

    return matches;
  };

  const mockMatches = generateMockMatches();

  // Handle bracket tab change
  const handleBracketTabChange = (tab: 'all' | 'winners' | 'losers' | 'finals') => {
    setActiveBracketType(tab);
  };

  // Enhanced mock score submit function that actually updates demo state
  const handleScoreSubmit = async (matchId: number, player1Score: number, player2Score: number): Promise<void> => {
    console.log('Demo: Attempting to update match', matchId, 'with scores', player1Score, '-', player2Score);
    
    if (player1Score < 0 || player2Score < 0) {
      throw new Error('Scores cannot be negative');
    }

    if (player1Score === player2Score) {
      throw new Error('Matches cannot end in a tie');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Update match results state with proper winner determination
    setMatchResults(prev => {
      const newResults = new Map(prev);
      newResults.set(matchId, {
        player1Score,
        player2Score,
        winnerId: player1Score > player2Score ? 1 : 2 // 1 = player1 wins, 2 = player2 wins
      });
      return newResults;
    });

    console.log(`Demo: Match ${matchId} completed successfully:`, {
      player1Score,
      player2Score,
      winnerId: player1Score > player2Score ? 'Player 1' : 'Player 2'
    });
  };

  // Simulate loading state
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
  const isBracketNotGeneratedYet = !error && mockTournament && (!mockMatches || mockMatches.length === 0);
  
  // Simulate error state
  if (error || (!mockTournament && !loading)) {
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
                <button
                  onClick={() => setError(null)}
                  className="px-5 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-300"
                >
                  Back to Demo
                </button>
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
        {/* Demo Controls Panel */}
        <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700/50 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-400">Tournament Bracket Demo - Exact Replica</h2>
          <p className="text-sm text-gray-400 mb-6">
            This demo exactly replicates the /tournaments/[id]/bracket page functionality, including all states, user roles, and bracket logic.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Participants */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Participants ({numParticipants}):
              </label>
              <input
                type="number"
                min="2"
                max="20"
                value={numParticipants}
                onChange={(e) => handleParticipantChange(parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm mb-2"
              />
              <div className="flex flex-wrap gap-1">
                {[2, 3, 5, 7, 8, 12, 16].map(num => (
                  <button
                    key={num}
                    onClick={() => handleParticipantChange(num)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      numParticipants === num
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Tournament Status */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Tournament Status:
              </label>
              <select
                value={tournamentStatus}
                onChange={(e) => setTournamentStatus(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="registration_open">Registration Open</option>
                <option value="registration_closed">Registration Closed</option>
                <option value="check_in">Check In</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* User Role */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                User Role:
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as MockUser['role'])}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="user">Regular User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Tournament Format & Options */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Options:
              </label>
              <select
                value={tournamentFormat}
                onChange={(e) => setTournamentFormat(e.target.value as Tournament['format'])}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm mb-2"
              >
                <option value="SINGLE_ELIMINATION">Single Elimination</option>
                <option value="DOUBLE_ELIMINATION">Double Elimination</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hasOfficialBrackets}
                  onChange={(e) => setHasOfficialBrackets(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600"
                />
                <span className="text-gray-300">Official brackets generated</span>
              </label>
            </div>
          </div>

          {/* Demo Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setLoading(true)}
              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30"
            >
              Simulate Loading
            </button>
            <button
              onClick={() => setError('Demo error: Failed to fetch bracket data')}
              className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30"
            >
              Simulate Error
            </button>
            <button
              onClick={() => {
                setLoading(false);
                setError(null);
              }}
              className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30"
            >
              Reset State
            </button>
            <button
              onClick={() => setMatchResults(new Map())}
              className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded text-sm hover:bg-purple-500/30"
            >
              Reset All Scores
            </button>
          </div>
          
          {/* Demo Statistics */}
          {(hasOfficialBrackets || userRole === 'staff' || userRole === 'admin') && matchResults.size > 0 && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h4 className="text-green-400 font-medium mb-2">📊 Tournament Progress</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Matches Completed</div>
                  <div className="text-white font-medium">{matchResults.size}</div>
                </div>
                <div>
                  <div className="text-gray-400">Total Matches</div>
                  <div className="text-white font-medium">{mockMatches.length}</div>
                </div>
                <div>
                  <div className="text-gray-400">Rounds Played</div>
                  <div className="text-white font-medium">
                    {Math.max(...Array.from(matchResults.keys()).map(id => 
                      mockMatches.find(m => m.id === id)?.round || 1
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Completion</div>
                  <div className="text-white font-medium">
                    {Math.round((matchResults.size / Math.max(mockMatches.length, 1)) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bracket Structure Debug Info */}
          {(userRole === 'staff' || userRole === 'admin') && (
            <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="text-purple-400 font-medium mb-2">🔧 Bracket Structure Debug</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Participants</div>
                  <div className="text-white font-medium">{numParticipants}</div>
                </div>
                <div>
                  <div className="text-gray-400">Bracket Size</div>
                  <div className="text-white font-medium">{Math.pow(2, Math.ceil(Math.log2(numParticipants)))}</div>
                </div>
                <div>
                  <div className="text-gray-400">BYEs Needed</div>
                  <div className="text-white font-medium">{Math.pow(2, Math.ceil(Math.log2(numParticipants))) - numParticipants}</div>
                </div>
                <div>
                  <div className="text-gray-400">Round 1 Matches</div>
                  <div className="text-white font-medium">
                    {(Math.pow(2, Math.ceil(Math.log2(numParticipants))) / 2) - (Math.pow(2, Math.ceil(Math.log2(numParticipants))) - numParticipants)}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Formula: Round1Matches = (BracketSize/2) - NumberOfBYEs = ({Math.pow(2, Math.ceil(Math.log2(numParticipants)))}/2) - {Math.pow(2, Math.ceil(Math.log2(numParticipants))) - numParticipants} = {(Math.pow(2, Math.ceil(Math.log2(numParticipants))) / 2) - (Math.pow(2, Math.ceil(Math.log2(numParticipants))) - numParticipants)}
              </div>
            </div>
          )}
          
          {/* Demo Instructions */}
          {(hasOfficialBrackets || userRole === 'staff' || userRole === 'admin') && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2">🎮 Interactive Demo Mode</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Click on matches to enter scores and see bracket progression</li>
                <li>• Winners automatically advance to the next round</li>
                <li>• Use "Reset All Scores" to start over</li>
                <li>• Try different participant counts to see various bracket structures</li>
                {!hasOfficialBrackets && (
                  <li>• <span className="text-yellow-400">Preview Mode:</span> Score editing available for demonstration</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-6">
          {/* Bracket Navigation - Exact replica */}
          <div className="bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700/50">
            {/* Bracket Tabs - Show only for double elimination */}
            {mockTournament && mockTournament.format === 'DOUBLE_ELIMINATION' && (
              <div className="flex border-b border-gray-700/50">
                <BracketTabs matches={mockMatches} onTabChange={handleBracketTabChange} />
              </div>
            )}
            
            <div className="overflow-x-auto p-6">
              <div className="min-w-max">
                {/* Use the exact same HybridBracket component */}
                {mockTournament && (
                  <DemoHybridBracket
                    tournamentId="demo-tournament"
                    tournament={mockTournament}
                    matches={mockMatches || []}
                    participants={participants}
                    isStaff={mockUser?.role === 'staff' || mockUser?.role === 'admin'}
                    onMatchUpdate={handleScoreSubmit}
                    bracketType={activeBracketType}
                    matchResults={matchResults}
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Back link - same as real page */}
          <div className="flex justify-start">
            <a 
              href="/tournaments"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Tournaments
            </a>
          </div>
        </div>
      </div>
      
      {/* Exact same scrollbar styling */}
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

// Demo version of HybridBracket that doesn't make API calls
interface DemoHybridBracketProps {
  tournamentId: string;
  tournament: Tournament;
  matches: Match[];
  participants: DemoParticipant[];
  isStaff?: boolean;
  onMatchUpdate?: (matchId: number, player1Score: number, player2Score: number) => Promise<void>;
  bracketType?: 'all' | 'winners' | 'losers' | 'finals';
  matchResults?: Map<number, { player1Score: number; player2Score: number; winnerId: number | null }>;
}

function DemoHybridBracket({ 
  tournament, 
  matches, 
  participants,
  isStaff = false, 
  onMatchUpdate,
  matchResults,
}: DemoHybridBracketProps) {
  // Convert demo participants to the format expected by SingleEliminationBracket
  const formattedParticipants = participants.map(p => ({
    id: p.id,
    name: p.display_name,
    profilePicture: p.profile_picture
  }));

  // Check if brackets have been officially generated
  const hasOfficialBrackets = matches.length > 0;
  const tournamentInProgress = tournament.status === 'in_progress' || tournament.status === 'completed';
  
  // Only show brackets if:
  // 1. Brackets have been officially generated (matches exist), OR
  // 2. Tournament is in progress/completed, OR  
  // 3. User is staff and wants to see a preview
  const shouldShowBracket = hasOfficialBrackets || tournamentInProgress || isStaff;

  if (formattedParticipants.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">No participants registered</div>
        <div className="text-sm text-gray-500">
          Players need to register before brackets can be generated
        </div>
      </div>
    );
  }

  if (!shouldShowBracket) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">Brackets Not Generated</div>
        <div className="text-sm text-gray-500 mb-4">
          Tournament brackets will be available once a staff member generates them.
        </div>
        <div className="text-xs text-blue-400 bg-blue-500/20 px-3 py-2 rounded-lg inline-block">
          Tournament Status: {tournament.status.replace('_', ' ').toUpperCase()} • {formattedParticipants.length} participants registered
        </div>
      </div>
    );
  }

  // Always render with the SingleEliminationBracket component
  return (
    <div>
      {/* Show bracket status indicator */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-blue-400 font-medium mb-1">
              {hasOfficialBrackets ? 'Official Tournament Bracket' : 'Bracket Preview'}
            </h3>
            <p className="text-sm text-gray-300">
              {hasOfficialBrackets 
                ? `Tournament in progress with ${matches.length} matches` 
                : isStaff 
                  ? 'Staff preview - Use "Generate Bracket" to make this official'
                  : 'Preview of tournament structure'
              }
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
              {formattedParticipants.length} participants
            </div>
            <div className={`text-xs px-2 py-1 rounded ${
              hasOfficialBrackets 
                ? 'text-green-400 bg-green-500/20' 
                : 'text-yellow-400 bg-yellow-500/20'
            }`}>
              {hasOfficialBrackets ? 'OFFICIAL' : 'PREVIEW'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Always use the SingleEliminationBracket component */}
      <SingleEliminationBracket 
        participants={formattedParticipants}
        matches={matches}
        isStaff={isStaff} // Allow score updates for staff in demo mode
        onMatchUpdate={onMatchUpdate} // Always allow updates in demo mode
        matchResults={matchResults} // Pass demo match results for bracket progression
        className="w-full"
      />
      
      {/* Additional info for staff */}
      {isStaff && (
        <div className={`mt-6 p-4 border rounded-lg ${
          hasOfficialBrackets 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-yellow-500/10 border-yellow-500/20'
        }`}>
          <h4 className={`font-medium mb-2 ${
            hasOfficialBrackets ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {hasOfficialBrackets ? '✅ Official Tournament Brackets' : '⚠️ Preview Mode'}
          </h4>
          <ul className="text-sm text-gray-300 space-y-1">
            {hasOfficialBrackets ? (
              <>
                <li>• Official brackets have been generated</li>
                <li>• Match results are being tracked</li>
                <li>• Tournament status: {tournament.status.replace('_', ' ').toUpperCase()}</li>
                <li>• Click on matches to update scores</li>
              </>
            ) : (
              <>
                <li>• This is a preview of the bracket structure</li>
                <li>• Participants are randomly shuffled for fair seeding</li>
                <li>• BYEs are properly handled in Round 1 only</li>
                <li>• Use "Generate Bracket" to create official matches for score tracking</li>
                <li>• Tournament status: {tournament.status.replace('_', ' ').toUpperCase()}</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
