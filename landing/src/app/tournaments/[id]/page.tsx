'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Tournament {
  id: number;
  name: string;
  description: string;
  date: string;
  status: string;
}

export default function TournamentDetailPage() {
  const { id } = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Fetch tournament data from the backend
    fetch(`http://localhost:3000/tournaments/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Tournament not found');
        return res.json();
      })
      .then(data => {
        setTournament(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleSignup = async () => {
    try {
      // Send signup request to the backend
      const response = await fetch(`http://localhost:3000/tournaments/${id}/signup`, {
        method: 'POST',
        credentials: 'include', // Ensure the session cookie is sent with the request
      });
      if (!response.ok) throw new Error('Failed to sign up');
      alert('Successfully signed up for the tournament!');
    } catch (err: any) { // Type 'err' as 'any'
      alert('Error: ' + err.message);
    }
  };

  // Handle loading and error states
  if (loading) return <div className="text-white p-6">Loading...</div>;
  if (error) return <div className="text-red-400 p-6">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">{tournament?.name}</h1>
      <p className="text-gray-300 mb-2">
        <strong>Date:</strong> {new Date(tournament!.date).toLocaleString()}
      </p>
      <p className="text-gray-300 mb-2">
        <strong>Status:</strong> {tournament!.status}
      </p>
      {tournament?.description && (
        <p className="text-gray-200 mt-4 whitespace-pre-line">{tournament.description}</p>
      )}

      {tournament?.status === 'upcoming' && (
        <button
          onClick={handleSignup}
          className="mt-6 bg-yellow-400 text-black font-semibold py-2 px-6 rounded-lg hover:bg-yellow-500 transition"
        >
          Sign Up
        </button>
      )}
    </div>
  );
}
