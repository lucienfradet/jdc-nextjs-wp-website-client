import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    
    // Find order in database
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber,
        paymentIntentId: paymentIntentId
      }
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Implement idempotency - check if order is already marked as failed
    if (order.paymentStatus === 'failed' && order.status === 'cancelled') {
      return NextResponse.json({
        success: true,
        message: 'Order already marked as failed',
        orderNumber,
        status: 'cancelled',
        paymentIntentId
      });
    }
    
    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'failed',
        status: 'cancelled',
        notes: order.notes 
          ? `${order.notes}\n\nPayment failed: ${failureReason || 'Unknown reason'}`
          : `Payment failed: ${failureReason || 'Unknown reason'}`,
        updatedAt: new Date()
      }
    });
    
    console.log('Order payment failed:', orderNumber, paymentIntentId, failureReason);
    
    return NextResponse.json({
      success: true,
      message: 'Order marked as failed',
      orderNumber,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
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
