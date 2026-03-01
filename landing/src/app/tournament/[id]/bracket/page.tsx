'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageShell from '@/app/components/PageShell';

export default function BracketRedirectPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // This page simply redirects to the correct plural URL
  useEffect(() => {
    router.push(`/tournaments/${id}/bracket`);
  }, [id, router]);

  // Render a simple loading state while redirecting
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent shadow-lg shadow-purple-500/20"></div>
          <p className="ml-4 text-white/70">Redirecting to tournament bracket...</p>
        </div>
      </div>
    </main>
  );
}
