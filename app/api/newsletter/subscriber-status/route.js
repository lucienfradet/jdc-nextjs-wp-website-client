export async function GET(request) {
  try {
    // Get email from the URL query params
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ 
        success: false, 
        message: 'Invalid email address' 
      }, { status: 400 });
    }
    
    // Make sure the URL has a trailing slash between base URL and wp-json
    const wordpressApiUrl = process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
    const apiUrl = wordpressApiUrl.endsWith('/') 
      ? `${wordpressApiUrl}wp-json/mailpoet/v1/subscriber-status?email=${encodeURIComponent(email)}`
      : `${wordpressApiUrl}/wp-json/mailpoet/v1/subscriber-status?email=${encodeURIComponent(email)}`;
    
    console.log('Checking subscriber status at:', apiUrl);
    
    // Prepare the request to the WordPress REST API
    const response = await fetch(apiUrl, {
      headers: {
        'X-MailPoet-API-Key': process.env.MAILPOET_API_KEY
      }
    });
    
    const data = await response.json();
    
    // Check if request was successful
    if (!response.ok) {
      console.error('Status check error:', data);
      return Response.json({ 
        success: false, 
        message: data.message || 'Failed to check subscriber status' 
      }, { status: response.status });
    }
    
    return Response.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('Subscriber status API error:', error);
    return Response.json({ 
      success: false, 
      message: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
