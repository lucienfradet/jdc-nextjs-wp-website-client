"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import shippingCalculator from '@/lib/shipping/ShippingCalculator';
import DrawerCart from '@/components/DrawerCart';
import { isStorageAvailable } from '@/lib/client-storage';

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
    if (typeof window !== 'undefined' && isStorageAvailable('session')) {
      const savedMethod = sessionStorage.getItem('deliveryMethod');
      return savedMethod || 'shipping';
    }
    return 'shipping';
  });
  const [shippingLoaded, setShippingLoaded] = useState(false);

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

    // Initialize shipping calculator
    const initShipping = async () => {
      await shippingCalculator.initialize();
      setShippingLoaded(true);
    };
    
    if (initShipping) {
      console.log("initShipping is not coded yet, see CartContext:50");
    }
    
    //THIS IS NOT READY
    // initShipping();
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

  // Calculate taxes whenever cart or province changes
  useEffect(() => {
    const calculateTaxes = async () => {
      const shippingCost = getShippingCost();

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
  }, [cart, province, isLoading, deliveryMethod, shippingLoaded]);

  const addToCart = (product, quantity = 1) => {
    // Make sure quantity is a number
    const numericQuantity = parseInt(quantity, 10) || 1;
    
    setCart(prevCart => {
      // Check if product already in cart
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
    // If shipping calculator isn't loaded yet, use a default value
    if (!shippingLoaded) {
      const shippableItems = cart.some(item => item.shipping_class !== 'only_pickup');
      return shippableItems && deliveryMethod === 'shipping' ? 15 : 0;
    }
    
    // Otherwise, use the shipping calculator
    return shippingCalculator.calculateShipping(cart, deliveryMethod);
  };

  const getCartTotal = () => {
    const subtotal = getCartSubtotal();
    const shipping = getShippingCost();
    
    // Return null if there's a tax error, indicating the total can't be calculated
    if (taxError) {
      return null;
    }
    
    return subtotal + taxes.totalTax + shipping;
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
      canCheckout
    }}>
      {children}

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
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
