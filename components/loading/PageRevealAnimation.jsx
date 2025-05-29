"use client";
import React, { useState, useEffect } from 'react';
import { useLoading } from '@/components/loading/LoadingManager';
import styles from '@/styles/PageRevealAnimation.module.css';

const PageRevealAnimation = ({ minLoadTime = 1000, onRevealComplete }) => {
  const { isInitialLoading, startReveal, completeReveal } = useLoading();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let isMounted = true;
    
    // Keep initial loading state
    if (typeof document !== 'undefined') {
      document.body.classList.add('page-loading');
      document.body.classList.remove('page-loaded');
    }
    
    // Wait for minimum load time, then start reveal
    const revealTimer = setTimeout(() => {
      if (!isMounted) return;
      
      startReveal();
      
      if (typeof document !== 'undefined') {
        document.body.classList.add('page-revealing');
      }
      
      // Complete reveal after animation duration
      const completeTimer = setTimeout(() => {
        if (isMounted) {
          if (typeof document !== 'undefined') {
            document.body.classList.add('page-loaded');
            document.body.classList.remove('page-loading', 'page-revealing');
          }
          completeReveal();
          onRevealComplete?.();
        }
      }, 1500); // Reveal animation duration
      
      return () => clearTimeout(completeTimer);
    }, minLoadTime);
    
    return () => {
      isMounted = false;
      clearTimeout(revealTimer);
    };
  }, [minLoadTime, onRevealComplete, isClient, startReveal, completeReveal]);

  if (!isClient || !isInitialLoading) {
    return null;
  }
  
  return (
    <div className={styles.revealOverlay}>
      <div className={styles.revealContent}>
        <div className={styles.revealLine} />
        <div className={styles.revealLine} />
        <div className={styles.revealLine} />
      </div>
    </div>
  );
};

export default PageRevealAnimation;
