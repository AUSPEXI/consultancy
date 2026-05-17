'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
// Assuming OnboardingView is in src/components/views/OnboardingView.tsx
// But wait, the list didn't show OnboardingView.tsx. It's likely a modal or part of another view.
// Checking Sidebar.tsx or App.tsx... ah, App.tsx had no /onboarding route, it was handled in Dashboard as a modal.
// Lines 78 in Dashboard.tsx: {userData && !userData.onboardingCompleted && <OnboardingModal onComplete={() => {}} />}

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) return null;

  // Since onboarding was a modal in the legacy app, we can redirect to dashboard
  // or create a dedicated page if preferred. For now, it stays as a modal in Dashboard.
  router.push("/dashboard");
  return null;
}
