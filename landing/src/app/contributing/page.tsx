// src/app/contributing/page.tsx

'use client';

import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";

export default function Contributing() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />

      <section className="flex flex-col items-center justify-center text-center px-8 py-20">
        <h1 className="text-4xl font-bold mb-8 text-purple-400">Ways to Contribute</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Volunteering Column */}
          <div className="rounded-lg p-6 text-gray-200">
            <div className="mb-4">
              <div className="h-20 w-20 bg-gray-600 rounded-full mx-auto mb-4"></div> {/* Placeholder Icon */}
              <h2 className="text-2xl font-semibold text-pink-400">Volunteering</h2>
            </div>
            <p className="text-sm leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam volutpat odio eu turpis gravida, non euismod est iaculis. Aenean tincidunt sit amet sapien ac tempus.
            </p>
          </div>

          {/* Financing Column */}
          <div className="rounded-lg p-6 text-gray-200">
            <div className="mb-4">
              <div className="h-20 w-20 bg-gray-600 rounded-full mx-auto mb-4"></div> {/* Placeholder Icon */}
              <h2 className="text-2xl font-semibold text-pink-400">Financing</h2>
            </div>
            <p className="text-sm leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam volutpat odio eu turpis gravida, non euismod est iaculis. Aenean tincidunt sit amet sapien ac tempus.
            </p>
          </div>

          {/* Miscellaneous Column */}
          <div className="rounded-lg p-6 text-gray-200">
            <div className="mb-4">
              <div className="h-20 w-20 bg-gray-600 rounded-full mx-auto mb-4"></div> {/* Placeholder Icon */}
              <h2 className="text-2xl font-semibold text-pink-400">Miscellaneous</h2>
            </div>
            <p className="text-sm leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam volutpat odio eu turpis gravida, non euismod est iaculis. Aenean tincidunt sit amet sapien ac tempus.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
