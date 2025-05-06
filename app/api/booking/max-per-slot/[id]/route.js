import { fetchMaxBookingPerSlot } from '@/lib/wooCommerce';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return Response.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // Get max booking per slot from WooCommerce
    const maxBookingResponse = await fetchMaxBookingPerSlot(id);
    
    if (!maxBookingResponse.success) {
      return Response.json({ error: maxBookingResponse.error }, { status: 500 });
    }
    
    const maxBookingPerSlot = maxBookingResponse.data.max_booking_per_slot || 0;
    
    return Response.json({
      success: true,
      productId: id,
      maxBookingPerSlot
    });
  } catch (error) {
    console.error('Error fetching max booking per slot:', error);
    return Response.json({ 
      error: 'Failed to fetch max booking per slot' 
    }, { status: 500 });
  }
}
