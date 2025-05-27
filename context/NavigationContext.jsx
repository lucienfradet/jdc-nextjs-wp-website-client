"use client";

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef(null);

  // Clear navigation state when route actually changes
  useEffect(() => {
    if (isNavigating) {
      setIsNavigating(false);
    }
    
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [pathname, searchParams]);

  // Auto-clear navigation state after a timeout (fallback)
  useEffect(() => {
    if (isNavigating) {
      timeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
      }, 10000); // 10 second fallback
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isNavigating]);

  const startNavigation = () => {
    setIsNavigating(true);
  };
  
  const stopNavigation = () => {
    setIsNavigating(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <NavigationContext.Provider value={{ 
      isNavigating, 
      startNavigation, 
      stopNavigation 
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
