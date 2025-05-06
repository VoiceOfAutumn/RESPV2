'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TopBar() {
  const [user, setUser] = useState<{ displayName: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:3000/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        localStorage.removeItem('user');
        // Refresh the page after logging out
        window.location.reload();
      } else {
        alert('Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
      alert('Logout failed');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-transparent text-white flex justify-between items-center px-6 shadow z-50 border-b border-gray-800">
      {/* Logo on the left */}
      <Link href="/" className="flex items-center space-x-3">
        <img
          src="/images/logo1.png"
          alt="Logo"
          className="h-22" // Adjust size of the logo as necessary
        />
      </Link>

      {/* User profile dropdown (only when user is logged in) */}
      {user ? (
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <img
              src="/images/default-avatar.png"
              alt="Profile"
              className="w-8 h-8 rounded-full border border-gray-700"
            />
            <span className="text-white font-semibold">{user.displayName}</span>
          </div>

          {isDropdownOpen && (
            <div className="absolute top-12 right-0 bg-gray-800 border border-gray-700 rounded-md shadow-md py-2 z-50 w-40 text-sm">
              <Link
                href="/profile"
                className="block px-4 py-2 text-white hover:bg-gray-700"
              >
                My Profile
              </Link>
              <Link
                href="/usersettings"
                className="block px-4 py-2 text-white hover:bg-gray-700"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/login"
          className="text-white bg-purple-600 hover:bg-purple-700 font-bold py-2 px-4 rounded-lg transition"
        >
          Login
        </Link>
      )}
    </div>
  );
}
