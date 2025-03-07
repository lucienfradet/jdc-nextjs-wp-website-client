// app/api/orders/update-succeeded/route.js
import { NextResponse } from 'next/server';

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

    // Implement idempotency - check if order is already processed
    // Here you'd typically query your database to see if this order has already been marked as paid
    
    // For example:
    // const existingOrder = await db.orders.findOne({ 
    //   where: { 
    //     orderNumber,
    //     status: 'paid'
    //   }
    // });
    
    // if (existingOrder) {
    //   return NextResponse.json({ 
    //     message: 'Order already processed',
    //     orderNumber 
    //   });
    // }
    
    // In a real implementation, you would:
    // 1. Update the order status in your database
    // 2. Send confirmation email to the customer
    // 3. Update inventory
    // 4. Create invoice/receipt
    
    console.log('Order payment succeeded:', orderNumber, paymentIntentId);
    
    // For now, we'll just return a success response
    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      orderNumber,
      status: 'paid',
      paymentIntentId
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
