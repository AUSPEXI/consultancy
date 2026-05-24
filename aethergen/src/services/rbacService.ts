export type Role = 'viewer' | 'developer' | 'team' | 'enterprise' | 'admin';

export type Permission =
  | 'view_overview'
  | 'use_generator'
  | 'design_schema'
  | 'manage_pipelines'
  | 'run_privacy'
  | 'view_risk'
  | 'view_billing'
  | 'manage_settings';

const ROLE_PERMS: Record<Role, Permission[]> = {
  viewer: ['view_overview'],
  developer: ['view_overview', 'use_generator', 'design_schema', 'view_billing'],
  team: ['view_overview', 'use_generator', 'design_schema', 'manage_pipelines', 'run_privacy', 'view_billing'],
  enterprise: ['view_overview', 'use_generator', 'design_schema', 'manage_pipelines', 'run_privacy', 'view_risk', 'view_billing', 'manage_settings'],
  admin: ['view_overview', 'use_generator', 'design_schema', 'manage_pipelines', 'run_privacy', 'view_risk', 'view_billing', 'manage_settings']
};

// Map Stripe price IDs to roles (env-driven)
const env = import.meta.env as any;
const PRICE_TO_ROLE: Array<{ envKey: string; role: Role }> = [
  { envKey: 'VITE_PRICE_DEVHUB', role: 'developer' },
  { envKey: 'VITE_PRICE_DEVHUB_PRO', role: 'developer' },
  { envKey: 'VITE_PRICE_TEAM', role: 'team' },
  { envKey: 'VITE_PRICE_ENTERPRISE', role: 'enterprise' }
];

export function entitlementsToRole(entPrices: string[]): Role {
  const priceSet = new Set(entPrices);
  for (const map of PRICE_TO_ROLE) {
    const price = env[map.envKey];
    if (typeof price === 'string' && price && priceSet.has(price)) return map.role;
  }
  return 'viewer';
}

export function roleHas(role: Role, perm: Permission): boolean {
  return ROLE_PERMS[role].includes(perm);
}



