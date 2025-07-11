'use client'; 

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '../components/ToastContext';
import { apiRequest } from '@/lib/api';

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
      const res = await apiRequest('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        showToast({
          title: 'Login Successful!',
          message: `Welcome back, ${data.user.display_name}!`,
          type: 'success'
        });
        
        // Store the display name before redirecting
        localStorage.setItem('justLoggedIn', data.user.display_name);
        
        // Redirect to homepage after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        const data = await res.json();
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage('❌ Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md border border-purple-500">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email Field */}
          <div className="relative">
            <input
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <input
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-lg shadow-lg font-bold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging In...' : 'Log In'}
          </button>

          <p className="mt-4 text-center text-gray-300 text-sm">
          Don’t have an account?{' '}
          <a href="/signup" className="text-purple-400 hover:text-pink-400 underline">
          Sign up here
         </a>
        </p>
        </form>

        {message && <p className="mt-4 text-center text-white">{message}</p>}
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