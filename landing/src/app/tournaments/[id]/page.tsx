'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import TopBar from '../../components/TopBar';

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
      .then((res) => {
        if (!res.ok) throw new Error('Tournament not found');
        return res.json();
      })
      .then((data) => {
        setTournament(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // Handle loading and error states
  if (loading) return <div className="text-white p-6">Loading...</div>;
  if (error) return <div className="text-red-400 p-6">Error: {error}</div>;

  // Helper function to render the circle with checkmark
  const renderMilestoneCircle = (milestoneNumber: number, milestoneStatus: string, currentStatus: string) => {
    const milestones = ['Registration Open', 'Registration Closed', 'Check-in Period', 'In Progress', 'Finished'];
    const milestoneIndex = milestones.indexOf(milestoneStatus);
    const currentStatusIndex = milestones.indexOf(currentStatus);

    const isCompleted = milestoneIndex <= currentStatusIndex;  // All previous and current milestones should be filled
    const isActive = milestoneIndex === currentStatusIndex;  // Active milestone should be highlighted

    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto border-2 ${isActive ? 'bg-green-500 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-transparent border-gray-500'}`}>
        {isActive || isCompleted ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="text-gray-500">{milestoneNumber}</span>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />

      {/* Tournament Card (Title & Date Only) */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-16">
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-4xl flex flex-col items-center justify-center space-y-4">
          {/* Tournament Name */}
          <div className="text-4xl font-bold text-white">{tournament?.name}</div>
          
          {/* Tournament Date */}
          <div className="text-lg text-gray-200">
            <strong>Date:</strong> {new Date(tournament!.date).toLocaleString()}
          </div>
        </div>
      </section>

      {/* Milestone Tracker */}
      <section className="flex justify-center px-4 py-32">
        <div className="w-full max-w-4xl space-y-4">
          <div className="flex justify-between mb-4">
            <div className={`w-1/5 text-center ${tournament?.status === 'Registration Open' ? 'text-white font-bold' : 'text-gray-400'}`}>
              {renderMilestoneCircle(1, 'Registration Open', tournament?.status!)}
              <p className={`${tournament?.status === 'Registration Open' ? 'text-white' : 'text-gray-400'} mt-2`}>Registration Open</p>
            </div>
            <div className={`w-1/5 text-center ${tournament?.status === 'Registration Closed' ? 'text-white font-bold' : 'text-gray-400'}`}>
              {renderMilestoneCircle(2, 'Registration Closed', tournament?.status!)}
              <p className={`${tournament?.status === 'Registration Closed' ? 'text-white' : 'text-gray-400'} mt-2`}>Registration Closed</p>
            </div>
            <div className={`w-1/5 text-center ${tournament?.status === 'Check-in Period' ? 'text-white font-bold' : 'text-gray-400'}`}>
              {renderMilestoneCircle(3, 'Check-in Period', tournament?.status!)}
              <p className={`${tournament?.status === 'Check-in Period' ? 'text-white' : 'text-gray-400'} mt-2`}>Check-In Period</p>
            </div>
            <div className={`w-1/5 text-center ${tournament?.status === 'In Progress' ? 'text-white font-bold' : 'text-gray-400'}`}>
              {renderMilestoneCircle(4, 'In Progress', tournament?.status!)}
              <p className={`${tournament?.status === 'In Progress' ? 'text-white' : 'text-gray-400'} mt-2`}>In Progress</p>
            </div>
            <div className={`w-1/5 text-center ${tournament?.status === 'Finished' ? 'text-white font-bold' : 'text-gray-400'}`}>
              {renderMilestoneCircle(5, 'Finished', tournament?.status!)}
              <p className={`${tournament?.status === 'Finished' ? 'text-white' : 'text-gray-400'} mt-2`}>Finished</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
