import { useState, useEffect, useCallback, useRef } from 'react';

export default function useIntersectionObserver(options = {}) {
  const [refs, setRefs] = useState([]);
  const [entries, setEntries] = useState([]);
  
  // Store observer instance to ensure we can clean it up properly
  const observerRef = useRef(null);
  
  // Store options in a ref - they're unlikely to change during component lifecycle
  const optionsRef = useRef({
    threshold: 0.1,
    ...options
  });
  
  const callback = useCallback((observedEntries) => {
    setEntries(observedEntries);
  }, []);
  
  useEffect(() => {
    // Clean up previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Don't create observer if no refs to observe
    if (refs.length === 0) return;
    
    // Create new observer with the initial options
    observerRef.current = new IntersectionObserver(callback, optionsRef.current);
    
    // Observe all current refs
    const currentRefs = refs.filter(Boolean);
    currentRefs.forEach(ref => {
      observerRef.current.observe(ref);
    });
    
    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [refs, callback]); // Only depend on refs and callback, not options!
  
  const addRef = useCallback((ref) => {
    if (ref && ref instanceof Element) {
      setRefs(prevRefs => {
        // Check if ref already exists
        if (!prevRefs.includes(ref)) {
          return [...prevRefs, ref];
        }
        return prevRefs;
      });
    }
  }, []);
  
  // Optional: Add a method to manually update options if needed
  const updateOptions = useCallback((newOptions) => {
    optionsRef.current = { threshold: 0.1, ...newOptions };
    // Trigger re-creation of observer by updating refs
    setRefs(prevRefs => [...prevRefs]);
  }, []);
  
  return [addRef, entries, updateOptions];
}
