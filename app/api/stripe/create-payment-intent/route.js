import Stripe from "stripe";

export async function POST(request) {
  try {
    // Initialize Stripe with secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get request body
    const body = await request.json();
    const { amount, paymentMethodType, currency, metadata } = body;

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: currency || 'cad',
      payment_method_types: [paymentMethodType || 'card'],
      metadata: metadata || {}
    });

    // Return the client secret to the client
    return Response.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
