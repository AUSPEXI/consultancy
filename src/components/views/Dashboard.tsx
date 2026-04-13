import { useState } from 'react';
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
import { Copilot } from '@/components/Copilot';
import { OnboardingModal } from '@/components/ui/onboarding-modal';
import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userData, loading } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <Overview />;
      case 'fact-vault': return <FactVault />;
      case 'content-scorer': return <ContentScorer />;
      case 'audit-logs': return <AuditLogs />;
      case 'simulator': return <Simulator />;
      case 'brand-monitor': return <BrandMonitor />;
      case 'competitors': return <Competitors />;
      case 'technical': return <Technical />;
      case 'agents': return <Agents />;
      default: return <Overview />;
    }
  };

  if (loading) {
    return <div className="flex h-screen bg-zinc-950 items-center justify-center text-zinc-400">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden relative">
      {userData && userData.onboardingCompleted === false && (
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
