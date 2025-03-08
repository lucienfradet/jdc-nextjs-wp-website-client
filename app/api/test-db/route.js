import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Simple test query
    const result = await prisma.$queryRaw`SELECT 1+1 as result`;
    
    return Response.json({
      success: true,
      message: 'Database connection works!',
      result: result[0].result
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return Response.json(
      { error: error.message || 'Failed to connect to database' },
      { status: 500 }
    );
  }
}
