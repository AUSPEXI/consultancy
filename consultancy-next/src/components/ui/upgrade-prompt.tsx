'use client'

import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier } from '@/constants/tiers';

interface UpgradePromptProps {
  title: string;
  description: string;
  requiredTier: UserTier;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ title, description, requiredTier }) => {
  const { tier, role, user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);

  if (role === 'admin') return null;

  const handleUpgrade = async () => {
    if (!user) return;
    try {
      setIsCheckingOut(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: requiredTier, userId: user.uid }),
      });
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert('Failed to initiate checkout. Please try again.');
      }
    } catch {
      alert('An error occurred during checkout.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-zinc-800 rounded-xl bg-zinc-900/50">
      <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-zinc-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-zinc-400 max-w-md mb-8">{description}</p>
      <div className="flex flex-col items-center gap-4">
        <div className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
          Requires {requiredTier} Tier
        </div>
        <Button
          onClick={handleUpgrade}
          disabled={isCheckingOut}
          className="bg-pink-600 hover:bg-pink-700 text-white px-8"
        >
          {isCheckingOut ? 'Redirecting...' : `Upgrade to ${requiredTier}`}
        </Button>
        <p className="text-xs text-zinc-500 mt-2">
          Cancel anytime after your first month. No long-term contracts.
        </p>
      </div>
    </div>
  );
};
