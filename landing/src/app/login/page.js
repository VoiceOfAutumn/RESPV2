'use client'; 

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '../components/ToastContext';
import { apiRequest, API_BASE_URL } from '@/lib/api';

// Separate component for handling search params
function LoginSuccessHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      showToast({
        title: 'Welcome!',
        message: 'Your account has been created successfully. Please log in below.',
        type: 'success'
      });
      // Clean up the URL parameter
      router.replace('/login');
    }
  }, [searchParams, showToast, router]);

  return null; // This component doesn't render anything
}

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Essential for cookies
        body: JSON.stringify(formData),
      });

      console.log('Raw response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);
      console.log('Set-Cookie header:', response.headers.get('set-cookie'));
      
      const data = await response.json();
      console.log('Login response:', data);
      console.log('Document cookies after login:', document.cookie);

      // Store auth token as backup for cross-origin authentication
      if (data.authToken) {
        localStorage.setItem('authToken', data.authToken);
        console.log('Auth token stored:', data.authToken);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      showToast({
        title: 'Login Successful!',
        message: `Welcome back, ${data.user.display_name}!`,
        type: 'success'
      });
      
      // Store the display name before redirecting
      localStorage.setItem('justLoggedIn', data.user.display_name);
      
      // Force a page reload to ensure session cookies are properly recognized
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      console.error('Login error:', err);
      setMessage(`❌ ${err.message || 'Something went wrong. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-black via-gray-800 to-black">
      {/* Left Side - Logo & Motto */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-12">
        <a href="/">
          <img
            src="/images/Logotemp.png"
            alt="Logo"
            className="w-72 mb-10 opacity-90 hover:opacity-100 transition-opacity duration-300 drop-shadow-lg"
          />
        </a>
        <h2 className="text-4xl font-extrabold text-white tracking-widest uppercase text-center leading-relaxed" style={{ textShadow: '0 0 10px rgba(168, 85, 247, 0.4), 0 4px 8px rgba(0, 0, 0, 0.5)' }}>
          Compete! Win!<br />Level Up!
        </h2>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo (hidden on large screens) */}
          <div className="flex justify-center mb-8 lg:hidden">
            <a href="/">
              <img
                src="/images/Logotemp.png"
                alt="Logo"
                className="w-40 opacity-90"
              />
            </a>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input
                  className="w-full p-3 rounded-lg bg-gray-900/60 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Password</label>
                <input
                  className="w-full p-3 rounded-lg bg-gray-900/60 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging In...' : 'Log In'}
              </button>

              <p className="mt-4 text-center text-gray-400 text-sm">
                {"Don't have an account? "}
                <a href="/signup" className="text-purple-400 hover:text-purple-300 underline transition-colors duration-200">
                  Sign up here
                </a>
              </p>
            </form>

            {message && <p className="mt-4 text-center text-white text-sm">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginSuccessHandler />
      <LoginForm />
    </Suspense>
  );
}
