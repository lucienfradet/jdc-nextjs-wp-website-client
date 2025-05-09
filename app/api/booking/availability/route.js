import prisma from '@/lib/prisma';
import { fetchMaxBookingPerSlot } from '@/lib/wooCommerce';
import { withRateLimit } from '@/lib/rateLimiter';

// Simple in-memory cache
// Set to 0 because causes problems if users try to order within 5 minute of each other
const availabilityCache = {
  data: {},
  // 5 minute cache duration
  // cacheDuration: 5 * 60 * 1000
  cacheDuration: 0
};

async function handlePostRequest(request) {
  try {
    const { productId, date } = await request.json();
    
    if (!productId || !date) {
      return Response.json({ error: 'Product ID and date are required' }, { status: 400 });
    }
    
    // Check cache first
    const cacheKey = `${productId}_${date}`;
    const now = Date.now();
    
    if (
      availabilityCache.data[cacheKey] && 
      availabilityCache.data[cacheKey].timestamp + availabilityCache.cacheDuration > now
    ) {
      console.log('Returning cached availability data');
      return Response.json(availabilityCache.data[cacheKey].data);
    }
    
    // Get max booking per slot from WooCommerce (with a local 1-hour cache)
    let maxBookingPerSlot = 0;
    const maxBookingCacheKey = `max_booking_${productId}`;
    
    if (
      availabilityCache.data[maxBookingCacheKey] && 
      availabilityCache.data[maxBookingCacheKey].timestamp + (60 * 60 * 1000) > now
    ) {
      maxBookingPerSlot = availabilityCache.data[maxBookingCacheKey].data;
    } else {
      const maxBookingResponse = await fetchMaxBookingPerSlot(productId);
      
      if (!maxBookingResponse.success) {
        return Response.json({ error: maxBookingResponse.error }, { status: 500 });
      }
      
      maxBookingPerSlot = maxBookingResponse.data.max_booking_per_slot || 0;
      
      // Cache max booking per slot for 1 hour
      availabilityCache.data[maxBookingCacheKey] = {
        data: maxBookingPerSlot,
        timestamp: now
      };
    }
    
    // Get all booked slots from our database
    const bookedSlots = await prisma.orderItem.findMany({
      where: {
        productId: parseInt(productId),
        isBooking: true,
        bookingDate: date,
        order: {
          paymentStatus: 'paid'
        }
      },
      select: {
        bookingTimeSlot: true,
        bookingPeople: true
      }
    });
    
    // Group bookings by time slot and count people booked
    const slotAvailability = {};
    
    bookedSlots.forEach(booking => {
      const timeSlot = booking.bookingTimeSlot;
      if (!timeSlot) return;
      
      if (!slotAvailability[timeSlot]) {
        slotAvailability[timeSlot] = 0;
      }
      
      slotAvailability[timeSlot] += booking.bookingPeople || 0;
    });
    
    // Calculate availability for each slot
    const availability = Object.entries(slotAvailability).map(([timeSlot, bookedCount]) => ({
      timeSlot,
      bookedCount,
      maxBooking: maxBookingPerSlot,
      available: Math.max(0, maxBookingPerSlot - bookedCount)
    }));
    
    // Prepare the result
    const result = {
      success: true,
      productId,
      date,
      maxBookingPerSlot,
      availability
    };
    
    // Cache the result
    availabilityCache.data[cacheKey] = {
      data: result,
      timestamp: now
    };
    
    return Response.json(result);
  } catch (error) {
    console.error('Error checking booking availability:', error);
    return Response.json({ 
      error: 'Failed to check booking availability' 
    }, { status: 500 });
  }
}

// Apply the rate limiter to the POST handler function
// Use 'booking' as the key to apply the appropriate rate limit for booking endpoints
export const POST = withRateLimit(handlePostRequest, 'booking');
