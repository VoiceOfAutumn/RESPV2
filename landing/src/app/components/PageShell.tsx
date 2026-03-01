'use client';

import { useState } from 'react';
import TopBar from './TopBar';
import Navbar from './Navbar';

export default function PageShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <TopBar onMenuToggle={() => setMobileNavOpen(prev => !prev)} />
      <Navbar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
