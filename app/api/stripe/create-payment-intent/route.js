import Stripe from "stripe";

// Generate a unique order number (format: JDC-YYYYMMDD-XXXX)
const generateOrderNumber = () => {
  const prefix = 'JDC';
  const date = new Date();
  const dateStr = date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number

  return `${prefix}-${dateStr}-${randomNum}`;
};

export async function POST(request) {
  try {
    // Initialize Stripe with secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get request body
    const body = await request.json();
    const { amount, paymentMethodType, currency, metadata, idempotencyKey } = body;

    const updatedMetadata = {
      orderNumber: generateOrderNumber(),
      ...metadata
    }

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: currency || 'cad',
      payment_method_types: [paymentMethodType || 'card'],
      metadata: updatedMetadata || {}
    }, {
        idempotencyKey
      });

    console.log("new payment intent created: ", paymentIntent.metadata);

    // Return the client secret to the client
    return Response.json({
      clientSecret: paymentIntent.client_secret,
      orderNumber: paymentIntent.metadata.orderNumber
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
