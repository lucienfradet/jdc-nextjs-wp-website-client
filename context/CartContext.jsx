"use client";

import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const STORED_CART_NAME = "jardin_des_chefs_charlevoix_shopping_cart"
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

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

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getTotalItems,
      isLoading,
      showFeedback,
      setShowFeedback
    }}>
      {children}
      {showFeedback && (
        <div className="cart-feedback">
          Item ajouté au panier!
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
