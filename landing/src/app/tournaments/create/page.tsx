'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/TopBar';
import Navbar from '../../components/Navbar';
import { useToast } from '@/app/components/ToastContext';

interface FormData {
  name: string;
  description: string;
  date: string;
  game: string;
  rules: string;
  format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
  maxParticipants: number;
  seedType: 'RANDOM' | 'MANUAL';
  externalLinks: {
    discord?: string;
    twitch?: string;
  };
}

export default function CreateTournamentPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    date: '',
    game: '',
    rules: '',
    format: 'SINGLE_ELIMINATION',
    maxParticipants: 8,
    seedType: 'RANDOM',
    externalLinks: {}
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:3000/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <TopBar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6">Create Tournament</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Tournament Name
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Tournament Date
              </label>
              <input
                type="datetime-local"
                id="date"
                required
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="game" className="block text-sm font-medium text-gray-700">
                Game
              </label>
              <input
                type="text"
                id="game"
                required
                value={formData.game}
                onChange={(e) => setFormData(prev => ({ ...prev, game: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="rules" className="block text-sm font-medium text-gray-700">
                Tournament Rules
              </label>
              <textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                Tournament Format
              </label>
              <select
                id="format"
                value={formData.format}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  format: e.target.value as 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION'
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="SINGLE_ELIMINATION">Single Elimination</option>
                <option value="DOUBLE_ELIMINATION">Double Elimination</option>
              </select>
            </div>

            <div>
              <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
                Maximum Participants
              </label>
              <input
                type="number"
                id="maxParticipants"
                min={2}
                required
                value={formData.maxParticipants}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  maxParticipants: parseInt(e.target.value) 
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Recommended: 4, 8, 16, 32, 64, etc. for optimal bracket structure
              </p>
            </div>

            <div>
              <label htmlFor="seedType" className="block text-sm font-medium text-gray-700">
                Seeding Method
              </label>
              <select
                id="seedType"
                value={formData.seedType}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  seedType: e.target.value as 'RANDOM' | 'MANUAL'
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="RANDOM">Random</option>
                <option value="MANUAL">Manual</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Manual seeding allows you to set player positions after registration closes
              </p>
            </div>

            <div>
              <label htmlFor="discord" className="block text-sm font-medium text-gray-700">
                Discord Link (Optional)
              </label>
              <input
                type="url"
                id="discord"
                value={formData.externalLinks.discord || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  externalLinks: { ...prev.externalLinks, discord: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="twitch" className="block text-sm font-medium text-gray-700">
                Twitch Channel (Optional)
              </label>
              <input
                type="url"
                id="twitch"
                value={formData.externalLinks.twitch || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  externalLinks: { ...prev.externalLinks, twitch: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Tournament
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}