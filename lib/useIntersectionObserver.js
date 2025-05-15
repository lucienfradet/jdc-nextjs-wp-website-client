// lib/useIntersectionObserver.js
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
    };
  }, [refs, options, callback]);

  // Utility function to add a ref
  const addRef = useCallback(ref => {
    if (ref && !refs.includes(ref)) {
      setRefs(prevRefs => [...prevRefs, ref]);
    }
  }, [refs]);

  return [addRef, entries];
}
