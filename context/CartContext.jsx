"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import shippingCalculator from '@/lib/shipping/ShippingCalculator';
import DrawerCart from '@/components/DrawerCart';
import { isSessionStorageAvailable } from '@/lib/client-storage';

const CartContext = createContext();

export function CartProvider({ children }) {
  const STORED_CART_NAME = "jardin_des_chefs_charlevoix_shopping_cart"
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [taxes, setTaxes] = useState({
    items: [],
    taxSummary: {},
    totalTax: 0
  });
  const [taxError, setTaxError] = useState(false);
  const [province, setProvince] = useState('QC'); // Default to Quebec
  const [deliveryMethod, setDeliveryMethod] = useState(() => {
    if (typeof window !== 'undefined' && isSessionStorageAvailable()) {
      const savedMethod = sessionStorage.getItem('deliveryMethod');
      return savedMethod || 'shipping';
    }
    return 'shipping';
  });

  const [shippingInitializing, setShippingInitializing] = useState(false);
  const [shippingInitialized, setShippingInitialized] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem(STORED_CART_NAME);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  // Initialize shipping calculator lazily
  useEffect(() => {
    const initShipping = async () => {
      if (shippingInitializing || shippingInitialized) {
        return; // Already initializing or initialized
      }
      
      setShippingInitializing(true);
      
      try {
        // Initialize the shipping calculator
        await shippingCalculator.initialize();
        setShippingInitialized(true);
        
        // Calculate initial shipping cost
        await updateShippingCost();
      } catch (error) {
        console.error('Error initializing shipping calculator:', error);
      } finally {
        setShippingInitializing(false);
      }
    };
    
    initShipping();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORED_CART_NAME, JSON.stringify(cart));
    }
  }, [cart, isLoading]);

  // Hide feedback message after a delay
  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => {
        setShowFeedback(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showFeedback]);

  // Update shipping cost whenever cart, province, or delivery method changes
  useEffect(() => {
    if (!isLoading) {
      updateShippingCost();
    }
  }, [cart, province, deliveryMethod, isLoading]);

  // Calculate taxes whenever cart or province changes
  useEffect(() => {
    const calculateTaxes = async () => {
      if (cart.length === 0) {
        setTaxes({
          items: [],
          taxSummary: {},
          totalTax: 0,
          appliedToShipping: false
        });
        setTaxError(false);
        return;
      }

      try {
        const response = await fetch('/api/calculate-taxes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cart,
            province: province,
            shipping: shippingCost
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate taxes');
        }

        const taxData = await response.json();
        
        // Check if the response contains an error property
        if (taxData.error) {
          throw new Error(taxData.error);
        }
        
        setTaxes(taxData);
        setTaxError(false);
      } catch (error) {
        console.error('Error calculating taxes:', error);
        // Instead of setting taxes to 0, mark that we have a tax error
        setTaxError(true);
      }
    };

    if (!isLoading && cart.length > 0) {
      calculateTaxes();
    }
  }, [cart, province, isLoading, deliveryMethod, shippingCost]);

  // Helper function to update shipping cost
  const updateShippingCost = useCallback(async () => {
    try {
      // Calculate shipping cost using the async calculator
      const cost = await shippingCalculator.calculateShipping(cart, deliveryMethod, province);
      setShippingCost(cost);
    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      
      // Fallback: use default calculated costs
      // Check if there are any non-booking shippable items
      const shippableItems = cart.some(item => 
        item.shipping_class !== 'only_pickup' && 
        item.shipping_class !== 'service_item' && 
        item.type !== 'mwb_booking'
      );
      
      setShippingCost(shippableItems && deliveryMethod === 'shipping' ? 15 : 0);
    }
  }, [cart, deliveryMethod, province]);

  // Helper function to check if there's a booking in the cart
  const hasBookingInCart = () => {
    return cart.some(item => 
      item.type === 'mwb_booking' || 
      (item.booking_details && Object.keys(item.booking_details).length > 0)
    );
  };

  // Find the existing booking in the cart
  const findExistingBooking = () => {
    return cart.find(item => 
      item.type === 'mwb_booking' || 
      (item.booking_details && Object.keys(item.booking_details).length > 0)
    );
  };

  // Handle booking confirmation
  const confirmBookingReplacement = () => {
    if (!pendingBooking) return;
    
    const { product, quantity, callback } = pendingBooking;
    
    // Remove any existing bookings first
    const newCart = cart.filter(item => 
      item.type !== 'mwb_booking' && 
      !(item.booking_details && Object.keys(item.booking_details).length > 0)
    );
    
    // Add the new booking
    newCart.push({ ...product, quantity });
    setCart(newCart);
    
    // Show feedback message
    setShowFeedback(true);
    
    // Reset booking confirmation state
    setShowBookingConfirmation(false);
    setPendingBooking(null);
    
    // Call the callback if provided
    if (callback && typeof callback === 'function') {
      callback();
    }
  };

  // Cancel booking replacement
  const cancelBookingReplacement = () => {
    setShowBookingConfirmation(false);
    setPendingBooking(null);
    
    // If there's a callback with cancel parameter, call it
    if (pendingBooking && pendingBooking.onCancel && typeof pendingBooking.onCancel === 'function') {
      pendingBooking.onCancel();
    }
  };

  const addToCart = (product, quantity = 1, options = {}) => {
    // Make sure quantity is a number
    const numericQuantity = parseInt(quantity, 10) || 1;
    
    // Check if this is a booking product
    const isBookingProduct = product.type === 'mwb_booking' || 
      (product.booking_details && Object.keys(product.booking_details).length > 0);
    
    // Special handling for booking products
    if (isBookingProduct && hasBookingInCart()) {
      // Store the pending booking and show confirmation
      setPendingBooking({ 
        product, 
        quantity: numericQuantity, 
        callback: options.onSuccess,
        onCancel: options.onCancel
      });
      setShowBookingConfirmation(true);
      return false; // Return false to indicate we need confirmation
    }
    
    // Regular flow for non-booking products or when no booking exists
    setCart(prevCart => {
      // For booking products, always add as new (don't update existing)
      if (isBookingProduct) {
        // Remove any existing bookings first (safety check)
        const filteredCart = prevCart.filter(item => 
          item.type !== 'mwb_booking' && 
          !(item.booking_details && Object.keys(item.booking_details).length > 0)
        );
        return [...filteredCart, { ...product, quantity: numericQuantity }];
      }
      
      // Regular products - check if product already in cart
      const existingItemIndex = prevCart.findIndex(item => item.id === product.id);

      if (existingItemIndex >= 0) {
        // If product exists, update quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + numericQuantity
        };
        return updatedCart;
      } else {
        // If product doesn't exist, add it
        return [...prevCart, { ...product, quantity: numericQuantity }];
      }
    });
    
    // Show feedback message
    setShowFeedback(true);
    
    // Call success callback if provided
    if (options.onSuccess && typeof options.onSuccess === 'function') {
      options.onSuccess();
    }
    
    return true; // Return true to indicate success
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    // Make sure quantity is a number
    const numericQuantity = parseInt(quantity, 10);
    
    if (numericQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId ? { ...item, quantity: numericQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  const getShippingCost = () => {
    // Return the pre-calculated shipping cost
    return shippingCost;
  };

  const getCartTotal = () => {
    const subtotal = getCartSubtotal();
    
    // Return null if there's a tax error, indicating the total can't be calculated
    if (taxError) {
      return null;
    }
    
    return subtotal + taxes.totalTax + shippingCost;
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const updateProvince = (provinceCode) => {
    if (!provinceCode) return; // Safety check

    // Use setTimeout to move the state update out of the render cycle
    setTimeout(() => {
      setProvince(provinceCode.toUpperCase());
    }, 0);
  };

  const updateDeliveryMethod = (method) => {
    setDeliveryMethod(method);
    // Also save to sessionStorage
    try {
      sessionStorage.setItem('deliveryMethod', method);
    } catch (error) {
      console.error('Error saving delivery method to sessionStorage:', error);
    }
  };

  // Check if the cart can proceed to checkout
  const canCheckout = () => {
    return !taxError && cart.length > 0;
  };

  // Get existing booking details for display
  const getExistingBookingDetails = () => {
    const existingBooking = findExistingBooking();
    return existingBooking;
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartSubtotal,
      getCartTotal,
      getTotalItems,
      getShippingCost,
      taxes,
      taxError,
      updateProvince,
      province,
      isLoading,
      showFeedback,
      setShowFeedback,
      deliveryMethod,
      updateDeliveryMethod,
      canCheckout,
      // shipping states
      shippingInitialized,
      shippingInitializing,
      // New booking confirmation related values
      showBookingConfirmation,
      confirmBookingReplacement,
      cancelBookingReplacement,
      getExistingBookingDetails,
      hasBookingInCart
    }}>
      {children}

      {/* Existing Cart Drawer */}
      <DrawerCart
        trigger={{
          content: (
            <>
              {showFeedback && (
                <div className="cart-feedback">
                  Item ajouté au panier!
                </div>
              )}
            </>
          ),
        }}
      />
      
      {/* Booking Confirmation Dialog */}
      {showBookingConfirmation && (
        <div className="booking-confirmation-overlay">
          <div className="booking-confirmation-dialog">
            <h3>Remplacer la réservation existante?</h3>
            <p>
              Vous avez déjà une réservation dans votre panier. 
              Ajouter cette nouvelle réservation remplacera la réservation existante.
            </p>
            <div className="confirmation-buttons">
              <button onClick={cancelBookingReplacement}>Annuler</button>
              <button onClick={confirmBookingReplacement}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
