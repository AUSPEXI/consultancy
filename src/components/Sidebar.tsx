import { LayoutDashboard, Database, Radar, Code, Bot, Settings, X, LogOut, Lock, Wrench, PenTool, MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { user, logout, tier } = useAuth();
  
  const navItems = [
    { id: 'overview', label: 'AI SOV Overview', icon: LayoutDashboard, requiredTier: 'Basic' },
    { id: 'fact-vault', label: 'Fact-Vault', icon: Database, requiredTier: 'Basic' },
    { id: 'content-scorer', label: 'Content Scorer', icon: PenTool, requiredTier: 'Basic' },
    { id: 'simulator', label: 'SOV Simulator', icon: MonitorPlay, requiredTier: 'Medium' },
    { id: 'brand-monitor', label: 'Brand Monitor', icon: Radar, requiredTier: 'Medium' },
    { id: 'competitors', label: 'Competitor Radar', icon: Radar, requiredTier: 'Medium' },
    { id: 'technical', label: 'Edge & Schema', icon: Code, requiredTier: 'Premium' },
    { id: 'agents', label: 'Agent Orchestration', icon: Bot, requiredTier: 'Premium' },
  ];

  const hasAccess = (requiredTier: string) => {
    const tiers = ['Free', 'Basic', 'Medium', 'Premium', 'LifetimeDeal'];
    const userTierIndex = tiers.indexOf(tier || 'Free');
    const requiredTierIndex = tiers.indexOf(requiredTier);
    return userTierIndex >= requiredTierIndex;
  };

  const isAdmin = user?.email === 'hopiumcalculator@gmail.com';

  const handleTestUpgrade = async (newTier: string) => {
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
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
              A
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">Auspexi</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLocked = !hasAccess(item.requiredTier);
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
            <div className="space-y-1">
              {['Free', 'Basic', 'Medium', 'Premium', 'LifetimeDeal'].map((t) => (
                <button
                  key={t}
                  onClick={() => handleTestUpgrade(t)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors"
                >
                  Set Tier: {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors">
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
