import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createWooCommerceOrder } from '@/lib/wooCommerce';


// Here a strategy put in place in order to make sure the db had time to create the
// pending order before the webhook returns

// Utility function to wait for a specified duration
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Maximum number of retries
const MAX_RETRIES = 5;
// Initial delay in milliseconds (500ms)
const INITIAL_DELAY = 500;
// Maximum delay in milliseconds (8 seconds)
const MAX_DELAY = 8000;

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderNumber, paymentIntentId, paymentData } = body;
    
    // Validation
    if (!orderNumber || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find order with retry logic to handle race conditions
    let order = null;
    let retryCount = 0;
    let delay = INITIAL_DELAY;

    while (!order && retryCount < MAX_RETRIES) {
      // Try to find order in database with relations
      order = await prisma.order.findFirst({
        where: {
          orderNumber: orderNumber,
          paymentIntentId: paymentIntentId
        },
        include: {
          customer: true,
          items: true,
          pickupLocation: true
        }
      });

      if (!order) {
        console.log(`Order not found (attempt ${retryCount + 1}/${MAX_RETRIES}), waiting ${delay}ms before retry...`);
        
        // Wait before retrying
        await wait(delay);
        
        // Exponential backoff: Double the delay for next retry (up to MAX_DELAY)
        delay = Math.min(delay * 2, MAX_DELAY);
        retryCount++;
      }
    }

    // If order is still not found after all retries
    if (!order) {
      console.error(`Order ${orderNumber} with paymentIntentId ${paymentIntentId} not found after ${MAX_RETRIES} retries`);
      return NextResponse.json(
        { error: 'Order not found after multiple retries. It may be created later.' },
        { status: 404 }
      );
    }
    
    // Implement idempotency - check if order is already marked as paid
    if (order.paymentStatus === 'paid' && order.status === 'processing') {
      return NextResponse.json({
        success: true,
        message: 'Order already processed',
        orderNumber,
        status: 'processing',
        paymentIntentId,
        wcOrderId: order.wcOrderId
      });
    }
    
    // Create order in WooCommerce
    let wcOrderId = null;
    let wcOrderResponse = null;
    
    try {
      wcOrderResponse = await createWooCommerceOrder(order, paymentData);
      wcOrderId = wcOrderResponse.id;
    } catch (wcError) {
      console.error('WooCommerce order creation failed:', wcError);
      // We will continue with our local order update even if WC fails
    }
    
    // Update order status in our database
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'paid',
        status: 'processing',
        wcOrderId: wcOrderId ? String(wcOrderId) : null,
        notes: wcOrderId 
          ? `Order synchronized with WooCommerce (ID: ${wcOrderId})`
          : (order.notes || '') + '\nFailed to create WooCommerce order',
        updatedAt: new Date()
      }
    });
    
    // In a real implementation, you would:
    // 1. Update the order status in your database
    // 2. Send confirmation email to the customer
    // 3. Update inventory
    // 4. Create invoice/receipt
    
    console.log('Updated payment_succeeded and created order on WooCommerce:', orderNumber, paymentIntentId, wcOrderId);
    
    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      orderNumber,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      paymentIntentId,
      wcOrderId: wcOrderId
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
