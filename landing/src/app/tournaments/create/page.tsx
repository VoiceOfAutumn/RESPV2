'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/TopBar';
import Navbar from '../../components/Navbar';
import { useToast } from '@/app/components/ToastContext';
import { API_BASE_URL } from '@/lib/api';

interface GameInfo {
  gameName: string;
  platform: string;
  challengeDescription: string;
}

const ROUND_KEYS = [
  'round_of_128',
  'round_of_64',
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'final',
] as const;

const ROUND_LABELS: Record<string, string> = {
  round_of_128: 'Round of 128',
  round_of_64: 'Round of 64',
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarter_final: 'Quarter-Final',
  semi_final: 'Semi-Final',
  final: 'Final',
};

const emptyGameInfo = (): GameInfo => ({ gameName: '', platform: '', challengeDescription: '' });

interface FormData {
  name: string;
  description: string;
  date: string;
  image: string;
}

export default function CreateTournamentPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    date: '',
    image: ''
  });
  const [differsPerRound, setDiffersPerRound] = useState(false);
  const [singleGame, setSingleGame] = useState<GameInfo>(emptyGameInfo());
  const [roundGames, setRoundGames] = useState<Record<string, GameInfo>>(
    Object.fromEntries(ROUND_KEYS.map(k => [k, emptyGameInfo()]))
  );

  const updateRoundGame = (roundKey: string, field: keyof GameInfo, value: string) => {
    setRoundGames(prev => ({
      ...prev,
      [roundKey]: { ...prev[roundKey], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build game_data payload
    const game_data = differsPerRound
      ? { differsPerRound: true, rounds: roundGames }
      : { differsPerRound: false, game: singleGame };

    const submissionData = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      game_data,
    };

    try {
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/tournaments`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(submissionData),
      });

      if (res.ok) {
        const data = await res.json();
        showToast({
          title: 'Success',
          message: 'Tournament created successfully',
          type: 'success'
        });
        router.push(`/tournaments/${data.id}`);
      } else {
        const error = await res.json();
        showToast({
          title: 'Error',
          message: error.message || 'Failed to create tournament',
          type: 'error'
        });
      }
    } catch (err) {
      showToast({
        title: 'Error',
        message: 'Error creating tournament',
        type: 'error'
      });
    }
  };

  const inputClass = "mt-1 block w-full bg-gray-900/50 text-white rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 px-4 py-2";

  const renderGameFields = (game: GameInfo, onChange: (field: keyof GameInfo, value: string) => void, required: boolean, idPrefix: string) => (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-gameName`} className="block text-sm font-medium text-gray-300">
          Game Name
        </label>
        <input
          type="text"
          id={`${idPrefix}-gameName`}
          required={required}
          value={game.gameName}
          onChange={(e) => onChange('gameName', e.target.value)}
          className={inputClass}
          placeholder="e.g. Super Mario 64, Windjammers, Street Fighter..."
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-platform`} className="block text-sm font-medium text-gray-300">
          Platform
        </label>
        <input
          type="text"
          id={`${idPrefix}-platform`}
          required={required}
          value={game.platform}
          onChange={(e) => onChange('platform', e.target.value)}
          className={inputClass}
          placeholder="e.g. Fightcade, GBA, Playstation..."
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-challengeDescription`} className="block text-sm font-medium text-gray-300">
          Challenge Description
        </label>
        <textarea
          id={`${idPrefix}-challengeDescription`}
          required={required}
          value={game.challengeDescription}
          onChange={(e) => onChange('challengeDescription', e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="Describe the game challenge or mode..."
        />
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <Navbar />
      <TopBar />
      
      <div className="p-8">
        <div className="max-w-4xl mx-auto bg-neutral-800/50 backdrop-blur rounded-xl shadow-lg p-8 border border-gray-700/50">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 mb-6">Create Tournament</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Tournament Name
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={inputClass}
              />
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-300">
                Tournament Date <span className="text-gray-500 text-xs">(UTC)</span>
              </label>
              <input
                type="datetime-local"
                id="date"
                required
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={inputClass}
              />
              <p className="mt-1 text-sm text-gray-400">All times are in UTC timezone</p>
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-300">
                Tournament Image URL
              </label>
              <input
                type="url"
                id="image"
                required
                value={formData.image}
                pattern=".*\.(jpg|jpeg|png)$"
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                className={inputClass}
              />
              <p className="mt-1 text-sm text-gray-400">
                Must be a direct link to an image ending in .jpg, .jpeg, or .png
              </p>
            </div>

            {/* Game Information Section */}
            <div className="border border-gray-700/50 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-200">Game Information</h2>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={differsPerRound}
                    onChange={(e) => setDiffersPerRound(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900/50 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm text-gray-300">Game differs per round</span>
                </label>
              </div>

              {!differsPerRound ? (
                /* Single game for all rounds */
                renderGameFields(
                  singleGame,
                  (field, value) => setSingleGame(prev => ({ ...prev, [field]: value })),
                  true,
                  'game'
                )
              ) : (
                /* Per-round game fields */
                <div className="space-y-6">
                  {ROUND_KEYS.map((roundKey) => {
                    const isFinal = roundKey === 'final';
                    return (
                      <div key={roundKey} className="border border-gray-700/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-300">{ROUND_LABELS[roundKey]}</h3>
                          {isFinal && (
                            <span className="text-xs text-red-400 font-medium">Required</span>
                          )}
                          {!isFinal && (
                            <span className="text-xs text-gray-500">Optional</span>
                          )}
                        </div>
                        {renderGameFields(
                          roundGames[roundKey],
                          (field, value) => updateRoundGame(roundKey, field, value),
                          isFinal,
                          roundKey
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-700/50 rounded-lg shadow-sm text-sm font-medium text-gray-300 bg-gray-900/50 hover:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-purple-500/30 rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600/80 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
              >
                Create Tournament
              </button>
            </div>
          </form>        </div>
      </div>
    </main>
  );
}