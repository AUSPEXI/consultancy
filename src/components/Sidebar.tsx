import { LayoutDashboard, Database, Radar, Code, Bot, Settings, X, LogOut, Lock, Wrench, PenTool, MonitorPlay, ShieldCheck, Activity, Globe, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { logAuditAction } from '@/lib/audit';

import { UserTier, TIERS, checkTierAccess } from '@/constants/tiers';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { user, logout, tier, role } = useAuth();
  
  const navItems = [
    { id: 'overview', label: 'AI SOV Overview', icon: LayoutDashboard, requiredTier: 'Basic' as UserTier },
    { id: 'geo-pulse', label: 'GEO Pulse Index (Beta)', icon: Activity, requiredTier: 'Premium' as UserTier },
    { id: 'competitors', label: 'Competitor Radar', icon: Radar, requiredTier: 'Medium' as UserTier },
    { id: 'fact-vault', label: 'Fact-Vault', icon: Database, requiredTier: 'Basic' as UserTier },
    { id: 'content-scorer', label: 'Content Scorer', icon: PenTool, requiredTier: 'Basic' as UserTier },
    { id: 'simulator', label: 'SOV Simulator', icon: MonitorPlay, requiredTier: 'Medium' as UserTier },
    { id: 'brand-monitor', label: 'Brand Monitor', icon: Radar, requiredTier: 'Medium' as UserTier },
    { id: 'technical', label: 'Edge & Schema', icon: Code, requiredTier: 'Premium' as UserTier },
    { id: 'agents', label: 'Agent Orchestration', icon: Bot, requiredTier: 'Premium' as UserTier },
    { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck, requiredTier: 'Basic' as UserTier },
    { id: 'settings', label: 'Settings', icon: Settings, requiredTier: 'Basic' as UserTier },
  ];

  const hasAccess = (requiredTier: UserTier) => {
    if (role === 'admin') return true;
    return checkTierAccess(tier, requiredTier);
  };

  const isAdmin = role === 'admin' || user?.email === 'hopiumcalculator@gmail.com';

  const handleTestUpgrade = async (newTier: UserTier) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { tier: newTier }, { merge: true });
      await logAuditAction(user.uid, 'Test Upgrade', { newTier });
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
          const isActive = activeTab === item.id;
          const isLocked = !hasAccess(item.requiredTier as UserTier);
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
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
            </button>
          );
        })}

        {isAdmin && (
          <div className="mt-8 pt-4 border-t border-zinc-800">
            <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5" />
              Admin Tools
            </div>
            <div className="space-y-1 grid grid-cols-1 gap-1">
              {TIERS.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTestUpgrade(t)}
                  className="w-full text-left px-3 py-1.5 rounded-md text-[10px] text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors truncate"
                  title={`Set Tier to ${t}`}
                >
                  Set: {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-1">
        <Link 
          to="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors"
        >
          <Globe className="w-5 h-5 text-pink-500" />
          Back to Website
        </Link>
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('superuser')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              activeTab === 'superuser' 
                ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" 
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            )}
          >
            <ShieldAlert className="w-5 h-5" />
            Superuser Control
          </button>
        )}
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
            activeTab === 'settings' 
              ? "bg-zinc-800 text-white" 
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </button>
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
