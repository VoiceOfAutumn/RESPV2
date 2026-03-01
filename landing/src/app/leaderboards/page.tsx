// app/leaderboard/page.tsx

import PageShell from '../components/PageShell';
import Leaderboard from '../components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />
      <section className="flex flex-col items-center justify-center text-center px-4 py-8">
        <h1 className="text-4xl font-semibold mb-8">Leaderboard</h1>
        <Leaderboard />
      </section>
    </main>
  );
}
