import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // Try cookies first, then localStorage
    const savedCart = getCartFromStorage();
    if(savedCart) setCart(savedCart);
  }, []);

  const getCartFromStorage = () => {
    if(typeof window === 'undefined') return [];
    
    // Try cookies
    const cookieData = document.cookie.split('; ')
      .find(row => row.startsWith('cart='));
    if(cookieData) {
      return JSON.parse(decodeURIComponent(cookieData.split('=')[1]));
    }
    
    // Fallback to localStorage
    const localData = localStorage.getItem('cart');
    return localData ? JSON.parse(localData) : [];
  };

  const updateStorage = (cartData) => {
    const stringData = JSON.stringify(cartData);
    const encodedData = encodeURIComponent(stringData);
    
    // Set cookie with 7-day expiry
    document.cookie = `cart=${encodedData}; path=/; max-age=${7*24*60*60}`;
    
    // Set localStorage as fallback
    localStorage.setItem('cart', stringData);
  };

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const newCart = [...prev];
      const existing = newCart.find(item => item.id === product.id);
      
      if(existing) {
        existing.quantity += quantity;
      } else {
        newCart.push({ ...product, quantity });
      }
      
      updateStorage(newCart);
      return newCart;
    });
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateCart: setCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
