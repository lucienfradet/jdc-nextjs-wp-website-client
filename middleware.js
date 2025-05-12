import { NextResponse } from 'next/server';

// Middleware function to handle all requests
export function middleware(request) {
  // Get the existing response
  const response = NextResponse.next();

  // WordPress URL based on environment
  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL || 'https://wordpress.jardindeschefs.ca';

  // Add security headers
  const securityHeaders = {
    // Helps prevent XSS attacks by controlling which resources can be loaded
    'Content-Security-Policy': 
      // Base restriction - only allow resources from same origin by default
      "default-src 'self'; " +
      
      // Scripts: Allow from our domain, inline scripts (needed for React), cdnjs for libraries, and Stripe
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://js.stripe.com https://*.googleapis.com; " +
      
      // Styles: Allow from our domain, inline styles (needed for styled-components/tailwind), and cdnjs
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://*.googleapis.com; " +
      
      // Images: Allow from our domain, data URLs (for small embedded images), WordPress sites, Stripe, Google Maps, and placeholder API
      `img-src 'self' data: ${wordpressUrl} https://*.wordpress.com https://*.wp.com https://stripe.com https://*.stripe.com https://*.googleapis.com https://*.gstatic.com https://*.ggpht.com; ` +
      
      // Fonts: Allow from our domain, cdnjs, and Google (for map fonts)
      "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; " +
      
      // API connections: Allow to our domain, Stripe APIs, and Google Maps APIs
      `connect-src 'self' ${wordpressUrl} https://*.stripe.com https://*.googleapis.com; ` +
      
      // Frames: Allow Stripe payment forms, YouTube embeds, and Google Maps
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://www.google.com; " +
      
      // Block all object tags (Flash, PDFs in object tags, etc.)
      "object-src 'none';",
    
    // Helps prevent XSS attacks in older browsers
    'X-XSS-Protection': '1; mode=block',
    
    // Prevents the page from being displayed in an iframe (clickjacking protection)
    'X-Frame-Options': 'SAMEORIGIN',
    
    // Prevents browsers from interpreting files as a different MIME type
    'X-Content-Type-Options': 'nosniff',
    
    // Controls how much referrer information is sent
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Controls which browser features the site can use
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // Enforces the use of HTTPS (adjust max-age as needed)
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  };

  // Add the headers to the response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Enable CORS headers for CSRF token usage
  response.headers.append('Access-Control-Allow-Credentials', 'true');
  response.headers.append('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_SITE_URL || '*');
  response.headers.append('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  response.headers.append(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: response.headers,
    });
  }

  return response;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes (/api/*)
     * - Static files (/_next/static/*, /favicon.ico, etc.)
     * - Debug routes (/_next/*)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
