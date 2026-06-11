import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { dbAdmin } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !endpointSecret) {
    return NextResponse.json({ error: 'Webhook Secret or Signature missing' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
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
          const amountTotal = session.amount_total;
          
          let newTier = 'Free';
          if (amountTotal === 11900) newTier = 'Basic';
          else if (amountTotal === 39900) newTier = 'Pro';
          else if (amountTotal === 149900) newTier = 'Business';
          else if (amountTotal === 499900) newTier = 'Enterprise';
          else if (amountTotal === 49900) newTier = 'PipelineOffer';
          
          await userDoc.ref.update({ tier: newTier, updatedAt: new Date().toISOString() });
          console.log(`Successfully upgraded user ${email} to ${newTier} via Stripe Webhook`);
        }
      } catch (error) {
        console.error('Error updating user tier from webhook:', error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
