export async function GET() {
  try {
    // Make sure the URL has a trailing slash between base URL and wp-json
    const wordpressApiUrl = process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
    const apiUrl = wordpressApiUrl.endsWith('/') 
      ? `${wordpressApiUrl}wp-json/mailpoet/v1/lists`
      : `${wordpressApiUrl}/wp-json/mailpoet/v1/lists`;
    
    console.log('Fetching newsletter lists from:', apiUrl);
    
    // Fetch the lists from WordPress
    const response = await fetch(apiUrl, {
      headers: {
        'X-MailPoet-API-Key': process.env.MAILPOET_API_KEY
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching newsletter lists:', errorData);
      return Response.json({ 
        success: false, 
        message: errorData.message || 'Failed to fetch newsletter lists' 
      }, { status: response.status });
    }
    
    const lists = await response.json();
    
    // Log the lists so you can see the available IDs
    console.log('Available newsletter lists:', lists);
    
    return Response.json({
      success: true,
      lists
    });
  } catch (error) {
    console.error('Newsletter lists API error:', error);
    return Response.json({ 
      success: false, 
      message: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
