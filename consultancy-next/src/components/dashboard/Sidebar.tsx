'use client'

import { LayoutDashboard, Database, Radar, Code, Bot, Settings, X, LogOut, Lock, PenTool, MonitorPlay, ShieldCheck, Activity, Globe, ShieldAlert, Zap, RefreshCw, Building2, Layers3, Target, CheckCircle2, FlaskConical, Beaker } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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

  const [workflowDone, setWorkflowDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    const read = () => {
      try {
        const stored = localStorage.getItem('geo_workflow_progress');
        if (stored) {
          const p = JSON.parse(stored) as Record<string, boolean>;
          setWorkflowDone(new Set(Object.keys(p).filter(k => p[k])));
        }
      } catch {}
    };
    read();
    window.addEventListener('storage', read);
    // Refresh on route changes (pathname changes trigger re-render anyway)
    return () => window.removeEventListener('storage', read);
  }, [pathname]);

  // QUEST_STEPS drives the progress bar denominator — keep in sync when steps change.
  const QUEST_STEPS = 6;

  // Sidebar groups reflect the GEO quest workflow order
  const navGroups = [
    {
      label: 'THE QUEST',
      items: [
        { id: 'cite-probe',     label: 'Citation Probe',   icon: Zap,     requiredTier: 'Starter' as UserTier, path: '/dashboard/cite-probe',     step: '1', wfKey: 'step1' },
        { id: 'fact-vault',     label: 'Fact Vault',       icon: Database,requiredTier: 'Starter' as UserTier, path: '/dashboard/fact-vault',     step: '2', wfKey: 'step2' },
        { id: 'agents',         label: 'Content Pipeline', icon: Bot,     requiredTier: 'Pro'     as UserTier, path: '/dashboard/agents',         step: '3', wfKey: 'step3' },
        { id: 'content-scorer', label: 'Score & Refine',   icon: PenTool, requiredTier: 'Starter' as UserTier, path: '/dashboard/content-scorer', step: '4', wfKey: 'step4' },
        { id: 'technical',      label: 'Schema Engine',    icon: Code,    requiredTier: 'Pro'     as UserTier, path: '/dashboard/technical',      step: '5', wfKey: 'step5' },
        { id: 'schema-deploy',  label: 'Deploy',           icon: Layers3, requiredTier: 'Pro'     as UserTier, path: '/dashboard/schema-deploy',  step: '6', wfKey: 'step6' },
      ],
    },
    {
      label: 'COMMAND CENTRE',
      items: [
        { id: 'overview',  label: 'SOV Overview',  icon: LayoutDashboard, requiredTier: 'Starter' as UserTier, path: '/dashboard/overview' },
        { id: 'geo-pulse', label: 'GEO Pulse',     icon: Activity,        requiredTier: 'Pro'     as UserTier, path: '/dashboard/geo-pulse' },
        { id: 'autopilot', label: 'GEO Autopilot', icon: RefreshCw,       requiredTier: 'Pro'     as UserTier, path: '/dashboard/autopilot' },
      ],
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { id: 'competitors',   label: 'Competitor Radar', icon: Radar,       requiredTier: 'Pro' as UserTier, path: '/dashboard/competitors' },
        { id: 'brand-monitor', label: 'Brand Monitor',    icon: Target,      requiredTier: 'Pro' as UserTier, path: '/dashboard/brand-monitor' },
        { id: 'simulator',     label: 'SOV Simulator',    icon: MonitorPlay, requiredTier: 'Pro' as UserTier, path: '/dashboard/simulator' },
      ],
    },
    {
      label: 'ENTITY & SCHEMA',
      items: [
        { id: 'entity-hub', label: 'Entity Hub', icon: Building2, requiredTier: 'Pro' as UserTier, path: '/dashboard/entity-hub' },
      ],
    },
    {
      label: 'RESEARCH',
      items: [
        { id: 'geo-lab', label: 'GEO Lab Results', icon: FlaskConical, requiredTier: 'Pro' as UserTier, path: '/dashboard/geo-lab' },
        { id: 'experiments', label: 'Citability Lab', icon: Beaker, requiredTier: 'Pro' as UserTier, path: '/dashboard/experiments' },
      ],
    },
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
            <img src="/l8entspace-logo.svg" alt="L8EntSpace Logo" className="w-14 h-14 object-contain shrink-0" />
            <span className="text-2xl font-semibold text-white tracking-tight">L8<span className="text-pink-500">Ent</span>Space</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 mt-4 overflow-y-auto overflow-x-hidden space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-1 flex items-center justify-between">
                <p className="text-[9px] font-black tracking-[0.2em] text-zinc-600 uppercase">
                  {group.label}
                </p>
                {group.label === 'THE QUEST' && (
                  <span className="text-[9px] text-zinc-600">
                    {workflowDone.size}/{QUEST_STEPS}
                  </span>
                )}
              </div>
              {group.label === 'THE QUEST' && (
                <div className="mx-3 mb-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${(workflowDone.size / QUEST_STEPS) * 100}%` }}
                  />
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                  const isLocked = !hasAccess(item.requiredTier as UserTier);
                  const step = (item as any).step;
                  const wfKey = (item as any).wfKey as string | undefined;
                  const isComplete = wfKey ? workflowDone.has(wfKey) : false;
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors group",
                        isActive
                          ? "bg-zinc-800 text-white"
                          : isComplete
                          ? "text-emerald-400/70 hover:bg-zinc-800/50 hover:text-emerald-300"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {step ? (
                          isComplete && !isActive ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <span className={cn(
                              "w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center flex-shrink-0",
                              isActive ? "bg-pink-500 text-white" : "bg-zinc-800 text-zinc-500"
                            )}>{step}</span>
                          )
                        ) : (
                          <Icon className="w-5 h-5 flex-shrink-0" />
                        )}
                        {item.label}
                      </div>
                      {isLocked && <Lock className="w-3.5 h-3.5 text-zinc-500" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
            href="/dashboard/audit-logs"
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              pathname.includes('/dashboard/audit-logs')
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            )}
          >
            <ShieldCheck className="w-5 h-5" />
            Audit Logs
          </Link>
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
