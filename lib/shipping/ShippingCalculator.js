/**
 * Client-side Shipping Calculator that uses the server API routes
 * This version doesn't attempt to access WooCommerce directly
 */
class ShippingCalculator {
  constructor() {
    // Cache for shipping costs
    this.shippingCache = {};
    
    // State variables
    this.isInitialized = false;
    this.lastInitTime = 0;
    this.cacheLifetime = 30 * 60 * 1000; // 30 minutes cache
    
    // Default shipping rates when API fails
    this.defaultRates = {
      'only_pickup': 0,
      'service_item': 0,
      'standard': 15,
      'default': 15
    };
  }
  
  /**
   * Initialize the shipping calculator
   * This is a no-op in the client version as we'll calculate on-demand
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    this.isInitialized = true;
    this.lastInitTime = Date.now();
    return true;
  }
  
  /**
   * Calculate shipping cost for a cart using the server API
   * @param {Array} cart - Cart items
   * @param {string} deliveryMethod - 'shipping' or 'pickup'
   * @param {string} province - Province code (e.g., 'QC', 'ON')
   * @returns {Promise<number>} Total shipping cost
   */
  async calculateShipping(cart, deliveryMethod = 'shipping', province = 'QC') {
    // For pickup, just return 0 without making API call
    if (deliveryMethod === 'pickup') {
      return 0;
    }
    
    // For empty cart, just return 0
    if (!cart || !cart.length) {
      return 0;
    }
    
    // Check for non-shippable cart
    const hasShippableItems = cart.some(item => 
      item.shipping_class !== 'only_pickup' && 
      item.shipping_class !== 'service_item' && 
      item.type !== 'mwb_booking'
    );
    
    if (!hasShippableItems) {
      return 0;
    }
    
    // Normalize province
    const normalizedProvince = province.toUpperCase();
    
    // Generate cache key
    const cacheKey = `${normalizedProvince}_${deliveryMethod}_${JSON.stringify(cart.map(item => ({
      id: item.id,
      shipping_class: item.shipping_class,
      type: item.type
    })))}`;
    
    // Check cache first
    const now = Date.now();
    if (
      this.shippingCache[cacheKey] && 
      now - this.shippingCache[cacheKey].timestamp < this.cacheLifetime
    ) {
      return this.shippingCache[cacheKey].cost;
    }
    
    try {
      // Determine if we're in browser or server context
      const isServer = typeof window === 'undefined';
      
      // Construct the API URL based on context
      const apiUrl = isServer 
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/shipping/calculate` 
        : '/api/shipping/calculate';
      
      // Make API call to server-side shipping calculator
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart,
          deliveryMethod,
          province: normalizedProvince
        }),
      });
      
      if (!response.ok) {
        throw new Error('Shipping calculation failed');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Shipping calculation failed');
      }
      
      // Cache the result
      this.shippingCache[cacheKey] = {
        cost: data.shippingCost,
        timestamp: now
      };
      
      return data.shippingCost;
    } catch (error) {
      console.error('Error calculating shipping:', error);
      
      // Fallback to default calculation
      // Check if there are any shippable items
      const shippableItems = cart.some(item => 
        item.shipping_class !== 'only_pickup' && 
        item.shipping_class !== 'service_item' && 
        item.type !== 'mwb_booking'
      );
      
      const fallbackCost = shippableItems && deliveryMethod === 'shipping' ? 15 : 0;
      
      // Cache the fallback result
      this.shippingCache[cacheKey] = {
        cost: fallbackCost,
        timestamp: now
      };
      
      return fallbackCost;
    }
  }
  
  /**
   * Get shipping rate for a specific shipping class and province
   * This is a simplified version that uses the default rates
   * @param {string} shippingClass - Shipping class slug
   * @param {string} province - Province code (e.g., 'QC', 'ON')
   * @returns {Promise<number>} Shipping rate
   */
  async getShippingRate(shippingClass, province = 'QC') {
    // For special shipping classes, return fixed values
    if (shippingClass === 'only_pickup' || shippingClass === 'service_item') {
      return 0;
    }

    console.log(`province (called with ${province}) not used in this function for now.`);
    
    // For standard shipping, use the default rate
    if (shippingClass === 'standard' || !shippingClass) {
      return this.defaultRates.standard;
    }
    
    // For any other shipping class, use the default
    return this.defaultRates.default;
  }
}

// Create a singleton instance
const shippingCalculator = new ShippingCalculator();

export default shippingCalculator;
