'use client';

import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";

export default function Rules() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-semibold text-center mb-8">Rules & Guidelines</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* General Rules */}
          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-purple-500/20 transition duration-300 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">General Rules</h2>
            <p className="text-gray-400 mb-4 leading-relaxed">
              The following rules apply to all tournaments and events on Retro Rivals. By participating, you agree to abide by these rules. Please note that individual tournaments may have additional rules.
            </p>
            <ul className="space-y-4 text-gray-300 list-disc list-inside leading-relaxed">
              <li>Use of glitches & cheat codes is not allowed unless specified otherwise. When in doubt, ask a Game Master or Tournament Host.</li>
              <li>Fast Forward, Rewind, Macros, Save States, and similar features are not allowed.</li>
              <li>Players must stream matches for a Game Master in Discord unless a spectator function is available.</li>
              <li>Zero tolerance for cheating or unsportsmanlike conduct. Violators will be disqualified and banned.</li>
              <li>Failure to start your match on time results in forfeit. No rescheduling allowed.</li>
              <li>Disconnections or crashes after a match starts are counted as forfeits unless ruled otherwise.</li>
              <li>Technical advantages from poor devices or emulators (e.g., slow-down) will result in a forfeit.</li>
            </ul>
          </section>

          {/* Player Behaviour */}
          <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-purple-500/20 transition duration-300 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Player Behaviour</h2>
            <p className="text-gray-400 mb-4 leading-relaxed">
              Retro Rivals is a competitive platform that values both mental and physical well-being. We expect the following from our players:
            </p>
            <ul className="space-y-4 text-gray-300 list-disc list-inside leading-relaxed">
              <li>
                Treat the platform as an enhancement to your gaming life, not a substitute. 
                <strong> Take breaks and maintain real-world social interactions.</strong>
              </li>
              <li>Show respect and sportsmanship. Use block features to de-escalate situations—repeat offenders will be banned.</li>
              <li>No defamation, racism, threats, grooming, or other inappropriate behavior.</li>
              <li>Appeals or complaints must be handled privately with staff, not in public channels.</li>
              <li>
                Do not break copyright laws. We don’t provide ROMs or illegal content, and we’ll remove anything that violates our policy.
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
