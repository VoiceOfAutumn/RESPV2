'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

const Toast = ({ message, duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="relative group">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-xl rounded-xl"></div>
        
        {/* Main toast container */}
        <div className="relative overflow-hidden bg-neutral-900/95 backdrop-blur px-6 py-4 rounded-xl border border-purple-500/50">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Top gradient line */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500 to-purple-500"></div>
          
          {/* Bottom gradient line */}
          <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-pink-500"></div>
          
          {/* Left gradient line */}
          <div className="absolute left-0 inset-y-0 w-[1px] bg-gradient-to-b from-pink-500/50 via-purple-500/50 to-pink-500/50"></div>
          
          {/* Right gradient line */}
          <div className="absolute right-0 inset-y-0 w-[1px] bg-gradient-to-b from-purple-500/50 via-pink-500/50 to-purple-500/50"></div>

          {/* Content container */}
          <div className="relative flex items-center space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-5 h-5">
              <svg className="w-full h-full text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Message */}
            <p className="text-white font-press-start text-sm py-0.5">
              {message}
            </p>
          </div>
        </div>

        {/* Corner accents */}
        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-pink-500/50 rounded-tl"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-purple-500/50 rounded-tr"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-purple-500/50 rounded-bl"></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-pink-500/50 rounded-br"></div>
      </div>
    </div>
  );
};

export default Toast;
