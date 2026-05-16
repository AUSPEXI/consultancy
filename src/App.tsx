/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from '@/components/views/LandingPage';
import { Dashboard } from '@/components/views/Dashboard';
import { BlogPage } from '@/components/views/BlogPage';
import { BlogPostPage } from '@/components/views/BlogPostPage';
import OGPreviewPage from '@/components/views/OGPreviewPage';
import { FAQPage } from '@/components/views/FAQPage';
import { VoiceAgentsPage } from '@/components/views/VoiceAgentsPage';
import { AboutPage } from '@/components/views/AboutPage';
import { RoadmapPage } from '@/components/views/RoadmapPage';
import { InvestorHubPage } from '@/components/views/InvestorHubPage';
import { ResourcesPage } from '@/components/views/ResourcesPage';
import { PrivacyPolicyPage } from '@/components/views/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/components/views/TermsOfServicePage';
import { useAuth } from '@/contexts/AuthContext';
import { VoiceAgentProvider } from '@/contexts/VoiceAgentContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { ScrollToTop } from '@/components/ScrollToTop';
import { FloatingVoiceButton } from '@/components/ui/floating-voice-button';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

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
