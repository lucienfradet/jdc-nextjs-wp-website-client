import Stripe from 'stripe';
import { headers } from 'next/headers';

// Note: We don't apply CSRF protection to webhooks, as they are authenticated
// via the Stripe signature header and don't originate from the browser

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await request.text();
    
    const signature = (await headers()).get('stripe-signature');
    
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`Processing webhook event: ${event.type}`);
    
    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      case 'payment_intent.created':
        // Just log the event, no action needed
        console.log(`Payment intent created: ${event.data.object.id}`);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  
  // Extract metadata from the payment intent
  const { orderNumber } = paymentIntent.metadata || {};
  
  if (!orderNumber) {
    console.error('No order number found in payment intent metadata');
    return;
  }
  
  try {
    // Call the API to update the order status
    // Note: We skip CSRF protection here because this is a server-to-server request
    // and Stripe webhooks are authenticated via the signature header
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/orders/update-succeeded`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add a special header to indicate this is a webhook request
        'X-Webhook-Source': 'stripe',
        // Add an API key as an additional security measure
        'X-API-Key': process.env.WEBHOOK_API_KEY || ''
      },
      body: JSON.stringify({
        orderNumber,
        paymentIntentId: paymentIntent.id,
        paymentData: {
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          payment_method: paymentIntent.payment_method,
          payment_method_types: paymentIntent.payment_method_types,
        }
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update order');
    }
    
    const result = await response.json();
    console.log('Order updated successfully:', result);
  } catch (error) {
    console.error('Error updating order:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  
  // Extract metadata from the payment intent
  const { orderNumber } = paymentIntent.metadata || {};
  
  if (!orderNumber) {
    console.error('No order number found in payment intent metadata');
    return;
  }
  
  try {
    // Call the API to update the order status
    // Note: We skip CSRF protection here because this is a server-to-server request
    // and Stripe webhooks are authenticated via the signature header
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/orders/update-failed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add a special header to indicate this is a webhook request
        'X-Webhook-Source': 'stripe',
        // Add an API key as an additional security measure
        'X-API-Key': process.env.WEBHOOK_API_KEY || ''
      },
      body: JSON.stringify({
        orderNumber,
        paymentIntentId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message || 'Unknown error'
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update order');
    }
    
    const result = await response.json();
    console.log('Order marked as failed:', result);
  } catch (error) {
    console.error('Error updating order status:', error);
  }
}
