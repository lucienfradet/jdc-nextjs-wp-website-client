import { useState, useEffect, useCallback } from 'react';

export default function useIntersectionObserver(options = {}) {
  const [refs, setRefs] = useState([]);
  const [entries, setEntries] = useState([]);
  
  const callback = useCallback((observedEntries) => {
    setEntries(observedEntries);
  }, []);
  
  useEffect(() => {
    const observer = new IntersectionObserver(callback, {
      threshold: 0.1,
      ...options,
    });
    
    const currentRefs = refs.filter(Boolean);
    
    currentRefs.forEach(ref => observer.observe(ref));
    
    return () => {
      currentRefs.forEach(ref => observer.unobserve(ref));
      observer.disconnect();
    };
  }, [refs, options, callback]);
  
  // Fixed: Remove dependency on refs to prevent infinite loops
  const addRef = useCallback(ref => {
    if (ref) {
      setRefs(prevRefs => {
        // Check if ref already exists using the functional update pattern
        if (!prevRefs.includes(ref)) {
          return [...prevRefs, ref];
        }
        return prevRefs; // Return same array if ref already exists
      });
    }
  }, []); // No dependencies!
  
  return [addRef, entries];
}
