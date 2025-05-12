import { generateCsrfToken } from '@/lib/csrf-server';
import { withRateLimit } from '@/lib/rateLimiter';

/**
 * GET handler for CSRF token endpoint
 * Returns a new CSRF token and sets the CSRF cookie
 */
async function handleGetRequest() {
  try {
    const token = await generateCsrfToken();
    
    return Response.json({ token });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return Response.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to the endpoint to prevent abuse
export const GET = withRateLimit(handleGetRequest, 'csrf');
