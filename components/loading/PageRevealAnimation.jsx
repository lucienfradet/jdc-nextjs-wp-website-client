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
      
      console.log('PageReveal: Starting reveal phase - making content visible AND starting animation');
      
      // Make content visible AND start reveal animation simultaneously
      startReveal();
      completeReveal(); // This sets isReady to true immediately
      
      if (typeof document !== 'undefined') {
        document.body.classList.add('page-revealing', 'page-loaded');
        document.body.classList.remove('page-loading');
        console.log('PageReveal: Added page-revealing and page-loaded classes');
      }
      
      // Clean up the reveal overlay after animation duration
      completeTimer = setTimeout(() => {
        if (isMounted) {
          console.log('PageReveal: Animation complete - cleaning up overlay');
          if (typeof document !== 'undefined') {
            document.body.classList.remove('page-revealing');
            console.log('PageReveal: Removed page-revealing class');
          }
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
  }, [minLoadTime, isClient, startReveal, completeReveal]); // Removed isInitialLoading from dependencies

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
