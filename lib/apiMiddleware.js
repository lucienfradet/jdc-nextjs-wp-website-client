import { sanitizeObject } from '@/lib/serverSanitizers';

/**
 * Middleware function to sanitize request body
 * @param {Function} handler - The route handler function
 * @returns {Function} Middleware-wrapped handler
 */
export function withSanitization(handler) {
  return async (request, ...args) => {
    // Skip sanitization for non-POST/PUT/PATCH methods
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
      return handler(request, ...args);
    }
    
    try {
      // Clone the request to avoid modifying the original
      const clonedRequest = request.clone();
      
      // Get the content type
      const contentType = request.headers.get('content-type') || '';
      
      // Handle JSON requests
      if (contentType.includes('application/json')) {
        // Parse JSON body
        const body = await clonedRequest.json();
        
        // Sanitize the body
        const sanitizedBody = sanitizeObject(body);
        
        // Create a new request with the sanitized body
        const sanitizedRequest = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(sanitizedBody),
          // Copy other request properties
          cache: request.cache,
          credentials: request.credentials,
          integrity: request.integrity,
          keepalive: request.keepalive,
          mode: request.mode,
          redirect: request.redirect,
          referrer: request.referrer,
          referrerPolicy: request.referrerPolicy,
          signal: request.signal,
        });
        
        // Pass the sanitized request to the handler
        return handler(sanitizedRequest, ...args);
      }
      
      // For form submissions
      if (contentType.includes('application/x-www-form-urlencoded') || 
          contentType.includes('multipart/form-data')) {
        const formData = await clonedRequest.formData();
        
        // Create a new FormData instance for sanitized data
        const sanitizedFormData = new FormData();
        
        // Sanitize each field in the form data
        for (const [key, value] of formData.entries()) {
          if (typeof value === 'string') {
            sanitizedFormData.append(key, sanitizeObject(value));
          } else {
            // For files or other non-string values, pass them through
            sanitizedFormData.append(key, value);
          }
        }
        
        // Create a new request with the sanitized form data
        const sanitizedRequest = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: sanitizedFormData,
          // Copy other request properties
          cache: request.cache,
          credentials: request.credentials,
          integrity: request.integrity,
          keepalive: request.keepalive,
          mode: request.mode,
          redirect: request.redirect,
          referrer: request.referrer,
          referrerPolicy: request.referrerPolicy,
          signal: request.signal,
        });
        
        // Pass the sanitized request to the handler
        return handler(sanitizedRequest, ...args);
      }
    } catch (error) {
      console.error('Error in sanitization middleware:', error);
      // If there's an error in the middleware, continue with the original request
    }
    
    // If we couldn't sanitize (or there was an error), use the original request
    return handler(request, ...args);
  };
}

/**
 * Combine multiple middleware functions
 * @param {...Function} middlewares - The middleware functions to combine
 * @returns {Function} Combined middleware function
 */
export function combineMiddleware(...middlewares) {
  return function(handler) {
    return middlewares.reduceRight((wrappedHandler, middleware) => {
      return middleware(wrappedHandler);
    }, handler);
  };
}
