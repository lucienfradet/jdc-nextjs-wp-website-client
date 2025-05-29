"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useLoading } from '@/components/loading/LoadingManager';
import styles from '@/styles/PageRevealAnimation.module.css';

const PageRevealAnimation = ({ minLoadTime = 1000, onRevealComplete }) => {
  const { isInitialLoading, isRevealing, startReveal, completeReveal } = useLoading();
  const [isClient, setIsClient] = useState(false);
  const onRevealCompleteRef = useRef(onRevealComplete);
  const hasStartedRef = useRef(false); // Prevent multiple starts
  
  // Update ref when callback changes
  useEffect(() => {
    onRevealCompleteRef.current = onRevealComplete;
  }, [onRevealComplete]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Prevent running multiple times
    if (!isClient || !isInitialLoading || hasStartedRef.current) return;

    console.log('PageReveal: Starting animation sequence (once only)');
    hasStartedRef.current = true; // Mark as started
    
    let isMounted = true;
    let revealTimer;
    let completeTimer;
    
    // Keep initial loading state
    if (typeof document !== 'undefined') {
      document.body.classList.add('page-loading');
      document.body.classList.remove('page-loaded', 'page-revealing');
      console.log('PageReveal: Added page-loading class');
    }
    
    // Wait for minimum load time, then start reveal
    revealTimer = setTimeout(() => {
      if (!isMounted) return;
      
      console.log('PageReveal: Starting reveal phase');
      startReveal();
      
      if (typeof document !== 'undefined') {
        document.body.classList.add('page-revealing');
        document.body.classList.remove('page-loading');
        console.log('PageReveal: Added page-revealing class');
      }
      
      // Complete reveal after animation duration
      completeTimer = setTimeout(() => {
        if (isMounted) {
          console.log('PageReveal: Completing reveal');
          if (typeof document !== 'undefined') {
            document.body.classList.add('page-loaded');
            document.body.classList.remove('page-loading', 'page-revealing');
            console.log('PageReveal: Added page-loaded class');
          }
          completeReveal();
          onRevealCompleteRef.current?.();
          console.log('PageReveal: Animation sequence complete');
        }
      }, 1500); // Reveal animation duration
    }, minLoadTime);
    
    return () => {
      isMounted = false;
      if (revealTimer) clearTimeout(revealTimer);
      if (completeTimer) clearTimeout(completeTimer);
      console.log('PageReveal: Cleanup completed');
    };
  }, [minLoadTime, isClient, isInitialLoading, startReveal, completeReveal]);

  // Add debug logging for state changes
  useEffect(() => {
    console.log('PageReveal states:', { isClient, isInitialLoading, isRevealing });
  }, [isClient, isInitialLoading, isRevealing]);

  // Show the reveal overlay during initial loading and revealing
  if (!isClient || (!isInitialLoading && !isRevealing)) {
    return null;
  }
  
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

export default PageRevealAnimation;
