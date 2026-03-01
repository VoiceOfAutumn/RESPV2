'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '../components/PageShell';
import { API_BASE_URL } from '@/lib/api';

interface Seal {
  id: number;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authToken = localStorage.getItem('authToken');
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return headers;
}

export default function AdminToolsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Seal state
  const [seals, setSeals] = useState<Seal[]>([]);
  const [sealForm, setSealForm] = useState({ name: '', description: '', image_url: '' });
  const [sealFormLoading, setSealFormLoading] = useState(false);
  const [sealError, setSealError] = useState('');
  const [sealSuccess, setSealSuccess] = useState('');

  // Award state
  const [awardSealId, setAwardSealId] = useState<number | null>(null);
  const [awardUsername, setAwardUsername] = useState('');
  const [awardLoading, setAwardLoading] = useState(false);
  const [awardMsg, setAwardMsg] = useState('');

  // Remove seal state
  const [removeSealId, setRemoveSealId] = useState<number | null>(null);
  const [removeUsername, setRemoveUsername] = useState('');
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeMsg, setRemoveMsg] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.isLoggedIn && data.user?.role === 'admin') {
            setAuthorized(true);
          } else {
            router.replace('/');
          }
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch seals
  const fetchSeals = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/seals`);
      if (res.ok) {
        setSeals(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch seals:', err);
    }
  };

  useEffect(() => {
    if (authorized) fetchSeals();
  }, [authorized]);

  const handleCreateSeal = async () => {
    setSealError('');
    setSealSuccess('');
    if (!sealForm.name.trim() || !sealForm.image_url.trim()) {
      setSealError('Name and image URL are required.');
      return;
    }
    setSealFormLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/seals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(sealForm),
      });
      if (res.ok) {
        setSealForm({ name: '', description: '', image_url: '' });
        setSealSuccess('Seal created successfully!');
        fetchSeals();
      } else {
        const data = await res.json();
        setSealError(data.message || 'Failed to create seal');
      }
    } catch {
      setSealError('Network error');
    } finally {
      setSealFormLoading(false);
    }
  };

  const handleDeleteSeal = async (sealId: number) => {
    if (!confirm('Are you sure you want to delete this seal? It will be removed from all users.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/seals/${sealId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        fetchSeals();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete seal');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleAwardSeal = async () => {
    if (!awardSealId || !awardUsername.trim()) return;
    setAwardLoading(true);
    setAwardMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/seals/${awardSealId}/award`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ display_name: awardUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAwardMsg(data.message);
        setAwardUsername('');
      } else {
        setAwardMsg(data.message || 'Failed to award seal');
      }
    } catch {
      setAwardMsg('Network error');
    } finally {
      setAwardLoading(false);
    }
  };

  const handleRemoveSeal = async () => {
    if (!removeSealId || !removeUsername.trim()) return;
    setRemoveLoading(true);
    setRemoveMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/seals/${removeSealId}/award`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ display_name: removeUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setRemoveMsg(data.message);
        setRemoveUsername('');
      } else {
        setRemoveMsg(data.message || 'Failed to remove seal');
      }
    } catch {
      setRemoveMsg('Network error');
    } finally {
      setRemoveLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
        <PageShell />
        <section className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
        </section>
      </main>
    );
  }

  if (!authorized) {
    return null;
  }

  const inputClass = "w-full bg-gray-900/50 text-white rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent px-4 py-2 text-sm";
  const btnClass = "bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed";
  const btnDangerClass = "bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1.5 rounded-lg transition text-xs font-medium";

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />
      <section className="px-8 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
          Admin Tools
        </h1>
        <p className="text-gray-400 mb-8">Manage and configure site-wide settings.</p>

        {/* ===== Seal Management ===== */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Seal Management
          </h2>

          {/* Create Seal */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Seal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Name</label>
                <input
                  className={inputClass}
                  placeholder="Seal name"
                  value={sealForm.name}
                  onChange={(e) => setSealForm({ ...sealForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Description (hover text)</label>
                <input
                  className={inputClass}
                  placeholder="Description shown on hover"
                  value={sealForm.description}
                  onChange={(e) => setSealForm({ ...sealForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Image URL</label>
                <input
                  className={inputClass}
                  placeholder="https://example.com/seal.png"
                  value={sealForm.image_url}
                  onChange={(e) => setSealForm({ ...sealForm, image_url: e.target.value })}
                />
              </div>
            </div>
            {sealForm.image_url && (
              <div className="mb-4 flex items-center gap-3">
                <span className="text-gray-400 text-xs">Preview:</span>
                <div className="w-12 h-12 rounded-full border-2 border-purple-500/50 overflow-hidden bg-gray-900 flex-shrink-0">
                  <img src={sealForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <button className={btnClass} disabled={sealFormLoading} onClick={handleCreateSeal}>
                {sealFormLoading ? 'Creating...' : 'Create Seal'}
              </button>
              {sealError && <span className="text-red-400 text-sm">{sealError}</span>}
              {sealSuccess && <span className="text-green-400 text-sm">{sealSuccess}</span>}
            </div>
          </div>

          {/* Existing Seals */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Existing Seals ({seals.length})</h3>
            {seals.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No seals have been created yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {seals.map((seal) => (
                  <div key={seal.id} className="group relative bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-purple-500/50 transition-all">
                    <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 overflow-hidden bg-gray-800 flex-shrink-0">
                      <img src={seal.image_url} alt={seal.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-white text-xs font-medium text-center leading-tight">{seal.name}</span>
                    {seal.description && (
                      <span className="text-gray-500 text-[10px] text-center leading-tight">{seal.description}</span>
                    )}
                    <button
                      onClick={() => handleDeleteSeal(seal.id)}
                      className={`${btnDangerClass} mt-1 opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Award / Remove Seal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Award */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Award Seal to User</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Seal</label>
                  <select
                    className={inputClass}
                    value={awardSealId ?? ''}
                    onChange={(e) => setAwardSealId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Select a seal...</option>
                    {seals.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Username</label>
                  <input
                    className={inputClass}
                    placeholder="Display name"
                    value={awardUsername}
                    onChange={(e) => setAwardUsername(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className={btnClass}
                    disabled={awardLoading || !awardSealId || !awardUsername.trim()}
                    onClick={handleAwardSeal}
                  >
                    {awardLoading ? 'Awarding...' : 'Award Seal'}
                  </button>
                  {awardMsg && <span className="text-sm text-gray-300">{awardMsg}</span>}
                </div>
              </div>
            </div>

            {/* Remove */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Remove Seal from User</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Seal</label>
                  <select
                    className={inputClass}
                    value={removeSealId ?? ''}
                    onChange={(e) => setRemoveSealId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Select a seal...</option>
                    {seals.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Username</label>
                  <input
                    className={inputClass}
                    placeholder="Display name"
                    value={removeUsername}
                    onChange={(e) => setRemoveUsername(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={removeLoading || !removeSealId || !removeUsername.trim()}
                    onClick={handleRemoveSeal}
                  >
                    {removeLoading ? 'Removing...' : 'Remove Seal'}
                  </button>
                  {removeMsg && <span className="text-sm text-gray-300">{removeMsg}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Other placeholder tools */}
          <h2 className="text-2xl font-bold text-white mt-4">Other Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 opacity-50">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">User Management</h3>
              <p className="text-gray-500 text-sm">Coming soon</p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 opacity-50">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Site Analytics</h3>
              <p className="text-gray-500 text-sm">Coming soon</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
