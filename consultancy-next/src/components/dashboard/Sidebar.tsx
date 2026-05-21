'use client'

import { LayoutDashboard, Database, Radar, Code, Bot, Settings, X, LogOut, Lock, Wrench, PenTool, MonitorPlay, ShieldCheck, Activity, Globe, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

import { UserTier, TIERS, checkTierAccess } from '@/constants/tiers';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user, logout, tier } = useAuth();
  const pathname = usePathname();

  // Derive role from email since Next.js AuthContext doesn't expose role directly
  const isAdmin = user?.email === 'hopiumcalculator@gmail.com';
  const role = isAdmin ? 'admin' : 'user';

  const navItems = [
    { id: 'overview', label: 'AI SOV Overview', icon: LayoutDashboard, requiredTier: 'Basic' as UserTier, path: '/dashboard/overview' },
    { id: 'geo-pulse', label: 'GEO Pulse Index (Beta)', icon: Activity, requiredTier: 'Premium' as UserTier, path: '/dashboard/geo-pulse' },
    { id: 'competitors', label: 'Competitor Radar', icon: Radar, requiredTier: 'Medium' as UserTier, path: '/dashboard/competitors' },
    { id: 'fact-vault', label: 'Fact-Vault', icon: Database, requiredTier: 'Basic' as UserTier, path: '/dashboard/fact-vault' },
    { id: 'content-scorer', label: 'Content Scorer', icon: PenTool, requiredTier: 'Basic' as UserTier, path: '/dashboard/content-scorer' },
    { id: 'simulator', label: 'SOV Simulator', icon: MonitorPlay, requiredTier: 'Medium' as UserTier, path: '/dashboard/simulator' },
    { id: 'brand-monitor', label: 'Brand Monitor', icon: Radar, requiredTier: 'Medium' as UserTier, path: '/dashboard/brand-monitor' },
    { id: 'technical', label: 'Edge & Schema', icon: Code, requiredTier: 'Premium' as UserTier, path: '/dashboard/technical' },
    { id: 'agents', label: 'Multi-Agent Crawler', icon: Bot, requiredTier: 'Premium' as UserTier, path: '/dashboard/agents' },
    { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck, requiredTier: 'Basic' as UserTier, path: '/dashboard/audit-logs' },
    { id: 'settings', label: 'Settings', icon: Settings, requiredTier: 'Basic' as UserTier, path: '/dashboard/settings' },
  ];

  const hasAccess = (requiredTier: UserTier) => {
    if (role === 'admin') return true;
    return checkTierAccess(tier as UserTier, requiredTier);
  };

  const handleTestUpgrade = async (newTier: UserTier) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { tier: newTier }, { merge: true });
      alert(`Test Upgrade: Tier set to ${newTier}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 h-screen flex flex-col text-zinc-300 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/auspexi-logo.png" alt="Auspexi Logo" className="w-14 h-14 object-contain shrink-0" />
            <span className="text-2xl font-semibold text-white tracking-tight">Auspexi</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.includes(item.path);
            const isLocked = !hasAccess(item.requiredTier as UserTier);
            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  {item.label}
                </div>
                {isLocked && <Lock className="w-3.5 h-3.5 text-zinc-500" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-3">
          {/* Tier Status Indicator / Switcher for Admins */}
          <div className="px-3 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Tier</span>
              {isAdmin && <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">Admin Mode</span>}
            </div>
            <div className="flex flex-wrap gap-1">
              {isAdmin ? (
                 <div className="grid grid-cols-2 gap-1 w-full mt-1">
                   {TIERS.map((t) => (
                     <button
                       key={t}
                       onClick={() => handleTestUpgrade(t)}
                       className={cn(
                         "px-2 py-1 rounded text-[9px] font-bold uppercase transition-all",
                         tier === t
                           ? "bg-pink-600 text-white"
                           : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                       )}
                     >
                       {t}
                     </button>
                   ))}
                 </div>
              ) : (
                <span className="text-sm font-bold text-white">{tier}</span>
              )}
            </div>
          </div>
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors"
          >
            <Globe className="w-5 h-5 text-pink-500" />
            Back to Website
          </Link>
          {isAdmin && (
            <Link
              href="/dashboard/superuser"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                pathname.includes('/dashboard/superuser')
                  ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <ShieldAlert className="w-5 h-5" />
              Superuser Control
            </Link>
          )}
          <Link
            href="/dashboard/settings"
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              pathname.includes('/dashboard/settings')
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            )}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
