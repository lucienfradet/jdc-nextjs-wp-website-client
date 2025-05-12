import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

// Configuration
const CSRF_COOKIE_NAME = 'csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_FIELD_NAME = 'csrf_token';
const CSRF_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds

// Secret key for signing the JWT
const getSecretKey = () => {
  const secret = process.env.CSRF_SECRET;
  return new TextEncoder().encode(secret);
};

/**
 * Generate a CSRF token and store it in a cookie (SERVER-SIDE ONLY)
 * @returns {Promise<string>} The generated token
 */
export async function generateCsrfToken() {
  try {
    // Generate a random token value
    const tokenValue = randomBytes(32).toString('hex');
    
    // Create a JWT containing the token
    const jwt = await new SignJWT({ value: tokenValue })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + CSRF_TOKEN_EXPIRY)
      .sign(getSecretKey());
    
    // Store the JWT in a cookie
    await cookies().set(CSRF_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Less strict than 'strict' to allow redirect flows
      maxAge: CSRF_TOKEN_EXPIRY,
      path: '/'
    });
    
    // Return the raw token to be used in forms
    console.log(`token in cookie: ${tokenValue}`);
    return tokenValue;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    throw error;
  }
}

/**
 * Validate a CSRF token against the stored cookie (SERVER-SIDE ONLY)
 * @param {string} token - The token to validate
 * @returns {Promise<boolean>} Whether the token is valid
 */
export async function validateCsrfToken(token) {
  try {
    // Get the JWT from the cookie
    const cookieStore = await cookies();
    const jwt = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    
    if (!jwt || !token) {
      return false;
    }
    
    // Verify and decode the JWT
    const { payload } = await jwtVerify(jwt, getSecretKey());
    
    // Check if the token matches the stored value
    return token === payload.value;
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return false;
  }
}

/**
 * Extract CSRF token from a request (SERVER-SIDE ONLY)
 * @param {Request} request - The incoming request
 * @returns {Promise<string|null>} The CSRF token or null
 */
export async function extractCsrfToken(request) {
  try {
    // Check for token in headers first
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    if (headerToken) {
      return headerToken;
    }
    
    // Then check request body for JSON requests
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();
      return body[CSRF_FIELD_NAME] || null;
    }
    
    // For form submissions
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const clonedRequest = request.clone();
      const formData = await clonedRequest.formData();
      return formData.get(CSRF_FIELD_NAME) || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting CSRF token:', error);
    return null;
  }
}

/**
 * Create a higher-order function that protects routes with CSRF validation (SERVER-SIDE ONLY)
 * @param {Function} handler - The route handler function
 * @returns {Function} The protected handler function
 */
export function withCsrfProtection(handler) {
  return async (request, ...args) => {
    // Skip CSRF check for non-mutating methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return handler(request, ...args);
    }
    
    // Skip CSRF check for certain paths (webhooks, cron jobs)
    const url = new URL(request.url);
    if (
      url.pathname.startsWith('/api/webhook') || 
      url.pathname.startsWith('/api/cron')
    ) {
      return handler(request, ...args);
    }
    
    try {
      // Extract the token from the request
      const token = await extractCsrfToken(request);
      
      // Validate the token
      if (!token || !(await validateCsrfToken(token))) {
        return Response.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
      
      // If token is valid, proceed with the handler
      return handler(request, ...args);
    } catch (error) {
      console.error('CSRF protection error:', error);
      return Response.json(
        { error: 'CSRF validation failed' },
        { status: 500 }
      );
    }
  };
}
