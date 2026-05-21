export type UserTier = 'Free' | 'Basic' | 'Medium' | 'Pro' | 'Business' | 'Enterprise' | 'Premium' | 'PipelineOffer';

export const TIERS: UserTier[] = [
  'Free',
  'Basic',
  'Medium',
  'Pro',
  'Business',
  'Enterprise',
  'Premium',
  'PipelineOffer'
];

/**
 * Returns true if the user tier meets or exceeds the required tier.
 * Higher index in TIERS array means higher access.
 */
export const checkTierAccess = (currentTier: UserTier, requiredTier: UserTier): boolean => {
  const currentIndex = TIERS.indexOf(currentTier);
  const requiredIndex = TIERS.indexOf(requiredTier);
  return currentIndex >= requiredIndex;
};
