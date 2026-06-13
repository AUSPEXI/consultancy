'use client'

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { ErrorBoundary } from '@/components/dashboard/ErrorBoundary';

const Copilot = dynamic(() => import('@/components/dashboard/Copilot').then(m => ({ default: m.Copilot })), { ssr: false });

// Dev-only convenience — inert in production builds regardless of env var.
const ADMIN_BYPASS = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ADMIN_BYPASS === 'true';

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
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Only redirect to sign-in if user is not on the sign-in page itself.
  // Previously redirected to '/' creating an infinite loop: landing → /dashboard → redirect → landing.
  useEffect(() => {
    if (!loading && !user && !ADMIN_BYPASS && pathname !== '/dashboard') {
      router.replace('/dashboard');
    }
  }, [user, loading, router, pathname]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, []);

  // During auth loading, always show skeleton.
  // When unauthenticated and NOT on the sign-in page, show skeleton (redirect fires above).
  // When unauthenticated and ON the sign-in page, render children (the sign-in form).
  if (loading || (!user && !ADMIN_BYPASS && pathname !== '/dashboard')) {
    return <DashboardSkeleton />;
  }

  // Sign-in page: render without sidebar/header chrome
  if (!user && !ADMIN_BYPASS && pathname === '/dashboard') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden relative">
      {ADMIN_BYPASS && typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-xs font-bold text-center py-1 tracking-widest uppercase">
          Dev bypass active. Not visible in production.
        </div>
      )}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${ADMIN_BYPASS && typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'pt-6' : ''}`}>
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
      <ErrorBoundary fallback={null}><Copilot /></ErrorBoundary>
    </div>
  );
}
