// src/app/components/Navbar.tsx
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faTrophy,
  faChartBar,
  faShieldAlt,
  faQuestionCircle,
  faGavel,
  faHandshake,
  faFileAlt,
} from '@fortawesome/free-solid-svg-icons';

export default function Navbar() {
  return (
    <nav className="w-64 h-screen flex flex-col items-start py-8 px-6 space-y-6 fixed top-16 left-0">
      <ul className="flex flex-col items-start space-y-4 text-lg font-medium">
        {/* First Section: Home to Clubs */}
        <li className="flex items-center space-x-2 text-[#E5E5E5] hover:text-[#E5E5E5]">
          <FontAwesomeIcon icon={faHome} className="h-5 w-5" />
          <Link href="/" className="hover:text-[#E5E5E5]">Home</Link>
        </li>
        <li className="flex items-center space-x-2 text-[#81878C] hover:text-[#E5E5E5]">
          <FontAwesomeIcon icon={faTrophy} className="h-5 w-5" />
          <Link href="#" className="hover:text-[#E5E5E5]">Tournaments</Link>
        </li>
        <li className="flex items-center space-x-2 text-[#81878C] hover:text-[#E5E5E5]">
          <FontAwesomeIcon icon={faChartBar} className="h-5 w-5" />
          <Link href="#" className="hover:text-[#E5E5E5]">Leaderboards</Link>
        </li>
        <li className="flex items-center space-x-2 text-[#81878C] hover:text-[#E5E5E5]">
          <FontAwesomeIcon icon={faShieldAlt} className="h-5 w-5" />
          <Link href="#" className="hover:text-[#E5E5E5]">Clubs</Link>
        </li>

        {/* Divider */}
        <hr className="w-full border-t border-gray-600 my-4" />

        {/* Second Section: Miscellaneous to Terms */}
        <li className="flex items-center space-x-2 text-[#81878C] hover:text-[#E5E5E5]">
          <FontAwesomeIcon icon={faGavel} className="h-5 w-5" />
          <Link href="#" className="hover:text-[#E5E5E5]">Rules & Guidelines</Link>
        </li>
        <li className="flex items-center space-x-2 text-[#81878C] hover:text-[#E5E5E5]">
          <FontAwesomeIcon icon={faHandshake} className="h-5 w-5" />
          <Link href="#" className="hover:text-[#E5E5E5]">Contributing</Link>
        </li>
        <li className="flex items-center space-x-2 text-[#81878C] hover:text-[#E5E5E5]">
          <FontAwesomeIcon icon={faFileAlt} className="h-5 w-5" />
          <Link href="#" className="hover:text-[#E5E5E5]">Terms & Conditions</Link>
        </li>
      </ul>
    </nav>
  );
}
