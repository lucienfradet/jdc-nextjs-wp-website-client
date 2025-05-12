import { withCsrfProtection } from './csrf-server';

/**
 * Helper function to check if a request is from a trusted webhook
 * @param {Request} request - The incoming request
 * @returns {boolean} Whether the request is from a trusted webhook
 */
export function isWebhookRequest(request) {
  // Check for webhook source header
  const webhookSource = request.headers.get('X-Webhook-Source');
  
  // If no webhook source header, it's not a webhook request
  if (!webhookSource) {
    return false;
  }
  
  // Check API key for additional security
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.WEBHOOK_API_KEY;
  
  // If webhook API key is configured, require it
  if (validApiKey && apiKey !== validApiKey) {
    return false;
  }
  
  // For Stripe webhooks, we only accept 'stripe' as the source
  return webhookSource === 'stripe';
}

/**
 * A modified version of withCsrfProtection that allows webhook requests to bypass CSRF checks
 * @param {Function} handler - The route handler function
 * @returns {Function} The protected handler function
 */
export function withWebhookOrCsrfProtection(handler) {
  return async (request, ...args) => {
    // Check if this is a webhook request
    if (isWebhookRequest(request)) {
      // Skip CSRF protection for webhook requests
      return handler(request, ...args);
    }
    
    // Otherwise, apply CSRF protection using the imported function
    const protectedHandler = withCsrfProtection(handler);
    return protectedHandler(request, ...args);
  };
}
