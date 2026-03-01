'use client';

import { useState } from 'react';
import { useToast } from '@/app/components/ToastContext';
import { API_BASE_URL } from '@/lib/api';
import { Tournament, TournamentUpdate, GameInfo, GameData } from '@/types/tournament';

interface Props {
  tournament: Tournament;
  setTournament: (tournament: TournamentUpdate) => void;
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

const emptyGameInfo = (): GameInfo => ({ gameName: '', platform: '', platformUrl: '', challengeDescription: '' });

export default function TournamentStaffControls({ tournament, setTournament }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { showToast } = useToast();

  const updateStatus = async (newStatus: Tournament['status']) => {
    setIsUpdating(true);

    try {
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/tournaments/${tournament.id}/status`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setTournament({ id: tournament.id, status: newStatus });
        showToast({
          title: 'Success',
          message: 'Tournament status updated successfully',
          type: 'success'
        });
      } else {
        const error = await res.json();
        showToast({
          title: 'Error',
          message: error.message || 'Failed to update tournament status',
          type: 'error'
        });
      }
    } catch (err) {
      showToast({
        title: 'Error',
        message: 'Error updating tournament status',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const generateBracket = async () => {
    setIsUpdating(true);

    try {
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/tournaments/${tournament.id}/bracket/generate`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const newStatus = 'brackets_generated';
        setTournament({ ...tournament, status: newStatus });
        showToast({
          title: 'Success',
          message: 'Tournament bracket generated successfully',
          type: 'success'
        });
      } else {
        const error = await res.json();
        showToast({
          title: 'Error',
          message: error.message || 'Failed to generate bracket',
          type: 'error'
        });
      }
    } catch (err) {
      showToast({
        title: 'Error',
        message: 'Error generating tournament bracket',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-xl font-semibold mb-4">Staff Controls</h2>
      
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowEditModal(true)}
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-400"
          >
            Edit Info
          </button>

          {tournament.status === 'registration_open' && (
            <button
              onClick={() => updateStatus('registration_closed')}
              disabled={isUpdating}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-yellow-400"
            >
              Close Registration
            </button>
          )}

          {tournament.status === 'registration_closed' && (
            <button
              onClick={generateBracket}
              disabled={isUpdating}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-400"
            >
              Generate Bracket
            </button>
          )}

          {tournament.status === 'brackets_generated' && (
            <button
              onClick={() => updateStatus('in_progress')}
              disabled={isUpdating}
              className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:bg-cyan-400"
            >
              Start Tournament
            </button>
          )}

          {tournament.status === 'in_progress' && (
            <button
              onClick={() => updateStatus('completed')}
              disabled={isUpdating}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-purple-400"
            >
              End Tournament
            </button>
          )}

          <button
            onClick={() => updateStatus('cancelled')}
            disabled={isUpdating}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-400"
          >
            Cancel Tournament
          </button>
        </div>
      </div>

      {showEditModal && (
        <EditInfoModal
          tournament={tournament}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            setTournament({ ...tournament, ...updated });
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

/* ─── Edit Info Modal ─── */

export interface EditInfoModalProps {
  tournament: Tournament;
  onClose: () => void;
  onSave: (updated: Partial<Tournament>) => void;
}

export function EditInfoModal({ tournament, onClose, onSave }: EditInfoModalProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Convert UTC ISO date to datetime-local value
  const toDateTimeLocal = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  const [name, setName] = useState(tournament.name);
  const [description, setDescription] = useState(tournament.description || '');
  const [date, setDate] = useState(toDateTimeLocal(tournament.date));
  const [image, setImage] = useState(tournament.image || '');

  // Game data state
  const initGameData = tournament.game_data;
  const [differsPerRound, setDiffersPerRound] = useState(initGameData?.differsPerRound ?? false);
  const [singleGame, setSingleGame] = useState<GameInfo>(
    initGameData?.game
      ? { ...emptyGameInfo(), ...initGameData.game }
      : emptyGameInfo()
  );
  const [roundGames, setRoundGames] = useState<Record<string, GameInfo>>(() => {
    const base = Object.fromEntries(ROUND_KEYS.map(k => [k, emptyGameInfo()]));
    if (initGameData?.rounds) {
      for (const key of ROUND_KEYS) {
        if (initGameData.rounds[key]) {
          base[key] = { ...emptyGameInfo(), ...initGameData.rounds[key] };
        }
      }
    }
    return base;
  });

  const updateRoundGame = (roundKey: string, field: keyof GameInfo, value: string) => {
    setRoundGames(prev => ({
      ...prev,
      [roundKey]: { ...prev[roundKey], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast({ title: 'Error', message: 'Tournament name is required', type: 'error' });
      return;
    }

    setSaving(true);

    const game_data: GameData = differsPerRound
      ? { differsPerRound: true, rounds: roundGames }
      : { differsPerRound: false, game: singleGame };

    const body = {
      name,
      description,
      date: date ? new Date(date).toISOString() : null,
      image: image || null,
      game_data,
    };

    try {
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        onSave({
          name: data.name,
          description: data.description,
          date: data.date,
          image: data.image,
          game_data: typeof data.game_data === 'string' ? JSON.parse(data.game_data) : data.game_data,
        });
        showToast({ title: 'Success', message: 'Tournament info updated', type: 'success' });
      } else {
        const error = await res.json();
        showToast({ title: 'Error', message: error.message || 'Failed to update tournament', type: 'error' });
      }
    } catch {
      showToast({ title: 'Error', message: 'Error updating tournament', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "mt-1 block w-full bg-gray-900/50 text-white rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 px-4 py-2";

  const renderGameFields = (game: GameInfo, onChange: (field: keyof GameInfo, value: string) => void, idPrefix: string) => (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${idPrefix}-gameName`} className="block text-sm font-medium text-gray-300">Game Name</label>
        <input type="text" id={`${idPrefix}-gameName`} value={game.gameName} onChange={(e) => onChange('gameName', e.target.value)} className={inputClass} placeholder="e.g. Super Mario 64" />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-platform`} className="block text-sm font-medium text-gray-300">Platform</label>
        <input type="text" id={`${idPrefix}-platform`} value={game.platform} onChange={(e) => onChange('platform', e.target.value)} className={inputClass} placeholder="e.g. Fightcade" />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-platformUrl`} className="block text-sm font-medium text-gray-300">Platform URL <span className="text-gray-500 text-xs">(optional)</span></label>
        <input type="url" id={`${idPrefix}-platformUrl`} value={game.platformUrl || ''} onChange={(e) => onChange('platformUrl', e.target.value)} className={inputClass} placeholder="https://..." />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-challengeDescription`} className="block text-sm font-medium text-gray-300">Challenge Description</label>
        <textarea id={`${idPrefix}-challengeDescription`} value={game.challengeDescription} onChange={(e) => onChange('challengeDescription', e.target.value)} rows={2} className={inputClass} placeholder="Describe the challenge or mode..." />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-neutral-800 border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 mb-6">Edit Tournament Info</h2>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Tournament Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Tournament Date <span className="text-gray-500 text-xs">(UTC, optional)</span></label>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            <p className="mt-1 text-sm text-gray-400">Leave empty to display as T.B.D.</p>
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Tournament Image URL</label>
            <input type="url" value={image} onChange={(e) => setImage(e.target.value)} className={inputClass} />
          </div>

          {/* Game Information */}
          <div className="border border-gray-700/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-200">Game Information</h3>
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
              renderGameFields(singleGame, (field, value) => setSingleGame(prev => ({ ...prev, [field]: value })), 'edit-game')
            ) : (
              <div className="space-y-4">
                {ROUND_KEYS.map((roundKey) => (
                  <div key={roundKey} className="border border-gray-700/30 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-300">{ROUND_LABELS[roundKey]}</h4>
                    {renderGameFields(roundGames[roundKey], (field, value) => updateRoundGame(roundKey, field, value), `edit-${roundKey}`)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-700/50 rounded-lg text-sm font-medium text-gray-300 bg-gray-900/50 hover:bg-gray-800/80 transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 border border-purple-500/30 rounded-lg text-sm font-medium text-white bg-purple-600/80 hover:bg-purple-700 disabled:opacity-50 transition-all duration-300"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}