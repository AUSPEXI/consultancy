import { useState, useEffect, lazy, Suspense } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Copilot } from '@/components/Copilot';
import { OnboardingModal } from '@/components/ui/onboarding-modal';
import { motion, AnimatePresence } from 'motion/react';

// Lazy load view components
const Overview = lazy(() => import('@/components/views/Overview').then(m => ({ default: m.Overview })));
const FactVault = lazy(() => import('@/components/views/FactVault').then(m => ({ default: m.FactVault })));
const Competitors = lazy(() => import('@/components/views/Competitors').then(m => ({ default: m.Competitors })));
const Technical = lazy(() => import('@/components/views/Technical').then(m => ({ default: m.Technical })));
const Agents = lazy(() => import('@/components/views/Agents').then(m => ({ default: m.Agents })));
const ContentScorer = lazy(() => import('@/components/views/ContentScorer').then(m => ({ default: m.ContentScorer })));
const Simulator = lazy(() => import('@/components/views/Simulator').then(m => ({ default: m.Simulator })));
const BrandMonitor = lazy(() => import('@/components/views/BrandMonitor').then(m => ({ default: m.BrandMonitor })));
const AuditLogs = lazy(() => import('@/components/views/AuditLogs').then(m => ({ default: m.AuditLogs })));
const Settings = lazy(() => import('@/components/views/Settings').then(m => ({ default: m.Settings })));
const Superuser = lazy(() => import('@/components/views/Superuser').then(m => ({ default: m.Superuser })));
const GeoPulse = lazy(() => import('@/components/views/GeoPulse').then(m => ({ default: m.GeoPulse })));

function ViewLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
      <p className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.2em] animate-pulse">Neural Pathing...</p>
    </div>
  );
}

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
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden relative">
      <AnimatePresence>
        {userData && !userData.onboardingCompleted && (
          <OnboardingModal onComplete={() => {}} />
        )}
      </AnimatePresence>
      
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
            <Suspense fallback={<ViewLoader />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </main>
      </div>

      <Copilot activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
