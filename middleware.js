import { NextResponse } from 'next/server';

// Middleware function to handle all requests
export function middleware(request) {
  // Get the existing response
  const response = NextResponse.next();

  // Environment URLs
  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL || 'https://wordpress.jardindeschefs.ca';
  const publicBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jardindeschefs.ca';
  const publicSiteUrlWWW = process.env.NEXT_PUBLIC_SITE_URL_WWW || 'https://www.jardindeschefs.ca';

  // Check if we're in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Build CSP upgrade directive conditionally
  const cspUpgrade = isProduction ? "upgrade-insecure-requests;" : "";

  // Add security headers
  const securityHeaders = {
    // Comprehensive Content Security Policy
    'Content-Security-Policy': 
      // Base restriction - only allow resources from same origin by default
      "default-src 'self'; " +
      
      // Scripts: Allow from our domains, inline scripts (needed for React), cdnjs, Stripe, and Google
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${publicBaseUrl} ${publicSiteUrlWWW} https://cdnjs.cloudflare.com https://js.stripe.com https://*.googleapis.com https://www.google.com https://www.gstatic.com; ` +
      
      // Styles: Allow from our domains, inline styles (needed for styled-components/tailwind), cdnjs, and Google
      `style-src 'self' 'unsafe-inline' ${publicBaseUrl} ${publicSiteUrlWWW} https://cdnjs.cloudflare.com https://*.googleapis.com https://www.gstatic.com https://fonts.googleapis.com; ` +
      
      // Images: Allow from our domains, data URLs, WordPress, Stripe, Google, and common CDNs
      `img-src 'self' data: ${publicBaseUrl} ${publicSiteUrlWWW} ${wordpressUrl} https://*.wordpress.com https://*.wp.com https://stripe.com https://*.stripe.com https://*.googleapis.com https://*.gstatic.com https://*.ggpht.com https://www.google.com; ` +
      
      // Fonts: Allow from our domains, cdnjs, and Google Fonts
      `font-src 'self' ${publicBaseUrl} ${publicSiteUrlWWW} https://cdnjs.cloudflare.com https://fonts.gstatic.com; ` +
      
      // API connections: Allow to our domains, Stripe APIs, and Google APIs
      `connect-src 'self' ${publicBaseUrl} ${publicSiteUrlWWW} ${wordpressUrl} https://*.stripe.com https://*.googleapis.com https://www.google.com https://www.gstatic.com; ` +
      
      // Frames: Allow Stripe, YouTube, Google Maps, and reCAPTCHA
      `frame-src 'self' ${publicBaseUrl} ${publicSiteUrlWWW} https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://www.google.com https://recaptcha.google.com https://www.recaptcha.net; ` +
      
      // Block all object tags (Flash, PDFs in object tags, etc.)
      "object-src 'none'; " +
      
      // Only allow HTTPS for external resources (except for localhost in dev)
      // Only upgrade to HTTPS in production
      cspUpgrade,
    
    // XSS Protection for older browsers
    'X-XSS-Protection': '1; mode=block',
    
    // Clickjacking protection
    'X-Frame-Options': 'SAMEORIGIN',
    
    // MIME type sniffing protection
    'X-Content-Type-Options': 'nosniff',
    
    // Referrer policy - more restrictive than your nginx config
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Feature policy - restrict unnecessary browser features
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
    
    // HSTS - enforce HTTPS (31536000 = 1 year, 63072000 = 2 years)
    // HSTS - enforce HTTPS only in production
    'Strict-Transport-Security': isProduction ? 'max-age=31536000; includeSubDomains; preload' : 'max-age=0',
    
    
    // Additional security headers
    'X-DNS-Prefetch-Control': 'on',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
  };

  // Add the headers to the response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // CORS headers - be more restrictive than using '*'
  const allowedOrigins = [
    publicBaseUrl,
    publicSiteUrlWWW,
    'http://localhost:3000', // for development
    'http://192.168.88.91:3000', // Add your dev IP
    'https://localhost:3000', // for development with HTTPS
  ];
  
  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
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
     * - Image optimization routes
     */
    {
      source: '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
