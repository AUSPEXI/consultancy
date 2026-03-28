import { Bell, Search, Zap, Menu, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, tier } = useAuth();
  
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 text-zinc-400">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-1 hover:text-zinc-200 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <Search className="w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search facts, competitors, or alerts..." 
            className="bg-transparent border-none focus:outline-none text-sm w-48 md:w-64 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
          <Shield className="w-3.5 h-3.5" />
          {tier} Tier
        </div>
        {tier === 'Premium' && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
            <Zap className="w-3.5 h-3.5" />
            Edge Worker Active
          </div>
        )}
        <button className="relative text-zinc-400 hover:text-zinc-200 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-medium text-zinc-300 overflow-hidden">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            getInitials(user?.displayName)
          )}
        </div>
      </div>
    </header>
  );
}
