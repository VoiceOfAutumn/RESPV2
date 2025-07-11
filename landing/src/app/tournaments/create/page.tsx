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
  rules: string;
  image: string;
}

export default function CreateTournamentPage() {
  const router = useRouter();
  const { showToast } = useToast();  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    date: '',
    rules: '',
    image: ''
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a copy of the form data to sanitize before submission
    const submissionData = {
      ...formData,
      // Ensure date is in ISO format
      date: new Date(formData.date).toISOString(),
    };

    try {
      // Get auth token for authentication
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('https://backend-6wqj.onrender.com/tournaments', {
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
                className="mt-1 block w-full bg-gray-900/50 text-white rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 px-4 py-2"
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
                className="mt-1 block w-full bg-gray-900/50 text-white rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 px-4 py-2"
              />
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-300">
                Tournament Date
              </label>
              <input
                type="datetime-local"
                id="date"
                required
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1 block w-full bg-gray-900/50 text-white rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 px-4 py-2"
              />
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
                className="mt-1 block w-full bg-gray-900/50 text-white rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 px-4 py-2"
              />
              <p className="mt-1 text-sm text-gray-400">
                Must be a direct link to an image ending in .jpg, .jpeg, or .png
              </p>
            </div>
            
            <div>
              <label htmlFor="rules" className="block text-sm font-medium text-gray-300">
                Tournament Rules
              </label>
              <textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                rows={4}
                className="mt-1 block w-full bg-gray-900/50 text-white rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 px-4 py-2"
              />
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