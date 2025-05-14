'use client'; 

import { useState } from 'react';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });      const data = await res.json();      if (res.status === 200) {
        setMessage('✅ Login successful!');
        // Store the display name before redirecting
        localStorage.setItem('justLoggedIn', data.display_name);
        window.location.href = '/'; // 🔁 Redirect to homepage
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Something went wrong.');
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
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-lg shadow-lg font-bold transition duration-300"
          >
            Log In
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