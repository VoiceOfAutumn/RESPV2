// app/leaderboard/page.tsx

import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import Leaderboard from '../components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />
      <section className="flex flex-col items-center justify-center text-center px-4 py-32">
        <h1 className="text-4xl font-semibold mb-8">Leaderboard</h1>
        <Leaderboard />
      </section>
    </main>
  );
}
