'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function Toast({ title, message, type }: ToastProps) {
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }[type];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg`}>
        <h4 className="font-bold">{title}</h4>
        <p>{message}</p>
      </div>
    </div>
  );
}
