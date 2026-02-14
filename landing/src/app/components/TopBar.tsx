'use client';

// Force fresh deployment - Updated TopBar component
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function TopBar() {
  const [user, setUser] = useState<{ displayName: string; profile_picture?: string | null; role?: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch authentication status from the API
    const checkAuth = async () => {
      try {
        console.log('Checking auth status...');
        console.log('Document cookies:', document.cookie);
        console.log('Current domain:', window.location.hostname);
        
        // Try auth token as backup if cookies don't work
        const authToken = localStorage.getItem('authToken');
        console.log('Auth token from storage:', authToken);
        
        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        // Use the Next.js API route instead of direct backend call
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers
        });
        
        console.log('Auth API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Auth API response data:', data);
          
          if (data.isLoggedIn && data.user) {
            setUser({
              displayName: data.user.displayName,
              profile_picture: data.user.profile_picture,
              role: data.user.role
            });
            console.log('TopBar - User role set:', data.user.role);
          } else {
            setUser(null);
          }
        } else {
          console.log('Auth check failed with status:', response.status);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        console.log('Document cookies after error:', document.cookie);
        setUser(null);
      }
    };

    checkAuth();

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
      // Use direct backend call for logout since we need to destroy the session
      await apiRequest('/logout', {
        method: 'POST',
      });

      // Clear user state and auth data
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('justLoggedIn');
      localStorage.removeItem('authToken'); // Clear auth token
      
      // Refresh the page after logging out
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      alert('Logout failed');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-transparent text-white flex justify-between items-center px-6 shadow z-50 border-b border-gray-800">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <img src="/images/Logotemp.png" alt="Logo" className="h-10 w-auto" />
      </Link>

      {/* User profile dropdown (only when user is logged in) */}
      {user ? (
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-3 cursor-pointer px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/10"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <div className="relative">
              <img
                src={user.profile_picture || "/images/default-avatar.png"}
                alt="Profile"
                className="w-9 h-9 rounded-full border-2 border-purple-500/50 object-cover transition-all duration-200 hover:border-purple-400"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-800" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white font-semibold">{user.displayName}</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div
            className={`absolute top-12 right-0 bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg py-2 z-50 w-48 transform opacity-0 scale-95 transition-all duration-200 ${
              isDropdownOpen ? 'opacity-100 scale-100' : 'pointer-events-none'
            }`}
          >
            <Link
              href={`/user/${user.displayName}`}
              className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 transition-colors duration-150"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>
            <Link
              href="/usersettings"
              className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 transition-colors duration-150"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
            <div className="border-t border-gray-700/50 my-1" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-400 hover:bg-white/10 transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      ) : (
        <Link href="/login" className="text-white bg-purple-600 hover:bg-purple-700 font-bold py-2 px-4 rounded-lg transition">
          Login
        </Link>
      )}
    </div>
  );
}
