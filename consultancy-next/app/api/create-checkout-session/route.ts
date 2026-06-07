import { NextResponse } from 'next/server';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, {
      apiVersion: '2023-10-16' as any,
    });
  }
  return stripeClient;
}

export async function POST(request: Request) {
  try {
    const { tier, userId, email } = await request.json();

    let stripe: Stripe;
    try {
      stripe = getStripe();
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    let unitAmount = 0;
    let productName = '';
    const mode: 'subscription' | 'payment' = 'subscription';

    // Canonical tiers (matches pricing page + tiers.ts TIER_PRICES). Legacy
    // names are normalized so historical checkout links keep working.
    const normalized =
      tier === 'Basic' ? 'Starter'
      : (tier === 'Premium' || tier === 'PipelineOffer') ? 'Pro'
      : tier === 'Enterprise' ? 'Business'
      : tier;

    if (normalized === 'Starter') {
      unitAmount = 14900; // $149.00
      productName = 'Auspexi Starter';
    } else if (normalized === 'Pro') {
      unitAmount = 49900; // $499.00
      productName = 'Auspexi Pro';
    } else if (normalized === 'Business') {
      unitAmount = 189900; // $1,899.00
      productName = 'Auspexi Business';
    } else {
      return NextResponse.json({ error: 'Invalid tier selected' }, { status: 400 });
    }

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      ...(email ? { customer_email: email } : {}),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
            },
            unit_amount: unitAmount,
            ...(mode === 'subscription' ? { recurring: { interval: 'month' } } : {}),
          },
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${appUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `${appUrl}/#pricing`,
      client_reference_id: userId || email,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
