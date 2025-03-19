import { getPostsByPage } from '@/lib/api';

export async function GET(request) {
  try {
    // Get the count parameter from the URL query params
    const url = new URL(request.url);
    const count = parseInt(url.searchParams.get('count') || '3', 10);
    
    // Fetch posts
    const postsData = await getPostsByPage(1, count);
    
    return Response.json(postsData);
  } catch (error) {
    console.error('Error fetching latest posts:', error);
    return Response.json({ 
      error: 'Failed to fetch latest posts',
      posts: []
    }, { status: 500 });
  }
}
