import { withRateLimit } from '@/lib/rateLimiter';
import { withCsrfProtection } from '@/lib/csrf-server';
import { withSanitization } from '@/lib/apiMiddleware';
import { sanitizeString } from '@/lib/serverSanitizers';
import { isValidEmail } from '@/lib/serverSanitizers';
import { verifyReCaptchaToken } from '@/lib/recaptcha';

async function handlePostRequest(request) {
  try {
    const { email, firstName, lastName, listIds, recaptchaToken } = await request.json();
    
    // First, verify the reCAPTCHA token
    const recaptchaResult = await verifyReCaptchaToken(recaptchaToken, 'newsletter_subscription');
    
    if (!recaptchaResult.success) {
      return Response.json({ 
        success: false, 
        message: 'Vérification de sécurité échouée', 
        details: recaptchaResult.error || 'reCAPTCHA validation failed'
      }, { status: 400 });
    }
    
    // Validate email with sanitization
    const sanitizedEmail = sanitizeString(email);
    if (!sanitizedEmail || !isValidEmail(sanitizedEmail)) {
      return Response.json({ 
        success: false, 
        message: 'Adresse email invalide' 
      }, { status: 400 });
    }
    
    // Sanitize other fields
    const sanitizedFirstName = sanitizeString(firstName || '');
    const sanitizedLastName = sanitizeString(lastName || '');
    
    // First, let's get all available lists to find a valid one
    const wordpressApiUrl = process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
    const listApiUrl = wordpressApiUrl.endsWith('/') 
      ? `${wordpressApiUrl}wp-json/mailpoet/v1/lists`
      : `${wordpressApiUrl}/wp-json/mailpoet/v1/lists`;
    
    // Fetch all the available lists
    let defaultListId;
    try {
      const listsResponse = await fetch(listApiUrl, {
        headers: {
          'X-MailPoet-API-Key': process.env.MAILPOET_API_KEY
        }
      });
      
      if (listsResponse.ok) {
        const lists = await listsResponse.json();
        console.log('Available newsletter lists:', lists);
        
        // Find the first non-WordPress Users list
        const regularList = lists.find(list => 
          list.name !== 'WordPress Users' && 
          list.type !== 'wordpress_users'
        );
        
        if (regularList) {
          defaultListId = regularList.id;
          console.log(`Using list "${regularList.name}" (ID: ${defaultListId}) as default`);
        }
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
      // Continue anyway, maybe the provided listIds will work
    }
    
    // Validate and sanitize listIds
    let sanitizedListIds;
    if (Array.isArray(listIds)) {
      sanitizedListIds = listIds
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id));
    } else {
      sanitizedListIds = [];
    }
    
    // Determine which list ID to use:
    // 1. Use the sanitized listIds from the request if available
    // 2. Otherwise use the defaultListId we found
    // 3. If no valid list was found, use a hardcoded fallback (you should replace this with your actual list ID)
    const finalListIds = sanitizedListIds.length > 0 ? 
      sanitizedListIds : 
      (defaultListId ? [defaultListId] : [3]); // Using 3 as a fallback, update this!
    
    // Log what we're trying to use
    console.log('Using list IDs for subscription:', finalListIds);
    
    const subscribeApiUrl = wordpressApiUrl.endsWith('/') 
      ? `${wordpressApiUrl}wp-json/mailpoet/v1/subscribers`
      : `${wordpressApiUrl}/wp-json/mailpoet/v1/subscribers`;
    
    // Now make the actual subscription request
    const response = await fetch(subscribeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MailPoet-API-Key': process.env.MAILPOET_API_KEY
      },
      body: JSON.stringify({
        email: sanitizedEmail,
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        list_ids: finalListIds
      })
    });
    
    const data = await response.json();
    
    // Check if subscription was successful
    if (!response.ok) {
      console.error('Newsletter subscription error:', data);
      return Response.json({ 
        success: false, 
        message: data.message || "Échec de l'abonnement à la newsletter"
      }, { status: response.status });
    }
    
    return Response.json({
      success: true,
      message: 'Abonnement à la newsletter réussi'
    });
  } catch (error) {
    console.error('Newsletter API error:', error);
    return Response.json({ 
      success: false, 
      message: 'Une erreur inattendue est survenue' 
    }, { status: 500 });
  }
}

// Apply rate limiting, CSRF protection, and sanitization middleware
export const POST = withRateLimit(withCsrfProtection(withSanitization(handlePostRequest)), 'newsletter');
