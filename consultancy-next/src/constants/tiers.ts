/**
 * Canonical subscription tiers — the single source of truth.
 *
 * These match the public pricing page exactly:
 *   Starter  $149/mo
 *   Pro      $499/mo
 *   Business $1,899/mo
 *
 * `Free` is the signed-up-but-unpaid state. Legacy tier names (Basic, Medium,
 * Premium, Enterprise, PipelineOffer) still exist in Firestore documents and in
 * historical Stripe records — `normalizeTier()` maps them onto the canonical set
 * so nothing breaks on read. Always normalize before comparing or displaying.
 */
export type UserTier = 'Free' | 'Starter' | 'Pro' | 'Business';

export const TIERS: UserTier[] = ['Free', 'Starter', 'Pro', 'Business'];

/** Monthly price in USD cents, keyed by canonical tier. */
export const TIER_PRICES: Record<Exclude<UserTier, 'Free'>, number> = {
  Starter: 14900,   // $149
  Pro: 49900,       // $499
  Business: 189900, // $1,899
};

/**
 * Maps any legacy or canonical tier string onto a canonical tier.
 * Mapping (per the 3-tier consolidation):
 *   Basic        → Starter   ($149)
 *   Medium       → Pro        (was a mid-gate, now folded into Pro)
 *   Pro          → Pro
 *   Premium      → Pro        ($499 — Stripe historically labelled $499 as Premium)
 *   PipelineOffer→ Pro        (legacy $499 subscription offer)
 *   Enterprise   → Business   (custom/top tier)
 *   Business     → Business
 */
const LEGACY_TIER_MAP: Record<string, UserTier> = {
  Free: 'Free',
  Basic: 'Starter',
  Starter: 'Starter',
  Medium: 'Pro',
  Pro: 'Pro',
  Premium: 'Pro',
  PipelineOffer: 'Pro',
  Business: 'Business',
  Enterprise: 'Business',
};

export const normalizeTier = (tier: string | null | undefined): UserTier => {
  if (!tier) return 'Free';
  return LEGACY_TIER_MAP[tier] ?? 'Free';
};

/**
 * Returns true if the user's tier meets or exceeds the required tier.
 * Both arguments are normalized first, so legacy names compare correctly.
 * Higher index in TIERS means higher access.
 */
export const checkTierAccess = (currentTier: string | null | undefined, requiredTier: string | null | undefined): boolean => {
  const currentIndex = TIERS.indexOf(normalizeTier(currentTier));
  const requiredIndex = TIERS.indexOf(normalizeTier(requiredTier));
  return currentIndex >= requiredIndex;
};
