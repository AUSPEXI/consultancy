import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(request: Request) {
  try {
    const { tier, userId, email } = await request.json();
    
    // Default prices (use environment variables in production)
    const prices: Record<string, string | undefined> = {
      'Basic': 'price_basic_id',
      'Pro': 'price_pro_id',
      'Business': 'price_business_id',
      'Enterprise': 'price_enterprise_id',
      'PipelineOffer': 'price_pipeline_id'
    };

    const priceId = prices[tier];
    if (!priceId) {
       // Fallback for development if no IDs provided
       // In a real app, you MUST provide these.
       // return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Auspexi ${tier} Plan`,
              description: `Full access to the Auspexi GEO Dashboard (${tier} Tier)`,
            },
            unit_amount: tier === 'Basic' ? 11900 
                        : tier === 'Pro' ? 39900 
                        : tier === 'Business' ? 149900 
                        : tier === 'Enterprise' ? 499900 
                        : tier === 'PipelineOffer' ? 49900 : 0,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      customer_email: email,
      metadata: {
        userId: userId || 'anonymous',
        tier: tier
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
