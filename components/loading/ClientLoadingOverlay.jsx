import React, { useState, useEffect, useCallback } from 'react';
import styles from '@/styles/ClientLoadingOverlay.module.css';

const ClientLoadingOverlay = ({ minLoadTime = 500, onLoadingComplete }) => {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before showing
  useEffect(() => {
    setMounted(true);
  }, []);

  const completeLoading = useCallback(() => {
    setLoading(false);
    
    if (onLoadingComplete) {
      onLoadingComplete();
    }
  }, [onLoadingComplete]);

  useEffect(() => {
    if (!mounted) return;

    let isMounted = true;
    
    // Set loading state immediately
    if (typeof document !== 'undefined') {
      document.body.classList.remove('page-loaded');
      document.body.classList.add('page-loading');
    }
    
    // Wait for minimum load time
    const revealTimer = setTimeout(() => {
      if (!isMounted) return;
      
      if (typeof document !== 'undefined') {
        document.body.classList.add('page-loaded');
        document.body.classList.remove('page-loading');
      }
      
      // Complete loading after animations
      const completeTimer = setTimeout(() => {
        if (isMounted) {
          completeLoading();
        }
      }, 1500);
      
      return () => clearTimeout(completeTimer);
    }, minLoadTime);
    
    return () => {
      isMounted = false;
      clearTimeout(revealTimer);
    };
  }, [minLoadTime, completeLoading, mounted]);

  // Don't render anything on server or if not mounted
  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  // Return null early if not loading
  if (!loading) return null;
  
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingContent}>
        <div className={styles.revealLine} />
        <div className={styles.revealLine} />
        <div className={styles.revealLine} />
      </div>
    </div>
  );
};

export default ClientLoadingOverlay;
