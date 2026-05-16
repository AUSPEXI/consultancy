/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/components/views/LandingPage';
import { Dashboard } from '@/components/views/Dashboard';
import { BlogPage } from '@/components/views/BlogPage';
import { BlogPostPage } from '@/components/views/BlogPostPage';
import { FAQPage } from '@/components/views/FAQPage';
import { VoiceAgentsPage } from '@/components/views/VoiceAgentsPage';
import { AboutPage } from '@/components/views/AboutPage';
import { ResourcesPage } from '@/components/views/ResourcesPage';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { ScrollToTop } from '@/components/ScrollToTop';
import { FloatingVoiceButton } from '@/components/ui/floating-voice-button';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

export default function App() {
  const { user, loading, signInWithGoogle } = useAuth();

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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={!user ? <LandingPage onLoginClick={signInWithGoogle} /> : <Navigate to="/dashboard" />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/voice-agents" element={<VoiceAgentsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
      </Routes>
      <FloatingVoiceButton />
    </Router>
  );
}
