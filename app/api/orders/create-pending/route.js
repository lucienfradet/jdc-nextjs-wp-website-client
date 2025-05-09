import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderNumber, orderData, paymentIntentId } = body;
    
    // Validation
    if (!orderNumber || !orderData || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('Creating pending order:', orderNumber, paymentIntentId);

    // 1. IDEMPOTENCY CHECK - Don't create the same order twice
    const existingOrder = await prisma.order.findFirst({
      where: { 
        paymentIntentId: paymentIntentId 
      }
    });
    
    if (existingOrder) {
      return NextResponse.json({
        success: true,
        message: 'Order already exists',
        orderNumber: existingOrder.orderNumber,
        status: existingOrder.status,
        paymentIntentId
      });
    }

    // 2. VERIFY PAYMENT INTENT EXISTS AND IS VALID
    // This is a lightweight check to ensure the payment intent was created by your system
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    let paymentIntent;
    
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (!paymentIntent || paymentIntent.metadata.orderNumber !== orderNumber) {
        throw new Error('Invalid payment intent');
      }
      
      // Optional: Check payment intent is not too old (e.g., 1 hour max)
      const createdDate = new Date(paymentIntent.created * 1000);
      const now = new Date();
      // const hoursDiff = (now - createdDate) / (1000 * 60 * 59);
      const hoursDiff = (now - createdDate) / (1000 * 60 * 59);
      
      if (hoursDiff > 1) {
        throw new Error("Le formulaire de paiement a expiré. Veuillez actualiser la page et recommencer.");
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Intention de paiement non valide: ' + error },
        { status: 400 }
      );
    }

    // 3. Fetch validated orderData
    const validatedIntent = await prisma.validatedPaymentIntent.findUnique({
      where: { paymentIntentId: paymentIntentId }
    });

    if (!validatedIntent) {
      console.warn(`No validated data found for payment intent: ${paymentIntentId}`);
      return NextResponse.json(
        { error: 'La validation de commande a échoué. Veuillez réessayer.' },
        { status: 400 }
      );
    }

    // Use the validated data instead of client-provided data
    const validatedOrderData = JSON.parse(validatedIntent.validatedData);

    const { items, taxes, shippingCost } = validatedOrderData;
    
    // 4. PROCEED WITH ORDER CREATION
    // Extract relevant data from orderData
    const customer = orderData.customer; // Still use customer info from orderData

    // Always create a new customer record for each order
    const dbCustomer = await prisma.customer.create({
      data: {
        email: customer.billingEmail,
        firstName: customer.billingFirstName,
        lastName: customer.billingLastName,
        phone: customer.billingPhone || ''
      }
    });

    // Handle pickup location if applicable
    let pickupLocationId = null;
    if (customer.selectedPickupLocation && orderData.deliveryMethod === 'pickup') {
      // Find the pickup location in the database
      const dbPickupLocation = await prisma.pickupLocation.findFirst({
        where: {
          wordpressId: parseInt(customer.selectedPickupLocation)
        }
      });
      
      if (dbPickupLocation) {
        pickupLocationId = dbPickupLocation.id;
      }
    }

    // Calculate financial details
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const taxAmount = taxes?.totalTax || 0;
    const shipping = shippingCost ? shippingCost : 0;
    const total = orderData.total;

    // Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: dbCustomer.id,
        paymentMethod: 'stripe', // Assuming Stripe since we have paymentIntentId
        paymentIntentId,
        billingAddress1: customer.billingAddress1 || '',
        billingAddress2: customer.billingAddress2 || '',
        billingCity: customer.billingCity || '',
        billingState: customer.billingState || '',
        billingPostcode: customer.billingPostcode || '',
        billingCountry: customer.billingCountry || 'CA',
        shippingSameAsBilling: customer.shippingSameAsBilling !== false, // Default to true
        shippingAddress1: customer.shippingSameAsBilling !== false ? customer.billingAddress1 : customer.shippingAddress1 || '',
        shippingAddress2: customer.shippingSameAsBilling !== false ? customer.billingAddress2 : customer.shippingAddress2 || '',
        shippingCity: customer.shippingSameAsBilling !== false ? customer.billingCity : customer.shippingCity || '',
        shippingState: customer.shippingSameAsBilling !== false ? customer.billingState : customer.shippingState || '',
        shippingPostcode: customer.shippingSameAsBilling !== false ? customer.billingPostcode : customer.shippingPostcode || '',
        shippingCountry: customer.shippingSameAsBilling !== false ? customer.billingCountry : customer.shippingCountry || 'CA',
        status: 'pending',
        paymentStatus: 'pending',
        subtotal,
        tax: taxAmount,
        taxDetails: taxes ? JSON.stringify(taxes) : '',
        shipping,
        total,
        deliveryMethod: orderData.deliveryMethod || 'shipping',
        pickupLocationId,
      }
    });

    // Create order items
    for (const item of items) {
      // Find tax for this item if available
      const itemTaxInfo = taxes?.items?.find(tax => tax.id === item.id);
      const itemTaxes = itemTaxInfo?.taxes || {};
      const itemTaxAmount = Object.values(itemTaxes).reduce((sum, val) => sum + parseFloat(val || 0), 0);

      // Check if this is a booking product and extract booking details
      const isBooking = item.type === 'mwb_booking';
      const bookingDetails = item.booking_details || null;
      
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: item.quantity,
          subtotal: parseFloat(item.price) * item.quantity,
          tax: itemTaxAmount,
          total: parseFloat(item.price) * item.quantity + itemTaxAmount,
          shippingClass: item.shipping_class || 'standard',
          isPickupOnly: item.shipping_class === 'only_pickup',
          
          // Add booking details if applicable
          isBooking: isBooking,
          bookingDate: bookingDetails?.date || null,
          bookingTimeSlot: bookingDetails?.time_slot || null,
          bookingPeople: bookingDetails?.people || null,
        }
      });
    }
    
    console.log('Created pending order:', order.id);

    return NextResponse.json({
      success: true,
      message: 'Order created',
      orderNumber,
      status: 'pending',
      paymentIntentId,
      orderId: order.id
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
