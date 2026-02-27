'use client'; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import { useToast } from '../components/ToastContext';
import { apiRequest } from '@/lib/api';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    password: '',
    country_id: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

   // Country list
   const countries = [
    "Mushroom Kingdom",
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Ivory Coast",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Korea, North",
    "Korea, South",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    // Validate that a country is selected
    if (!formData.country_id || formData.country_id.trim() === '') {
      setMessage('❌ Please select a country');
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          country_id: countries.indexOf(formData.country_id) + 1,
        }),
      });

      // Show success toast
      showToast({
        title: 'Registration Successful!',
        message: 'Your account has been created. Please log in to continue.',
        type: 'success'
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 1000);
    } catch (err) {
      console.error('Signup error:', err);
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
        <h2 className="text-4xl font-extrabold text-white tracking-widest uppercase text-center leading-relaxed">
          Compete! Win!<br />Level Up!
        </h2>
      </div>

      {/* Right Side - Signup Form */}
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
            <h1 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name Field */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Display Name
                  <span className="relative group ml-1.5 inline-block">
                    <AiOutlineInfoCircle className="inline text-gray-500 hover:text-gray-300 transition-colors duration-200" />
                    <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded-lg py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10 border border-gray-700/50">
                      3–16 characters: letters, numbers, or underscores only. Cannot be changed later!
                    </span>
                  </span>
                </label>
                <input
                  className="w-full p-3 rounded-lg bg-gray-900/60 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  type="text"
                  name="display_name"
                  placeholder="YourName_123"
                  value={formData.display_name}
                  onChange={handleChange}
                  required
                />
              </div>

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
                <label className="block text-sm text-gray-400 mb-1.5">
                  Password
                  <span className="relative group ml-1.5 inline-block">
                    <AiOutlineInfoCircle className="inline text-gray-500 hover:text-gray-300 transition-colors duration-200" />
                    <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded-lg py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10 border border-gray-700/50">
                      Min 8 characters, one uppercase, one digit or special character
                    </span>
                  </span>
                </label>
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

              {/* Country Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Country</label>
                <select
                  className="w-full p-3 rounded-lg bg-gray-900/60 border border-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  name="country_id"
                  value={formData.country_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map((country, index) => (
                    <option key={index} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              <p className="mt-4 text-center text-gray-400 text-sm">
                Already have an account?{' '}
                <a href="/login" className="text-purple-400 hover:text-purple-300 underline transition-colors duration-200">
                  Log in here
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
