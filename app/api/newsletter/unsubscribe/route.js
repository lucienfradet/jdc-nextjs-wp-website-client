import { withRateLimit } from '@/lib/rateLimiter';

async function handlePostRequest(request) {
  try {
    const { email, token } = await request.json();
    
    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ 
        success: false, 
        message: 'Adresse email invalide' 
      }, { status: 400 });
    }
    
    // Prepare the request to the WordPress REST API
    // API key is required for all endpoints
    const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}wp-json/mailpoet/v1/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MailPoet-API-Key': process.env.MAILPOET_API_KEY
      },
      body: JSON.stringify({
        email,
        token // Include token if provided for verification
      })
    });
    
    const data = await response.json();
    console.log("trying to unsubscribed email with data: ", data);
    
    // For privacy reasons, always return success even if the email doesn't exist
    // This prevents email fishing
    return Response.json({
      success: true,
      message: 'Si votre email existe dans notre système, il a été désabonné'
    });
  } catch (error) {
    console.error('Newsletter unsubscribe API error:', error);
    return Response.json({ 
      success: false, 
      message: 'Une erreur inattendue est survenue' 
    }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePostRequest, 'newsletter');
