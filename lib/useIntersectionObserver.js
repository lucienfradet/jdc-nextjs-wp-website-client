import { useEffect, useRef, useState, useCallback } from 'react';

export default function useIntersectionObserver(options = {}) {
  const [entries, setEntries] = useState([]);
  const observerRef = useRef(null);
  const elementsRef = useRef(new Set());
  const isMountedRef = useRef(true);

  // FIXED: Proper cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  // FIXED: Cleanup function
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      // Unobserve all elements first
      elementsRef.current.forEach(element => {
        if (element) {
          observerRef.current.unobserve(element);
        }
      });
      
      // Disconnect observer
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    
    // Clear the elements set
    elementsRef.current.clear();
  }, []);

  // FIXED: Observer callback with mounted check
  const observerCallback = useCallback((observerEntries) => {
    if (!isMountedRef.current) return;
    
    setEntries(observerEntries);
  }, []);

  // FIXED: Add scroll ref function with proper cleanup
  const addScrollRef = useCallback((element) => {
    if (!element || !isMountedRef.current) return;

    // Create observer if it doesn't exist
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(observerCallback, {
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1,
        ...options
      });
    }

    // Add element to our tracked set
    elementsRef.current.add(element);
    
    // Start observing
    observerRef.current.observe(element);

    // Return cleanup function for this specific element
    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
        elementsRef.current.delete(element);
      }
    };
  }, [observerCallback, options]);

  // FIXED: Recreate observer when options change
  useEffect(() => {
    // Clean up existing observer
    cleanup();
    
    // Don't create new observer if component is unmounted
    if (!isMountedRef.current) return;
    
    // Observer will be created on first addScrollRef call
    
    return cleanup;
  }, [cleanup, options.rootMargin, options.threshold]);

  return [addScrollRef, entries];
}
