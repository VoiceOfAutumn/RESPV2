'use client';

import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";

export default function Rules() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />

      <main className="max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-6 border-b border-neutral-700 pb-2">Rules & Guidelines</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">General rules</h2>
          <p className="text-gray-300">
            <li>
              Use of glitches & cheat codes is not allowed unless specified otherwise. When in doubt, please ask a Game Master or Tournament Host.
            </li>
            <li>
              Fast Forward, Rewind, Macros, Save States and other similar features are not allowed.
            </li>
            <li>
              Players must stream their matches for a Game Master in the Discord server unless the used platform contains a spectator function. Players are responsible for ensuring their stream is working properly before the match starts.
            </li>
            <li>
              There is a zero tolerance policy towards intentional cheating and any other form of unsportsmanlike conduct. Players found to be in violation of this policy will be disqualified from the tournament and banned from the platform.
            </li>
            <li>
              Failure to start your match on time will result in a forfeit. Players are expected to be present in the Discord server and ready to play at the scheduled time. Rescheduling is not an option.
              </li>
            <li>
              If a player disconnects or crashes after the match has started, the match will be considered a forfeit unless the Game Master decides otherwise. Players are expected to have a stable internet connection and to be using a reliable emulator.
            </li> 
            <li>
              Players are expected to play on a stable device. If a player gains an advantage due technical issues, such as slow-down, the match will be considered a forfeit.
            </li>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Player Behaviour</h2>
          <p className="text-gray-300">
              Retro eSports is a competitive platform that believes sport and both physical and mental health go hand in hand. To ensure this, we expect the following of our players:
              <li>
              Players are to treat the platform as an addition to their gaming experience, not a replacement of it or their life. <strong>Players are expected to take breaks and not use the platform as a substitute for real life social interactions.</strong>
              </li>
              <li>
                Players are expected to treat each other with respect and sportsmanship. On the flip side, players are expected to deescalate any conflicts by blocking users if they feel uncomfortable. Players circumventing these constraints will be banned from the platform.
              </li>
              <li>
                Blatant defamation, racism, threats, grooming, and any other form of inappropriate communication will not be tolerated. Players found to be in violation of this policy will be banned from the platform.
              </li>
              <li>
                Players are to reach out to a Game Master or Tournament Host in private if they disagree with a decision made during a match. Players are expected to respect the decisions made by the Game Master or Tournament Host and to not argue about them in public channels.
              </li>
              <li>
                Players are expected to not break any copyright laws. Retro eSports does not support or provide any copyright-protected ROMs! We have a zero-tolerance policy towards any illegal content on our platform. We do not provide any links to download ROMs or any other copyrighted content. We are not responsible for any content uploaded by users, and we reserve the right to remove any content that violates our policies.
              </li>
          </p>
        </section>

      </main>
    </div>
  );
}
