export async function POST(request) {
  try {
    const { email, firstName, lastName, listIds } = await request.json();
    
    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ 
        success: false, 
        message: 'Adresse email invalide' 
      }, { status: 400 });
    }
    
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
    
    // Determine which list ID to use:
    // 1. Use the provided listIds from the request if available
    // 2. Otherwise use the defaultListId we found
    // 3. If no valid list was found, use a hardcoded fallback (you should replace this with your actual list ID)
    const finalListIds = listIds || (defaultListId ? [defaultListId] : [3]); // Using 2 as a fallback, update this!
    
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
        email,
        first_name: firstName || '',
        last_name: lastName || '',
        list_ids: finalListIds
      })
    });
    
    const data = await response.json();
    
    // Check if subscription was successful
    if (!response.ok) {
      console.error('Newsletter subscription error:', data);
      return Response.json({ 
        success: false, 
        message: data.message || 'Échec de l\'abonnement à la newsletter' 
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
