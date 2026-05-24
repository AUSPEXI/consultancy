### Marketplace Scaffold (Feature-Flagged)

Enable preview:
- Set `VITE_FEATURE_MARKETPLACE=1` in Netlify env and redeploy.

UI:
- `Marketplace` tab appears in the dashboard only when the flag is set.
- Component: `src/components/Marketplace/MarketplaceHome.tsx` (lists demo items and links to onboarding).

Functions (rate-limited):
- `/.netlify/functions/marketplace-listings` → returns demo listing JSON; supports `?id=...` for detail.
- `/.netlify/functions/marketplace-onboard` → static HTML with onboarding notes.
- `/.netlify/functions/marketplace-usage` → demo usage snapshot.

Notes:
- No DB changes required for preview. Safe to disable by unsetting the flag; code remains shelfable.
- When ready, add migrations for marketplace tables and switch functions from demo to Supabase-backed queries.


