import { Handler } from "@netlify/functions";
import Stripe from "stripe";

// Accept both STRIPE_SECRET_KEY and VITE_STRIPE_SECRET_KEY for flexibility
const STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY || "";

if (!STRIPE_SECRET_KEY) {
  console.warn("[stripe] Missing STRIPE_SECRET_KEY. Endpoint will return 500.");
}

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : (null as unknown as Stripe);

type CheckoutRequest = {
  priceId: string; // Stripe Price ID
  quantity?: number;
  mode?: "payment" | "subscription";
  customer_email?: string;
  success_url?: string; // full URL
  cancel_url?: string; // full URL
  metadata?: Record<string, string>;
};

export const handler: Handler = async (event) => {
  try {
    if (!stripe) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Stripe not configured" }),
      };
    }

    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body: CheckoutRequest = JSON.parse(event.body || "{}");
    if (!body.priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: "priceId required" }) };
    }

    const mode = body.mode || "payment";
    const quantity = body.quantity && body.quantity > 0 ? body.quantity : 1;
    const success_url =
      body.success_url || `${event.headers.origin || "https://example.com"}/billing/success`;
    const cancel_url =
      body.cancel_url || `${event.headers.origin || "https://example.com"}/billing/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [
        {
          price: body.priceId,
          quantity,
        },
      ],
      customer_email: body.customer_email,
      success_url,
      cancel_url,
      metadata: body.metadata,
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err: any) {
    console.error("[stripe] create-checkout-session error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || "Internal error" }),
    };
  }
};


