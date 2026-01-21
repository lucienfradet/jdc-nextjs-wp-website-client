import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma';

export async function GET() {
  const start = Date.now();
  
  try {
    // Actually test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - start;
    
    return NextResponse.json({ 
      status: 'ok',
      responseTime,
      timestamp: new Date().toISOString(),
      instance: process.env.INSTANCE_ID || 'unknown'
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      error: error.message 
    }, { status: 503 });
  }
}
