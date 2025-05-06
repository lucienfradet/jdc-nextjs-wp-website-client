import { axiosInstance } from '@/lib/sslConfig';

const API_URL = `${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}wp-json/wc/v3`;
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

/**
 * Shipping Calculator for WooCommerce products
 * 
 * This utility provides methods to calculate shipping costs based on
 * products in the cart, their shipping classes, and delivery methods.
 */
class ShippingCalculator {
  constructor() {
    // Cache for shipping rates by class to avoid redundant API calls
    this.shippingRatesCache = {};
    
    // Default shipping rates when API fails
    this.defaultRates = {
      'only_pickup': 0,
      'standard': 15,
      'default': 15
    };
    
    // Flag to determine if the shipping rates have been fetched
    this.hasInitialized = false;
  }
  
  /**
   * Initialize shipping calculator by fetching shipping rates from WooCommerce
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Fetch shipping classes
      const shippingClasses = await this.fetchShippingClasses();
      
      // Fetch shipping zones and methods
      const shippingMethods = await this.fetchShippingMethods();
      
      // Process and cache shipping rates
      this.processShippingRates(shippingClasses, shippingMethods);
      
      this.hasInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing shipping calculator:', error);
      // Use default rates if API fails
      this.shippingRatesCache = { ...this.defaultRates };
      this.hasInitialized = true;
      return false;
    }
  }
  
  /**
   * Fetch shipping classes from WooCommerce API
   * @returns {Promise<Array>} Shipping classes
   */
  async fetchShippingClasses() {
    try {
      const response = await axiosInstance.get(`${API_URL}/products/shipping_classes`, {
        auth: {
          username: WOOCOMMERCE_CONSUMER_KEY,
          password: WOOCOMMERCE_CONSUMER_SECRET
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching shipping classes:', error);
      return [];
    }
  }
  
  /**
   * Fetch shipping methods from WooCommerce API
   * @returns {Promise<Array>} Shipping methods
   */
  async fetchShippingMethods() {
    try {
      // Fetch shipping zones first
      const zonesResponse = await axiosInstance.get(`${API_URL}/shipping/zones`, {
        auth: {
          username: WOOCOMMERCE_CONSUMER_KEY,
          password: WOOCOMMERCE_CONSUMER_SECRET
        }
      });
      
      const zones = zonesResponse.data;
      
      // For each zone, fetch the shipping methods
      const methodsPromises = zones.map(async zone => {
        const methodsResponse = await axiosInstance.get(`${API_URL}/shipping/zones/${zone.id}/methods`, {
          auth: {
            username: WOOCOMMERCE_CONSUMER_KEY,
            password: WOOCOMMERCE_CONSUMER_SECRET
          }
        });
        
        return {
          zoneId: zone.id,
          zoneName: zone.name,
          methods: methodsResponse.data
        };
      });
      
      return await Promise.all(methodsPromises);
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      return [];
    }
  }
  
  /**
   * Process and cache shipping rates
   * @param {Array} shippingClasses - Shipping classes from WooCommerce
   * @param {Array} shippingMethods - Shipping methods from WooCommerce
   */
  processShippingRates(shippingClasses, shippingMethods) {
    // Initialize rates with defaults
    const rates = { ...this.defaultRates };
    
    try {
      // Process shipping rates based on classes and methods
      // This is a simplified implementation - customize based on your WooCommerce setup
      
      shippingClasses.forEach(shippingClass => {
        const classSlug = shippingClass.slug;
        
        // Look for methods applicable to this shipping class
        shippingMethods.forEach(zoneData => {
          zoneData.methods.forEach(method => {
            // Check if this method applies to this shipping class
            // This logic might need to be adjusted based on your WooCommerce configuration
            if (method.settings && method.settings.class_costs && method.settings.class_costs[classSlug]) {
              rates[classSlug] = parseFloat(method.settings.class_costs[classSlug].value || 0);
            }
            // If no specific class rate is found, use the default method cost if applicable
            else if (method.settings && method.settings.cost && !rates[classSlug]) {
              rates[classSlug] = parseFloat(method.settings.cost.value || 0);
            }
          });
        });
        
        // Ensure each class has a rate (fall back to default if not specified)
        if (!rates[classSlug]) {
          rates[classSlug] = rates.default;
        }
      });
      
      this.shippingRatesCache = rates;
    } catch (error) {
      console.error('Error processing shipping rates:', error);
      this.shippingRatesCache = { ...this.defaultRates };
    }
  }
  
  /**
   * Calculate shipping cost for a cart
   * @param {Array} cart - Cart items
   * @param {string} deliveryMethod - 'shipping' or 'pickup'
   * @returns {number} Total shipping cost
   */
  calculateShipping(cart, deliveryMethod = 'shipping') {
    if (!this.hasInitialized) {
      console.warn('Shipping calculator not initialized, using default rates');
    }
    
    // If pickup is selected, no shipping cost for all items
    if (deliveryMethod === 'pickup') {
      return 0;
    }
    
    // Calculate shipping based on items in cart
    let totalShipping = 0;
    
    cart.forEach(item => {
      // If the item is a booking product or pickup only, no shipping cost
      if (item.shipping_class === 'only_pickup' || item.type === 'mwb_booking') {
        return;
      }
      
      // Get the rate for this shipping class
      const rate = this.shippingRatesCache[item.shipping_class] || this.shippingRatesCache.default;
      
      // Add shipping cost for this item
      totalShipping += rate;
    });
    
    return totalShipping;
  }
  
  /**
   * Get shipping rate for a specific shipping class
   * @param {string} shippingClass - Shipping class slug
   * @returns {number} Shipping rate
   */
  getShippingRate(shippingClass) {
    return this.shippingRatesCache[shippingClass] || this.shippingRatesCache.default;
  }
}

// Create a singleton instance
const shippingCalculator = new ShippingCalculator();

export default shippingCalculator;
