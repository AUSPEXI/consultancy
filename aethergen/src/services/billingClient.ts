export type CheckoutOptions = {
  mode?: "payment" | "subscription";
  quantity?: number;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
};

export async function startStripeCheckout(priceId: string, options: CheckoutOptions = {}) {
  const res = await fetch("/api/stripe/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      priceId,
      mode: options.mode || "subscription",
      quantity: options.quantity || 1,
      customer_email: options.customerEmail,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: options.metadata,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Checkout failed: ${txt}`);
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("No checkout URL returned");
  window.location.href = data.url;
}


