'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // Use useParams for dynamic parameters
import TopBar from '../../components/TopBar'; // Import TopBar
import Navbar from '../../components/Navbar'; // Import Navbar

export default function UserProfile() {
  const { displayname } = useParams(); // Get the dynamic displayname
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!displayname) return;

    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`http://localhost:3000/user/${displayname}`);
        if (!res.ok) {
          throw new Error("User not found");
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [displayname]);

  if (loading) {
    return <div className="text-center text-white">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!user) {
    return <div className="text-center text-white">No user data found</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />
      <section className="flex flex-col items-center justify-center text-center px-4 py-32">
        <div className="max-w-3xl mx-auto p-6 bg-gray-800 text-white rounded-lg shadow-md">
          <div className="flex items-center gap-6">
            <img
              src="/images/default-avatar.png"
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-gray-700"
            />
            <div>
              <h1 className="text-4xl font-semibold">{user.display_name}</h1>
              <p className="text-lg mt-2">Country: {user.country}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-lg">Points: {user.points}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
