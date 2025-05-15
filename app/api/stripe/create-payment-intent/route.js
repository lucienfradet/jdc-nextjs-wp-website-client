import Stripe from "stripe";
import prisma from '@/lib/prisma';
import { validateOrderData } from "@/lib/wooCommerce";
import { withRateLimit } from '@/lib/rateLimiter';
import { withCsrfProtection } from '@/lib/csrf-server';
import { withSanitization } from '@/lib/apiMiddleware';
import { sanitizeObject, sanitizeString } from '@/lib/serverSanitizers';

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

async function handlePostRequest(request) {
  try {
    // Initialize Stripe with secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get and sanitize request body
    const body = await request.json();
    const { amount, paymentMethodType, currency, metadata, idempotencyKey, orderData } = sanitizeObject(body);

    // Validate the entire order against WooCommerce data
    if (!orderData) {
      return Response.json({ 
        error: 'Order data is required for validation',
        validationFailed: true
      }, { status: 400 });
    }

    // Perform validation
    const validationResult = await validateOrderData(orderData);

    // If validation failed, return the discrepancies to the client
    if (!validationResult.success) {
      return Response.json({ 
        error: 'Order validation failed',
        validationFailed: true,
        discrepancies: validationResult.discrepancies || [],
        details: validationResult.error || 'Prices or amounts do not match current values in the system',
      }, { status: 400 });
    }

    // Use the validated amount from the server calculation
    const validatedAmount = validationResult.validatedData.total;

    // If there's more than 1% difference between client amount and validated amount, reject
    const percentDifference = Math.abs((amount - validatedAmount) / validatedAmount);
    if (percentDifference > 0.01) {
      return Response.json({ 
        error: 'Amount validation failed',
        validationFailed: true,
        clientAmount: amount,
        validatedAmount: validatedAmount,
      }, { status: 400 });
    }

    // Generate a unique order number
    const orderNumber = generateOrderNumber();

    // Sanitize metadata
    const sanitizedMetadata = metadata ? sanitizeObject(metadata) : {};
    
    const updatedMetadata = {
      orderNumber: orderNumber,
      validatedAmount: validatedAmount.toString(),
      ...sanitizedMetadata
    };

    // Create the payment intent with validated amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(validatedAmount * 100), // Stripe expects amount in cents
      currency: sanitizeString(currency || 'cad'),
      payment_method_types: [sanitizeString(paymentMethodType || 'card')],
      metadata: updatedMetadata
    }, {
      idempotencyKey: sanitizeString(idempotencyKey || '')
    });

    console.log("New payment intent created with validated amount:", validatedAmount);

    // Store the validated data in our database for future reference
    await prisma.validatedPaymentIntent.create({
      data: {
        paymentIntentId: paymentIntent.id,
        orderNumber: orderNumber,
        validatedData: JSON.stringify(validationResult.validatedData),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      }
    });

    console.log(`Stored validated data for payment intent: ${paymentIntent.id}`);

    // Return the client secret to the client, along with validation information
    return Response.json({
      clientSecret: paymentIntent.client_secret,
      orderNumber: paymentIntent.metadata.orderNumber,
      paymentIntentId: paymentIntent.id,
      validatedData: validationResult.validatedData
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

// Apply the rate limiter with the 'payment' key for payment-specific rate limits
export const POST = withRateLimit(withCsrfProtection(withSanitization(handlePostRequest)), 'payment');
