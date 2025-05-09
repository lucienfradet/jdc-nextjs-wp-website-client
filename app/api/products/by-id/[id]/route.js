import { fetchWooProductById } from "@/lib/wooCommerce";
import { withRateLimit } from "@/lib/rateLimiter";

async function handleGetRequest(request, { params }) {
  try {
    const { id } = await params;
    const response = await fetchWooProductById(id);
    
    if (!response.success) {
      // Convert utility error to HTTP response
      return Response.json({ error: response.error }, { status: 404 });
    }

    return Response.json(response.data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withRateLimit(handleGetRequest, 'products');
