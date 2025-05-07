'use client';

import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import Navbar from '../components/Navbar';

export default function UserSettings() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    country: '',
    profile_picture: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:3000/user/me', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch user data');
        const data = await res.json();
        setUser(data);
        setFormData({
          email: data.email || '',
          password: '',
          country: data.country || '',
          profile_picture: data.profile_picture || '',
        });
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (
      formData.profile_picture &&
      !formData.profile_picture.match(/\.(png|jpg|jpeg)$/i)
    ) {
      setError('Profile picture must be a link ending in .png, .jpg, or .jpeg');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/user/update', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Update failed');
      }

      setMessage('Profile updated successfully!');
      setFormData((prev) => ({ ...prev, password: '' })); // Clear password field only
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  if (loading) {
    return <div className="text-white text-center pt-20">Loading...</div>;
  }

  if (error && !user) {
    return <div className="text-red-500 text-center pt-20">{error}</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />

      <section className="px-8 py-16 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-purple-400">Edit Profile</h1>

        {message && <p className="text-green-400 mb-4">{message}</p>}
        {error && user && <p className="text-red-400 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              name="email"
              className="w-full p-2 rounded bg-gray-800 border border-gray-600"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              name="password"
              className="w-full p-2 rounded bg-gray-800 border border-gray-600"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Country</label>
            <input
              type="text"
              name="country"
              className="w-full p-2 rounded bg-gray-800 border border-gray-600"
              value={formData.country}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Profile Picture URL</label>
            <input
              type="text"
              name="profile_picture"
              className="w-full p-2 rounded bg-gray-800 border border-gray-600"
              value={formData.profile_picture}
              onChange={handleChange}
              placeholder="Must end in .png, .jpg, or .jpeg"
            />
          </div>

          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 transition px-4 py-2 rounded font-semibold"
          >
            Save Changes
          </button>
        </form>
      </section>
    </main>
  );
}
