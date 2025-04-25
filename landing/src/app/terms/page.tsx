'use client';

import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12 mt-12">
        <h1 className="text-3xl font-bold mb-6 border-b border-neutral-700 pb-2">Terms & Conditions</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="text-gray-300">
            By creating an account or participating in any activities on our site, you agree to follow all rules and policies outlined in these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">2. User Responsibilities</h2>
          <p className="text-gray-300">
            Users are expected to behave respectfully and avoid cheating or exploiting game mechanics. Accounts engaging in malicious behavior may be suspended or banned.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">3. Privacy & Data</h2>
          <p className="text-gray-300">
            We value your privacy. Information you provide is stored securely and will never be sold. Please refer to our Privacy Policy for more.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">4. Modifications</h2>
          <p className="text-gray-300">
            We may update these terms at any time. Continued use of the platform after changes implies acceptance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">5. Contact Us</h2>
          <p className="text-gray-300">
            If you have any questions about these terms, feel free to contact our support team.
          </p>
        </section>

        <p className="pt-6 italic text-gray-400 text-xs">
          Last updated: April 2025
        </p>
      </main>
    </div>
  );
}
