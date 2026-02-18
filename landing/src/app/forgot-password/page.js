'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../components/ToastContext';
import { API_BASE_URL } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        showToast({
          title: 'Email Sent!',
          message: 'Check your email for password reset instructions.',
          type: 'success'
        });
        setMessage('✅ Password reset email sent! Check your inbox.');
      } else {
        throw new Error(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setMessage(`❌ ${err.message || 'Something went wrong. Please try again.'}`);
      showToast({
        title: 'Error',
        message: err.message || 'Failed to send reset email',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md border border-purple-500">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Forgot Password</h1>

        {!isSuccess ? (
          <>
            <p className="text-gray-300 text-center mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="relative">
                <input
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 text-white py-3 rounded-lg shadow-lg font-bold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="text-green-400 text-6xl mb-4">✓</div>
            <p className="text-gray-300 mb-6">
              We've sent a password reset link to <strong className="text-white">{email}</strong>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Check your email and click the link to reset your password. The link will expire in 1 hour.
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <a 
            href="/login" 
            className="text-gray-400 hover:text-purple-400 underline text-sm"
          >
            ← Back to Login
          </a>
        </div>

        {message && <p className="mt-4 text-center text-white">{message}</p>}
      </div>
    </div>
  );
}
