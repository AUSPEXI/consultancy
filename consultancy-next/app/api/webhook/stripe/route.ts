import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { dbAdmin } from '@/lib/firebase-admin';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
}

// Tier mapping matches create-checkout-session amounts (in cents)
function tierFromAmount(amountTotal: number | null, mode: string): string {
  if (mode === 'subscription') return 'Premium'; // PipelineOffer subscription
  switch (amountTotal) {
    case 14900: return 'Basic';      // $149
    case 49900: return 'Premium';    // $499
    case 99900: return 'Pro';        // $999
    default:    return 'Basic';
  }
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return NextResponse.json({ error: 'Webhook secret or signature missing' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = getStripe().webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email;

    if (email && dbAdmin) {
      try {
        const userQuery = await dbAdmin.collection('users').where('email', '==', email).limit(1).get();
        if (!userQuery.empty) {
          const userDoc = userQuery.docs[0];
          const newTier = tierFromAmount(session.amount_total, session.mode || 'payment');
          await userDoc.ref.update({ tier: newTier, updatedAt: new Date().toISOString() });
          console.log(`[stripe-webhook] Upgraded ${email} to ${newTier}`);
        } else {
          console.warn(`[stripe-webhook] No user found for email: ${email}`);
        }
      } catch (err) {
        console.error('[stripe-webhook] Error updating user tier:', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
