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

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <Overview />;
      case 'fact-vault': return <FactVault />;
      case 'content-scorer': return <ContentScorer />;
      case 'simulator': return <Simulator />;
      case 'brand-monitor': return <BrandMonitor />;
      case 'competitors': return <Competitors />;
      case 'technical': return <Technical />;
      case 'agents': return <Agents />;
      default: return <Overview />;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden">
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
    </div>
  );
}
