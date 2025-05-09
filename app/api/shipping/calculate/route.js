import { axiosInstance } from '@/lib/sslConfig';
import { withRateLimit } from '@/lib/rateLimiter';

const API_URL = `${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}wp-json/wc/v3`;
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

// Cache storage
const shippingCache = {
  provincesZones: {},
  shippingRatesCache: {},
  lastFetchTime: 0,
  cacheLifetime: 30 * 60 * 1000, // 30 minutes
  defaultRates: {
    'only_pickup': 0,
    'service_item': 0,
    'standard': 15,
    'default': 15
  }
};

async function handlePostRequest(request) {
  try {
    // Get the cart items, delivery method, and province from the request
    const { cart, deliveryMethod = 'shipping', province = 'QC' } = await request.json();
    
    // Validate the inputs
    if (!cart || !Array.isArray(cart)) {
      return Response.json({ 
        error: 'Invalid cart data'
      }, { status: 400 });
    }
    
    // If pickup selected, return 0 cost
    if (deliveryMethod === 'pickup') {
      return Response.json({
        success: true,
        shippingCost: 0,
        deliveryMethod,
        province
      });
    }
    
    // Normalize province code
    const normalizedProvince = province.toUpperCase();
    
    // Check if we need to refresh the cache
    const now = Date.now();
    if (
      !shippingCache.lastFetchTime || 
      (now - shippingCache.lastFetchTime) > shippingCache.cacheLifetime ||
      !shippingCache.shippingRatesCache[normalizedProvince]
    ) {
      // Need to fetch fresh data
      await fetchShippingData(normalizedProvince);
    }
    
    // Calculate the shipping cost
    const shippingCost = calculateShipping(cart, normalizedProvince);
    
    return Response.json({
      success: true,
      shippingCost,
      deliveryMethod,
      province: normalizedProvince
    });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return Response.json({ 
      error: 'Failed to calculate shipping cost',
      success: false
    }, { status: 500 });
  }
}

/**
 * Fetch shipping data from WooCommerce
 */
async function fetchShippingData(province) {
  try {
    // 1. Fetch shipping zones
    const zoneResponse = await axiosInstance.get(`${API_URL}/shipping/zones`, {
      params: {},
      auth: {
        username: WOOCOMMERCE_CONSUMER_KEY,
        password: WOOCOMMERCE_CONSUMER_SECRET
      }
    });
    
    const zones = zoneResponse.data;
    
    // 2. Map provinces to zones
    for (const zone of zones) {
      const locationsResponse = await axiosInstance.get(
        `${API_URL}/shipping/zones/${zone.id}/locations`,
        {
          params: {},
          auth: {
            username: WOOCOMMERCE_CONSUMER_KEY,
            password: WOOCOMMERCE_CONSUMER_SECRET
          }
        }
      );
      
      const locations = locationsResponse.data;
      
      // Map Canadian provinces to their zones
      locations.forEach(location => {
        if (location.type === 'state' && location.code.startsWith('CA:')) {
          const provinceCode = location.code.replace('CA:', '');
          shippingCache.provincesZones[provinceCode] = zone.id;
        }
      });
    }
    
    // 3. Fetch shipping classes
    const classesResponse = await axiosInstance.get(`${API_URL}/products/shipping_classes`, {
      params: {},
      auth: {
        username: WOOCOMMERCE_CONSUMER_KEY,
        password: WOOCOMMERCE_CONSUMER_SECRET
      }
    });
    
    const shippingClasses = classesResponse.data;
    
    // 4. For each province with a zone, fetch shipping methods
    const provinces = Object.keys(shippingCache.provincesZones);
    
    for (const prov of provinces) {
      const zoneId = shippingCache.provincesZones[prov];
      
      if (!zoneId) continue;
      
      const methodsResponse = await axiosInstance.get(
        `${API_URL}/shipping/zones/${zoneId}/methods`,
        {
          params: {},
          auth: {
            username: WOOCOMMERCE_CONSUMER_KEY,
            password: WOOCOMMERCE_CONSUMER_SECRET
          }
        }
      );
      
      const methods = methodsResponse.data;
      
      // Initialize province rates with defaults
      const provinceRates = { ...shippingCache.defaultRates };
      
      // Process each shipping method
      for (const method of methods) {
        // Only process enabled methods
        if (!method.enabled) continue;
        
        // Handle flat rate methods
        if (method.method_id === 'flat_rate') {
          // Get the base cost
          const baseCost = parseFloat(method.settings.cost?.value || 0);
          
          // Update the default/standard rate
          provinceRates.default = baseCost;
          provinceRates.standard = baseCost;
          
          // Check for class-specific costs
          for (const shippingClass of shippingClasses) {
            const classSlug = shippingClass.slug;
            const classKey = `class_cost_${classSlug}`;
            
            // Some shipping classes have special handling
            if (classSlug === 'only_pickup' || classSlug === 'service_item') {
              provinceRates[classSlug] = 0; // No shipping cost for pickup-only or service items
            } 
            // Check if this class has a specific cost defined
            else if (method.settings[classKey] && method.settings[classKey].value) {
              provinceRates[classSlug] = parseFloat(method.settings[classKey].value);
            }
          }
        } 
        // Handle free shipping method
        else if (method.method_id === 'free_shipping') {
          // This is simplistic - in reality, free shipping might have conditions
          provinceRates.default = 0;
          provinceRates.standard = 0;
        }
      }
      
      // Save rates for this province
      shippingCache.shippingRatesCache[prov] = provinceRates;
    }
    
    // Update cache timestamp
    shippingCache.lastFetchTime = Date.now();
    
    // If the requested province doesn't have a rate, set default
    if (!shippingCache.shippingRatesCache[province]) {
      shippingCache.shippingRatesCache[province] = { ...shippingCache.defaultRates };
    }
    
    return true;
  } catch (error) {
    console.error('Error fetching shipping data:', error);
    
    // Ensure we have default rates for the requested province
    shippingCache.shippingRatesCache[province] = { ...shippingCache.defaultRates };
    
    // Update cache timestamp anyway to prevent constant retries
    shippingCache.lastFetchTime = Date.now();
    
    return false;
  }
}

/**
 * Calculate shipping cost based on cart items and province
 */
function calculateShipping(cart, province = 'QC') {
  // If no shippable items, return 0
  const hasShippableItems = cart.some(item => 
    item.shipping_class !== 'only_pickup' && 
    item.shipping_class !== 'service_item' && 
    item.type !== 'mwb_booking'
  );
  
  if (!hasShippableItems) {
    return 0;
  }
  
  // Get rates for this province
  const provinceRates = shippingCache.shippingRatesCache[province] || shippingCache.defaultRates;
  
  // Get the highest shipping rate among the items in the cart
  // This simulates the "per order" setting in WooCommerce
  let highestRate = 0;
  
  for (const item of cart) {
    // Skip items that don't need shipping
    if (
      item.shipping_class === 'only_pickup' || 
      item.shipping_class === 'service_item' || 
      item.type === 'mwb_booking'
    ) {
      continue;
    }
    
    // Get the rate for this shipping class
    const classRate = provinceRates[item.shipping_class] || provinceRates.default;
    
    // Update the highest rate
    if (classRate > highestRate) {
      highestRate = classRate;
    }
  }
  
  return highestRate;
}

export const POST = withRateLimit(handlePostRequest, 'products');
