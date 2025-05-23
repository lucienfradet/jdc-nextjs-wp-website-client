"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/styles/ClientLoadingOverlay.module.css';

const ClientLoadingOverlay = ({ minLoadTime = 500, onLoadingComplete }) => {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

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
          setLoading(false);
          onLoadingComplete?.();
        }
      }, 1500);
      
      return () => clearTimeout(completeTimer);
    }, minLoadTime);
    
    return () => {
      isMounted = false;
      clearTimeout(revealTimer);
    };
  }, [minLoadTime, onLoadingComplete, isClient]);

  // Don't render anything on server to prevent hydration mismatch
  if (!isClient) {
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
