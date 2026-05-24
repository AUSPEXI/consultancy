export type Entitlement = {
  stripe_price: string;
  quantity: number;
  subscription_id: string | null;
  active: boolean;
  updated_at: string;
};

export async function getEntitlements(params: { email?: string; stripeCustomer?: string }) {
  const qs = new URLSearchParams();
  if (params.email) qs.set("email", params.email);
  if (params.stripeCustomer) qs.set("stripe_customer", params.stripeCustomer);
  const res = await fetch(`/api/entitlements?${qs.toString()}`, {
    method: "GET",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to fetch entitlements: ${t}`);
  }
  const data = (await res.json()) as { entitlements: Entitlement[] };
  return data.entitlements || [];
}

export function hasPlatformAccess(entitlements: Entitlement[], priceIds: string[]): boolean {
  const set = new Set(priceIds);
  return entitlements.some((e) => e.active && set.has(e.stripe_price));
}


