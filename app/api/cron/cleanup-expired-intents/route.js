import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // Get API key from headers for security
    const apiKey = request.headers.get('x-api-key');
    
    if (apiKey !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const now = new Date();
    
    // Delete expired validated payment intents
    const result = await prisma.validatedPaymentIntent.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });
    
    console.log(`Deleted ${result.count} expired payment intent records`);
    
    return NextResponse.json({
      success: true,
      deleted: result.count
    });
  } catch (error) {
    console.error('Error cleaning up expired payment intents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clean up expired records' },
      { status: 500 }
    );
  }
}
