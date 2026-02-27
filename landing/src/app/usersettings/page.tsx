'use client'; 

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // For redirection
import TopBar from '../components/TopBar';
import Navbar from '../components/Navbar';
import { API_BASE_URL } from '@/lib/api';

export default function UserSettings() {
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    country_id: '',
    profile_picture: '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);
  const [loadingFields, setLoadingFields] = useState({
    email: false,
    password: false,
    country: false,
    profile_picture: false,
  });

  const [isClient, setIsClient] = useState(false); // Track if we're on the client
  const router = useRouter(); // For redirection

  useEffect(() => {
    setIsClient(true); // Now we're sure the code is running on the client
  }, []);

  useEffect(() => {
    if (!isClient) return; // Wait until we are on the client

    const fetchUserSettings = async () => {
      try {
        // Get auth token for authentication
        const authToken = localStorage.getItem('authToken');
        const headers: HeadersInit = {};
        
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const res = await fetch(`${API_BASE_URL}/usersettings`, {
          headers,
          credentials: 'include', // Ensure the session cookie is included
        });

        if (res.status === 401) {
          // Redirect to login if not authenticated
          router.push('/login');
        }

        if (!res.ok) throw new Error('Failed to fetch user settings');
        const data = await res.json();
        setUserData({
          email: data.email || '',
          password: '',
          country_id: data.country_id || '',
          profile_picture: data.profile_picture || '',
        });
      } catch (err) {
        console.error(err);
      }
    };

    const fetchCountries = async () => {
      try {
        // Get auth token for authentication
        const authToken = localStorage.getItem('authToken');
        const headers: HeadersInit = {};
        
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const res = await fetch(`${API_BASE_URL}/countries`, {
          headers,
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch countries');
        const data = await res.json();
        setCountries(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserSettings();
    fetchCountries();
  }, [router, isClient]); // Only call once client is mounted
  const handleUpdate = async (field: keyof typeof userData) => {
    setLoadingFields((prev) => ({ ...prev, [field]: true }));
    try {
      // Validate email
      if (field === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
          throw new Error('Please enter a valid email address');
        }
      }

      // Validate password
      if (field === 'password') {
        if (!currentPassword) {
          throw new Error('Please enter your current password');
        }
        if (userData.password !== confirmPassword) {
          throw new Error('New passwords do not match');
        }
        const passwordRegex = /^(?=.*[A-Z])(?=.*[\d!@#$%^&*]).{8,}$/;
        if (!passwordRegex.test(userData.password)) {
          throw new Error('Password must be at least 8 characters with one uppercase letter and one number or special character');
        }
      }      // Validate profile picture URL
      if (field === 'profile_picture') {
        const url = userData.profile_picture.toLowerCase();
        if (!url.match(/\.(png|jpg|jpeg)$/)) {
          throw new Error('Profile picture URL must end with .png, .jpg, or .jpeg');
        }
      }

      // Validate country
      if (field === 'country_id') {
        if (!userData.country_id) {
          throw new Error('Please select a country');
        }
      }

      // Get auth token for authentication
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const body = field === 'password'
        ? { [field]: userData[field], currentPassword }
        : { [field]: userData[field] };

      const res = await fetch(`${API_BASE_URL}/user/update`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Update failed');
      }

      alert(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);

      if (field === 'password') {
        setCurrentPassword('');
        setConfirmPassword('');
        setUserData((prev) => ({ ...prev, password: '' }));
      }
      
      if (field === 'profile_picture') {
        // Refresh the page to show the new profile picture
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : `Failed to update ${field}`);
    } finally {
      setLoadingFields((prev) => ({ ...prev, [field]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-16">
      <TopBar />
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-5 mt-5">
        <h1 className="text-3xl font-bold mb-6 border-b border-neutral-700 pb-2">Edit Your Profile</h1>        <div className="space-y-8">
          {/* Email Field */}
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Email Address</h2>
            <div className="flex gap-4 items-center">
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                className="flex-1 bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter new email"
              />
              <button
                onClick={() => handleUpdate('email')}
                disabled={loadingFields.email}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
              >
                {loadingFields.email ? 'Updating...' : 'Update Email'}
              </button>
            </div>
          </div>

          {/* Password Field */}
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Password</h2>
            <div className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Current password"
              />
              <input
                type="password"
                value={userData.password}
                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="New password"
              />
              <div className="flex gap-4 items-center">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Confirm new password"
                />
                <button
                  onClick={() => handleUpdate('password')}
                  disabled={loadingFields.password || !currentPassword || !userData.password || !confirmPassword}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loadingFields.password ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>

          {/* Profile Picture Field */}
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
            <div className="flex gap-4 items-start">
              <div className="flex-1 space-y-4">
                <input
                  type="text"
                  value={userData.profile_picture}
                  onChange={(e) => setUserData({ ...userData, profile_picture: e.target.value })}
                  className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter image URL (.png, .jpg, or .jpeg)"
                />
                <div className="text-sm text-gray-400">
                  URL must end with .png, .jpg, or .jpeg
                </div>
              </div>
              <button
                onClick={() => {
                  const url = userData.profile_picture.toLowerCase();
                  if (!url.match(/\.(png|jpg|jpeg)$/)) {
                    alert('Please enter a valid image URL ending with .png, .jpg, or .jpeg');
                    return;
                  }
                  handleUpdate('profile_picture');
                }}
                disabled={loadingFields.profile_picture}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
              >
                {loadingFields.profile_picture ? 'Updating...' : 'Update Picture'}
              </button>
            </div>
            {userData.profile_picture && (
              <div className="mt-4">
                <img
                  src={userData.profile_picture}
                  alt="Profile Preview"
                  className="w-24 h-24 rounded-full border-2 border-purple-500 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/default-avatar.png';
                    e.currentTarget.onerror = null;
                  }}
                />          </div>
            )}
          </div>

          {/* Country Field */}
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Country</h2>
            <div className="flex gap-4 items-center">
              <select
                value={userData.country_id}
                onChange={(e) => setUserData({ ...userData, country_id: e.target.value })}
                className="flex-1 bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleUpdate('country_id')}
                disabled={loadingFields.country || !userData.country_id}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50"
              >
                {loadingFields.country ? 'Updating...' : 'Update Country'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
