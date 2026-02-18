'use client';

import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";

export default function Contributing() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />

      <section className="flex flex-col items-center justify-center text-center px-8 py-12">
        <h1 className="text-4xl font-semibold text-center mb-8">Ways To Contribute</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl w-full mx-auto">
          {/* Volunteering Column */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-md hover:shadow-purple-500/20 transition duration-300 text-left">
            <div className="mb-6 text-center">
              <img
                src="/images/volunteering.png"
                alt="Volunteering Icon"
                className="h-24 w-24 rounded-full mx-auto mb-4 object-cover border border-purple-400/30"
              />
              <h2 className="text-2xl font-bold">Volunteering</h2>
            </div>
            <p className="text-gray-300 text-base leading-relaxed">
              We live and breathe retro gaming, and we know you do too. That’s why we're always on the lookout for passionate volunteers to help us grow. Join any of our teams:
            </p>
            <ul className="list-disc list-inside text-base text-gray-400 mt-4 space-y-2">
              <li><strong>Tournament Hosts:</strong> Organize and run tournaments fairly and smoothly.</li>
              <li><strong>Game Masters:</strong> Referee matches and enforce rules.</li>
              <li><strong>Streamers:</strong> Showcase events through live streams.</li>
              <li><strong>Media Team:</strong> Create graphics, videos, and manage VODs.</li>
            </ul>
            <p className="text-base text-gray-400 mt-4">
              Interested? Reach out on our Discord server — we'd love to hear from you!
            </p>
          </div>

          {/* Financing Column */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-md hover:shadow-purple-500/20 transition duration-300 text-left">
            <div className="mb-6 text-center">
              <img
                src="/images/financing.png"
                alt="Financing Icon"
                className="h-24 w-24 rounded-full mx-auto mb-4 object-cover border border-cyan-400/30"
              />
              <h2 className="text-2xl font-bold">Financing</h2>
            </div>
            <p className="text-gray-300 text-base leading-relaxed">
              Retro Rivals is powered by nostalgia & competitiveness - not profits. But running things costs money:
            </p>
            <ul className="list-disc list-inside text-base text-gray-400 mt-4 space-y-2">
              <li>Server hosting and maintenance</li>
              <li>Media production & streaming</li>
              <li>Website improvements & tools</li>
            </ul>
            <p className="text-base text-gray-400 mt-4">
              We gratefully accept donations to help keep the platform alive and thriving. Every bit helps!
            </p>
          </div>

          {/* Miscellaneous Column */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-md hover:shadow-purple-500/20 transition duration-300 text-left">
            <div className="mb-6 text-center">
              <img
                src="/images/misc.png"
                alt="Miscellaneous Icon"
                className="h-24 w-24 rounded-full mx-auto mb-4 object-cover border border-pink-400/30"
              />
              <h2 className="text-2xl font-bold">Miscellaneous</h2>
            </div>
            <p className="text-gray-300 text-base leading-relaxed">
              Got another idea? We’re all ears.
              Whether it's a new site feature, tournament format, or community initiative — we welcome your creativity.
            </p>
            <p className="text-base text-gray-400 mt-4">
              Reach out via Discord and help shape the future of Retro Rivals with your unique contributions.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
