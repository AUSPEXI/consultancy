import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Overview } from '@/components/views/Overview';
import { FactVault } from '@/components/views/FactVault';
import { Competitors } from '@/components/views/Competitors';
import { Technical } from '@/components/views/Technical';
import { Agents } from '@/components/views/Agents';
import { ContentScorer } from '@/components/views/ContentScorer';
import { Simulator } from '@/components/views/Simulator';
import { BrandMonitor } from '@/components/views/BrandMonitor';
import { AuditLogs } from '@/components/views/AuditLogs';
import { Settings } from '@/components/views/Settings';
import { Superuser } from '@/components/views/Superuser';
import { Copilot } from '@/components/Copilot';
import { OnboardingModal } from '@/components/ui/onboarding-modal';
import { useAuth } from '@/contexts/AuthContext';
import { GeoPulse } from '@/components/views/GeoPulse';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userData, loading } = useAuth();

  useEffect(() => {
    const handleVoiceAgentTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: string }>;
      if (customEvent.detail && customEvent.detail.tab) {
        setActiveTab(customEvent.detail.tab);
      }
    };

    window.addEventListener('change-dashboard-tab', handleVoiceAgentTabChange);
    return () => window.removeEventListener('change-dashboard-tab', handleVoiceAgentTabChange);
  }, []);

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'overview': return <Overview />;
        case 'fact-vault': return <FactVault />;
        case 'content-scorer': return <ContentScorer />;
        case 'audit-logs': return <AuditLogs />;
        case 'simulator': return <Simulator />;
        case 'brand-monitor': return <BrandMonitor />;
        case 'geo-pulse': return <GeoPulse />;
        case 'competitors': return <Competitors />;
        case 'technical': return <Technical />;
        case 'agents': return <Agents />;
        case 'superuser': return <Superuser />;
        case 'settings': return <Settings />;
        default: return <Overview />;
      }
    } catch (err) {
      console.error("Dashboard render error:", err);
      return (
        <div className="p-8 bg-red-950/20 border border-red-500/20 rounded-xl text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">View Crashed</h2>
          <p className="text-sm text-red-300">The component failed to render. This might be due to missing data or a runtime error.</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">Reload App</button>
        </div>
      );
    }
  };

  if (loading) {
    return <div className="flex h-screen bg-zinc-950 items-center justify-center text-zinc-400">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden relative">
      {userData && !userData.onboardingCompleted && (
        <OnboardingModal onComplete={() => {}} />
      )}
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      <Copilot activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
