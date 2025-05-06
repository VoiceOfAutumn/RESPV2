'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function RetroToast({ message, show, onClose }: { message: string; show: boolean; onClose: () => void }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in bg-black border border-green-400 text-green-300 font-mono p-4 rounded-md shadow-md w-72 relative overflow-hidden">
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_95%,rgba(0,255,0,0.1)_96%)] bg-[length:100%_2px] z-10" />

      {/* Close Button */}
      <button onClick={onClose} className="absolute top-1 right-2 z-20 text-green-400 hover:text-white">
        <X size={16} />
      </button>

      {/* Message */}
      <p className="relative z-20">{message}</p>
    </div>
  );
}
