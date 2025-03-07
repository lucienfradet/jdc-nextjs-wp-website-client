import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderNumber, paymentIntentId, failureReason } = body;
    
    // Validation
    if (!orderNumber || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Implement idempotency - similar to the success handler
    
    // In a real implementation, you would:
    // 1. Update the order status in your database to 'failed'
    // 2. Potentially notify the customer about the failed payment
    // 3. Log the failure reason for your records
    
    console.log('Order payment failed:', orderNumber, paymentIntentId, failureReason);
    
    // For now, we'll just return a response
    return NextResponse.json({
      success: true,
      message: 'Order marked as failed',
      orderNumber,
      status: 'failed',
      paymentIntentId,
      failureReason
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
