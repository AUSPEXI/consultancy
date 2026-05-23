import { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || process.env.VITE_STRIPE_WEBHOOK_SECRET || "";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.VITE_SUPABASE_DATABASE_URL ||
  "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : (null as unknown as Stripe);

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export const handler: Handler = async (event) => {
  try {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      return { statusCode: 500, body: JSON.stringify({ error: "Stripe not configured" }) };
    }

    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const signature = event.headers["stripe-signature"] as string;
    if (!signature) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing stripe-signature" }) };
    }

    const buf = Buffer.from(event.body || "", "utf-8");
    const type = event.headers["content-type"] || "";
    const isJson = type.includes("application/json");
    const payload = isJson ? JSON.stringify(JSON.parse(buf.toString())) : buf.toString();

    let evt: Stripe.Event;
    try {
      evt = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("[stripe] webhook signature verification failed", err);
      return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    switch (evt.type) {
      case "checkout.session.completed":
      case "invoice.paid":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "payment_intent.succeeded": {
        const object = evt.data.object as any;
        await upsertEntitlementsFromStripe(object);
        break;
      }
      default:
        console.log("Unhandled event type", evt.type);
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err: any) {
    console.error("[stripe] webhook error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error" }) };
  }
};

async function upsertEntitlementsFromStripe(obj: any) {
  if (!supabase) {
    console.warn("[stripe] Supabase not configured; skipping entitlement write.");
    return;
  }

  try {
    // Derive core fields
    const customer_email = obj.customer_details?.email || obj.customer_email || obj.receipt_email || null;
    const stripe_customer = obj.customer || obj.customer_id || null;
    const subscription_id = obj.subscription || null;

    // Identify purchased price/product for entitlement
    let items: Array<{ price: string; quantity: number }> = [];
    if (obj.lines?.data) {
      items = obj.lines.data
        .map((l: any) => ({ price: l.price?.id, quantity: l.quantity || 1 }))
        .filter((x: any) => x.price);
    } else if (obj.display_items) {
      items = (obj.display_items as any[])
        .map((d: any) => ({ price: d.price?.id, quantity: d.quantity || 1 }))
        .filter((x: any) => x.price);
    } else if (obj.line_items?.data) {
      items = obj.line_items.data
        .map((l: any) => ({ price: l.price?.id, quantity: l.quantity || 1 }))
        .filter((x: any) => x.price);
    }

    // Upsert customer
    const { data: custData, error: custErr } = await supabase
      .from("ae_customers")
      .upsert(
        [{
          stripe_customer,
          email: customer_email,
          updated_at: new Date().toISOString(),
        }],
        { onConflict: "stripe_customer" }
      )
      .select()
      .limit(1);
    if (custErr) throw custErr;
    const customer_id = custData?.[0]?.id;

    // Upsert entitlements for each item
    for (const it of items) {
      const { error: entErr } = await supabase
        .from("ae_entitlements")
        .upsert(
          [{
            customer_id,
            stripe_price: it.price,
            quantity: it.quantity || 1,
            subscription_id,
            active: true,
            updated_at: new Date().toISOString(),
          }],
          { onConflict: "customer_id,stripe_price" }
        );
      if (entErr) throw entErr;
    }
  } catch (e) {
    console.error("[stripe] upsertEntitlementsFromStripe error", e);
  }
}


