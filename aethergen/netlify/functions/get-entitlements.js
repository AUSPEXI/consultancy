export const handler = async function(event, context) {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        entitlements: [
          {
            stripe_price: "DEV_FREE",
            quantity: 1,
            subscription_id: "sub_dev",
            active: true,
            updated_at: new Date().toISOString()
          }
        ]
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Function failed" }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
