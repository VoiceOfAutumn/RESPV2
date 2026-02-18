'use client';

import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-64">
      <TopBar />
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Terms & Conditions
          </h1>
          <p className="mt-4 text-gray-400">
            Last updated: May 2025
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10">
          <section className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By using our services, you agree to the latest version of our Terms of Use & Guidelines, follow all applicable laws and regulations, and accept responsibility for complying with any local laws that apply to you. We may update these terms at any time. Continued use of the platform after changes implies acceptance.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Copyright</h2>
            <p className="text-gray-300 leading-relaxed">
              All company names, product names, service names, and logos on this website are used for identification purposes only. All trademarks and registered trademarks belong to their respective owners.
            </p>
          </section>

          <section className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Disclaimers</h2>
            <div className="space-y-6 text-gray-300">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-2">ROMs Policy</h3>
                <p className="leading-relaxed">
                  <strong>Retro Rivals does not support or provide any copyright-protected ROMs!</strong> We have a zero-tolerance policy towards any illegal content on our platform. We do not provide any links to download ROMs or any other copyrighted content. We are not responsible for any content uploaded by users, and we reserve the right to remove any content that violates our policies.
                </p>
              </div>

              <div className="bg-gray-700/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Service Availability</h3>
                <p className="leading-relaxed">
                  We remain the right to suspend users or discontinue service towards them at any time without notice.
                </p>
              </div>

              <div className="bg-gray-700/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Third-Party Services</h3>
                <p className="leading-relaxed">
                  We are not responsible for any third-party services or content linked on or to our platform. Use them at your own risk.
                </p>
              </div>

              <div className="bg-gray-700/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Limitation of Liability</h3>
                <p className="leading-relaxed">
                  We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of our services.
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">
            If you have any questions about these terms, please contact us through the appropriate channels.
          </p>
        </div>
      </main>
    </div>
  );
}
