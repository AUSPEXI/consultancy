'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    console.log('Auspexi Landing Loaded');
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <h1 className="text-white text-4xl font-bold">AUSPEXI SYSTEM ONLINE</h1>
    </div>
  );
}
