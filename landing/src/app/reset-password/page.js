'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '../components/ToastContext';

function ResetPasswordForm() {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setMessage('❌ Invalid reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('❌ Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage('❌ Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[\d!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      setMessage('❌ Password must contain at least one uppercase letter and one digit or special character');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://backend-6wqj.onrender.com'}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          title: 'Success!',
          message: 'Your password has been reset successfully.',
          type: 'success'
        });
        
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        
        setMessage('✅ Password reset successfully! Redirecting to login...');
      } else {
        throw new Error(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setMessage(`❌ ${err.message || 'Something went wrong. Please try again.'}`);
      showToast({
        title: 'Error',
        message: err.message || 'Failed to reset password',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md border border-red-500">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Invalid Reset Link</h1>
          <p className="text-gray-300 text-center mb-6">
            This reset link is invalid or has expired. Please request a new password reset.
          </p>
          <div className="text-center">
            <a 
              href="/forgot-password" 
              className="text-purple-400 hover:text-pink-400 underline"
            >
              Request New Reset Link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-md border border-purple-500">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Reset Password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password Field */}
          <div className="relative">
            <input
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
          </div>

          {/* Confirm Password Field */}
          <div className="relative">
            <input
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="text-gray-400 text-xs">
            Password must be at least 8 characters long and contain at least one uppercase letter and one digit or special character.
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 text-white py-3 rounded-lg shadow-lg font-bold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
