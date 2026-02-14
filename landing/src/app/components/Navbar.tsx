'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import {
  faHome,
  faTrophy,
  faChartBar,
  faShieldAlt,
  faCoins,
  faGavel,
  faHandshake,
  faFileAlt,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: faHome },
    { href: '/tournaments', label: 'Tournaments', icon: faTrophy },
    { href: '/leaderboards', label: 'Leaderboards', icon: faChartBar },
    { href: '/rules', label: 'Rules & Guidelines', icon: faGavel },
    { href: '/contributing', label: 'Contributing', icon: faHandshake },
    { href: '/terms', label: 'Terms & Conditions', icon: faFileAlt },
  ];

  return (
    <nav className="w-64 h-screen flex flex-col justify-between py-8 px-6 fixed top-16 left-0">
      <ul className="flex flex-col items-start space-y-4 text-lg font-medium">
        {navItems.slice(0, 3).map(({ href, label, icon }) => (
          <li
            key={label}
            className={`flex items-center space-x-2 ${
              pathname === href
                ? 'text-[#E5E5E5]'
                : 'text-[#81878C] hover:text-[#E5E5E5]'
            }`}
          >
            <FontAwesomeIcon icon={icon} className="h-5 w-5" />
            <Link href={href}>{label}</Link>
          </li>
        ))}        {/* Clubs - Coming Soon */}
        <li className="flex items-center space-x-2 text-[#81878C] hover:text-[#E5E5E5]">
          <FontAwesomeIcon
            icon={faShieldAlt}
            className="h-5 w-5 text-[#81878C] hover:text-[#81878C]"
          />
          <span className="line-through text-gray-400">Clubs</span>
          <div className="relative group">
            <AiOutlineInfoCircle className="text-[#81878C] ml-2" />
            <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-gray-800 text-white text-xs rounded-lg py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
              Coming Soon
            </span>
          </div>
        </li>        {/* Factions - Coming Soon */}
        <li className="flex items-center space-x-2 text-[#81878C] hover:text-[#E5E5E5]">
          <FontAwesomeIcon
            icon={faUsers}
            className="h-5 w-5 text-[#81878C] hover:text-[#81878C]"
          />
          <span className="line-through text-gray-400">Factions</span>
          <div className="relative group">
            <AiOutlineInfoCircle className="text-[#81878C] ml-2" />
            <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-gray-800 text-white text-xs rounded-lg py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
              Coming Soon
            </span>
          </div>
        </li>

        {/* Betting - Coming Soon */}
        <li className="flex items-center space-x-2 text-[#81878C] hover:text-[#E5E5E5]">
          <FontAwesomeIcon
            icon={faCoins}
            className="h-5 w-5 text-[#81878C] hover:text-[#81878C]"
          />
          <span className="line-through text-gray-400">Betting</span>
          <div className="relative group">
            <AiOutlineInfoCircle className="text-[#81878C] ml-2" />
            <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-gray-800 text-white text-xs rounded-lg py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
              Coming Soon
            </span>
          </div>
        </li>

        <hr className="w-full border-t border-gray-600 my-4" />

        {navItems.slice(3).map(({ href, label, icon }) => (
          <li
            key={label}
            className={`flex items-center space-x-2 ${
              pathname === href
                ? 'text-[#E5E5E5]'
                : 'text-[#81878C] hover:text-[#E5E5E5]'
            }`}
          >
            <FontAwesomeIcon icon={icon} className="h-5 w-5" />
            <Link href={href}>{label}</Link>
          </li>
        ))}
      </ul>

      {/* Logo at bottom */}
      <div className="pb-8">
        <Link href="/">
          <img src="/images/Logotemp.png" alt="Logo" className="w-40 opacity-80 hover:opacity-100 transition-opacity duration-200" />
        </Link>
      </div>
    </nav>
  );
}
