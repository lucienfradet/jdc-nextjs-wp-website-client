import React, { useState, useEffect } from 'react';
import styles from '@/styles/ClientLoadingOverlay.module.css';

const ClientLoadingOverlay = ({ minLoadTime = 500, onLoadingComplete }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(`Loading with minLoadTime: ${minLoadTime}ms`);
    
    // Clear any existing classes first to avoid conflicts
    document.body.classList.remove('page-loaded');
    // Set loading state
    document.body.classList.add('page-loading');
    
    // Don't remove overlay until animations have completed
    const revealTimer = setTimeout(() => {
      console.log("Starting reveal animation");
      
      // Add loaded class and remove loading class
      document.body.classList.add('page-loaded');
      document.body.classList.remove('page-loading');
      
      // Wait for all animations to complete before removing overlay
      const completeTimer = setTimeout(() => {
        console.log("Animation complete, removing overlay");
        setLoading(false);
        
        // Notify parent component that loading is truly complete
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      }, 2000); // Increased to ensure all transitions complete
      
      return () => clearTimeout(completeTimer);
    }, minLoadTime);
    
    return () => clearTimeout(revealTimer);
  }, [minLoadTime, onLoadingComplete]);

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
