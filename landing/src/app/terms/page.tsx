'use client';

import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-16">
      <TopBar />
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-5 mt-5">
        <h1 className="text-3xl font-bold mb-6 border-b border-neutral-700 pb-2">Terms & Conditions</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Acceptance of Terms</h2>
          <p className="text-gray-300">
          By using our services, you agree to the latest version of our Terms of Use & Guidelines, follow all applicable laws and regulations, and accept responsibility for complying with any local laws that apply to you. We may update these terms at any time. Continued use of the platform after changes implies acceptance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Copyright</h2>
          <p className="text-gray-300">
          All company names, product names, service names, and logos on this website are used for identification purposes only. All trademarks and registered trademarks belong to their respective owners.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Disclaimers</h2>
          <p className="text-gray-300">
          <ul>
              <strong>ROMs:</strong><strong> Retro eSports does not support or provide any copyright-protected ROMs!</strong> We have a zero-tolerance policy towards any illegal content on our platform. We do not provide any links to download ROMs or any other copyrighted content. We are not responsible for any content uploaded by users, and we reserve the right to remove any content that violates our policies.
            </ul>
            <ul>
              <strong>Service Availability:</strong> We remain the right to suspend users or discontinue service towards them at any time without notice.
            </ul>
            <ul>
              <strong>Third-Party Services:</strong> We are not responsible for any third-party services or content linked on or to our platform. Use them at your own risk.
            </ul>
            <ul>
              <strong>Limitation of Liability:</strong> We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of our services.
            </ul>

          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Privacy & Data</h2>
          <p className="text-gray-300">
          We value your privacy. Information you provide is stored securely to the best of our ability and will never be sold. Any information you provide is used solely for the purpose of providing our services.
          </p>
        </section>

        <p className="pt-6 italic text-gray-400 text-xs">
          Last updated: May 2025
        </p>
      </main>
    </div>
  );
}
