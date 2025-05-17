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
        <div className="relative overflow-hidden bg-neutral-900/95 backdrop-blur-sm px-6 py-3.5 rounded-xl border border-white/10 shadow-lg transition-all duration-300 group-hover:border-purple-500/50">
          {/* Hover gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
          
          {/* Content container */}
          <div className="relative flex items-center space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-5 h-5">
              <svg className="w-full h-full text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Message */}
            <p className="text-white text-sm font-medium tracking-wide">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
