"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useLoading } from '@/components/loading/LoadingManager';
import styles from '@/styles/PageRevealAnimation.module.css';

const PageRevealAnimation = ({ minLoadTime = 1000, onRevealComplete }) => {
  const { isInitialLoading, setIsInitialLoading, startReveal, completeReveal } = useLoading();
  const [showOverlay, setShowOverlay] = useState(true);
  const [startAnimation, setStartAnimation] = useState(false);
  const onRevealCompleteRef = useRef(onRevealComplete);
  const hasStartedRef = useRef(false);

  // Update ref when callback changes
  useEffect(() => {
    onRevealCompleteRef.current = onRevealComplete;
  }, [onRevealComplete]);

  useEffect(() => {
    // Only run once when initially loading
    if (!isInitialLoading) {
      return;
    }
    
    // console.log('PageReveal: Starting sequence');
    hasStartedRef.current = true;
    
    let readyTimer;
    let animationTimer;
    let cleanupTimer;
    
    // After minimum load time, make content visible and start animation
    readyTimer = setTimeout(() => {
      // console.log('PageReveal: Making content visible behind overlay');
      
      // Make content visible (but it's still hidden by the green overlay)
      completeReveal(); // Sets isReady to true
      
      // Small delay to ensure content is rendered before starting animation
      animationTimer = setTimeout(() => {
        // console.log('PageReveal: Starting reveal animation');
        setStartAnimation(true);
        startReveal();
        
        // Remove overlay after animation completes
        cleanupTimer = setTimeout(() => {
          // console.log('PageReveal: Animation complete, removing overlay');
          setShowOverlay(false);
          setIsInitialLoading(false);
          
          onRevealCompleteRef.current?.();
        }, 1200); // Animation duration
        
      }, 100); // Small delay to ensure content is rendered
      
    }, minLoadTime);
    
    return () => {
      if (readyTimer) clearTimeout(readyTimer);
      if (animationTimer) clearTimeout(animationTimer);
      if (cleanupTimer) clearTimeout(cleanupTimer);
    };
  }, [isInitialLoading, minLoadTime, startReveal, completeReveal]);

  // Don't render overlay if we're done
  if (!showOverlay) {
    return null;
  }
  
  return (
    <div className={`${styles.loadingOverlay} ${startAnimation ? styles.animating : ''}`}>
      <div className={styles.loadingContent}>
        <div className={styles.revealLine} />
        <div className={styles.revealLine} />
        <div className={styles.revealLine} />
      </div>
    </div>
  );
};

export default PageRevealAnimation;
