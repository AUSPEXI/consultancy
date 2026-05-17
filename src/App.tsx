/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from '@/components/views/LandingPage';
import { useAuth } from '@/contexts/AuthContext';
import { VoiceAgentProvider } from '@/contexts/VoiceAgentContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { ScrollToTop } from '@/components/ScrollToTop';
import { FloatingVoiceButton } from '@/components/ui/floating-voice-button';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

// Lazy load route components
const Dashboard = lazy(() => import('@/components/views/Dashboard').then(m => ({ default: m.Dashboard })));
const BlogPage = lazy(() => import('@/components/views/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() => import('@/components/views/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const FAQPage = lazy(() => import('@/components/views/FAQPage').then(m => ({ default: m.FAQPage })));
const VoiceAgentsPage = lazy(() => import('@/components/views/VoiceAgentsPage').then(m => ({ default: m.VoiceAgentsPage })));
const AboutPage = lazy(() => import('@/components/views/AboutPage').then(m => ({ default: m.AboutPage })));
const RoadmapPage = lazy(() => import('@/components/views/RoadmapPage').then(m => ({ default: m.RoadmapPage })));
const InvestorHubPage = lazy(() => import('@/components/views/InvestorHubPage').then(m => ({ default: m.InvestorHubPage })));
const ResourcesPage = lazy(() => import('@/components/views/ResourcesPage').then(m => ({ default: m.ResourcesPage })));
const PrivacyPolicyPage = lazy(() => import('@/components/views/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('@/components/views/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));
const OGPreviewPage = lazy(() => import('@/components/views/OGPreviewPage'));

function LoadingFallback() {
  return (
    <div className="flex h-screen bg-zinc-950 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Syncing Hub...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading, signInWithGoogle } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Fetch embedded schemas injected via Webhook
    const fetchActiveSchema = async () => {
      try {
        const res = await fetch('/api/schema/active');
        if (res.ok) {
          const schemas = await res.json();
          if (schemas && schemas.length > 0) {
            // Remove any previously injected schema tags
            document.querySelectorAll('script[data-auspexi-schema="true"]').forEach(e => e.remove());
            
            // Inject new combined schemas
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-auspexi-schema', 'true');
            // Using Graph structure for multiple schemas
            const graphSchema = {
              "@context": "https://schema.org",
              "@graph": schemas
            };
            script.innerHTML = JSON.stringify(graphSchema);
            document.head.appendChild(script);
          }
        }
      } catch (err) {
        console.error("Failed to load active schemas", err);
      }
    };
    fetchActiveSchema();
  }, [location.pathname]); // Re-run when navigation happens if needed

  useEffect(() => {
    const handleStripeRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const sessionId = urlParams.get('session_id');
      const tier = urlParams.get('tier');

      if (success === 'true' && sessionId && tier) {
        if (!user) {
          // Prompt to login to claim
          alert("Payment successful! Please sign in with Google to link your new dashboard access to your account.");
          await signInWithGoogle();
          return; // The useEffect will re-run once `user` is populated
        }

        try {
          await setDoc(doc(db, 'users', user.uid), { tier }, { merge: true });
          window.history.replaceState({}, document.title, window.location.pathname);
          alert(`Success! Your account has been upgraded to the ${tier} tier.`);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
      }
    };

    handleStripeRedirect();
  }, [user, signInWithGoogle]);

  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <VoiceAgentProvider>
      <ScrollToTop />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage onLoginClick={signInWithGoogle} />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/voice-agents" element={<VoiceAgentsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/investors" element={<InvestorHubPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/og-preview/:slug" element={<OGPreviewPage />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
        </Routes>
      </Suspense>
      {!location.pathname.startsWith('/dashboard') && <FloatingVoiceButton />}
    </VoiceAgentProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
