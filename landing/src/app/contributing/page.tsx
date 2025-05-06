// src/app/contributing/page.tsx

'use client';

import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";

export default function Contributing() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />

      <section className="flex flex-col items-center justify-center text-center px-8 py-8">
        <h1 className="text-4xl font-bold mb-8 text-white">Ways to Contribute</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Volunteering Column */}
          <div className="rounded-lg p-6 text-gray-200">
            <div className="mb-4">
              <img
                src="/images/volunteering.png"
                alt="Profile Icon"
                className="h-25 w-25 rounded-full mx-auto mb-4 object-cover" />
              <h2 className="text-2xl font-semibold text-white">Volunteering</h2>
            </div>
            <p className="text-sm leading-relaxed">
              We live and breathe retro gaming, and we know you do too. That's why we're always on the lookout for passionate volunteers to help us grow and improve our community.
              Whether you're a seasoned pro or just starting out, there are plenty of ways to get involved and make a difference.
              Retro eSports currently consists of the following teams that are often open to new members:
              <li>
                <strong>Tournament Hosts:</strong> Organize tournaments and events, ensuring everything runs smoothly and fairly. If you have experience in event management or just love being part of the action, this is the role for you.
              </li>
              <li>
                <strong>Game Masters:</strong> Referee the on-going tournaments, ensuring that all players are following the rules and guidelines. If you have a keen eye for detail and a passion for fair play, this is the role for you.
              </li>
              <li>
                <strong>Streamers:</strong> Help us showcase our tournaments and events by streaming them live. If you have experience with streaming or just love being in front of the camera, this is the role for you.
              </li>
              <li>
                <strong>Media Team:</strong> Create graphics, videos, and other media to promote our events and community, or maintain our VOD library. If you have a knack for design, video editing or file handling, this is the role for you.
              </li>
              If you're interested in volunteering, please reach out to us through our Discord server. We would love to hear from you and see how you can help us grow and improve our community.
            </p>
          </div>

          {/* Financing Column */}
          <div className="rounded-lg p-6 text-gray-200">
            <div className="mb-4">
              <img
                src="/images/financing.png"
                alt="Profile Icon"
                className="h-25 w-25 rounded-full mx-auto mb-4 object-cover" />
              <h2 className="text-2xl font-semibold text-white">Financing</h2>
            </div>
            <p className="text-sm leading-relaxed">
              At Retro eSports, our mission is to celebrate classic games through competition — not to chase profits.

              This project is powered by passion, nostalgia, and a belief that retro gaming deserve a competitive space that feels authentic and community driven.
              While we're not here to make money, running Retro eSports still comes with real-world costs. Things like:
              <ul>
                💻 Server hosting and maintenance
              </ul>
              <ul>
                🎥 Media production (graphics, streams, edits)
              </ul>
              <ul>
                🛠 Quality-of-life improvements to the website and platform
              </ul>
              <ul>
                ⚡ Bandwidth, storage, and third-party tools
              </ul>
              We gratefully accept financial support from the community to help us break even and keep the project running smoothly. Every bit helps — and everything we receive goes directly toward keeping Retro eSports alive and improving the experience for everyone.
            </p>
          </div>

          {/* Miscellaneous Column */}
          <div className="rounded-lg p-6 text-gray-200">
            <div className="mb-4">
              <img
                src="/images/misc.png" // Replace this path with your actual image path or URL
                alt="Profile Icon"
                className="h-25 w-25 rounded-full mx-auto mb-4 object-cover" />
              <h2 className="text-2xl font-semibold text-white">Miscellaneous</h2>
            </div>
            <p className="text-sm leading-relaxed">
              If you have any other ideas on how to contribute, we would love to hear them! We are always looking for new ways to improve our community and make it a better place for everyone.
              Whether it's a new feature for the website, a suggestion for a tournament format, or anything else you can think of, we want to hear it. Please reach out to us through our Discord server.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
