'use client'

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

const Copilot = dynamic(() => import('@/components/dashboard/Copilot').then(m => ({ default: m.Copilot })), { ssr: false });

function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 h-screen shrink-0 animate-pulse">
        <div className="p-6 flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg bg-zinc-800" />
          <div className="h-5 w-20 bg-zinc-800 rounded" />
        </div>
        <div className="flex-1 px-4 space-y-2 mt-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-10 bg-zinc-800/50 rounded-md" />
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="h-16 bg-zinc-950 border-b border-zinc-800 animate-pulse" />
        <div className="flex-1 p-4 md:p-8 space-y-6 animate-pulse overflow-hidden">
          <div className="h-8 bg-zinc-800 rounded w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-zinc-800/60 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-zinc-800/60 rounded-xl" />
            <div className="h-64 bg-zinc-800/60 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, []);

  // Show full skeleton immediately — feels instant, replaces the blank/spinner gap
  if (loading || !user) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <Copilot />
    </div>
  );
}
