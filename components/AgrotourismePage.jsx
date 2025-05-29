"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import WPImage from "@/components/WPImage";
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import BookingProductsList from "@/components/booking/BookingProductsList";
import styles from '@/styles/AgrotourismePage.module.css';
import { renderContent } from '@/lib/textUtils';
import useIntersectionObserver from '@/lib/useIntersectionObserver';

export default function AgrotourismePage({ 
  pageData,
  headerData,
  footerData,
  bookingProducts,
  showSwipeInstruction = false
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeImageSet, setActiveImageSet] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);

  // Use refs for cleanup - CRITICAL FIX
  const rotationTimerRef = useRef(null);
  const initialTimerRef = useRef(null);
  const isMountedRef = useRef(true); // Track if component is mounted
  
  const pageContent = pageData.acfFields;
  const SLIDE_INTERVAL = 5000;
  
  // Touch handling
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const [addScrollRef, observerEntries] = useIntersectionObserver({
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1
  });

  const clearAllTimers = useCallback(() => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = null;
    }
    if (initialTimerRef.current) {
      clearTimeout(initialTimerRef.current);
      initialTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Handle intersection observer visibility
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    observerEntries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, [observerEntries]);

  // Simplified resize handler with cleanup
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const handleResize = () => {
      if (!isMountedRef.current) return;
      setIsMobile(window.innerWidth <= 991);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Simplified timer management - only one effect
  useEffect(() => {
    // Clear any existing timers first
    clearAllTimers();
    
    // Only set up timer if mobile, mounted, and user hasn't interacted
    if (!isMobile || !isMountedRef.current || userInteracted) {
      return;
    }
    
    // Small delay before starting rotation
    initialTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current || userInteracted) return;
      
      rotationTimerRef.current = setInterval(() => {
        if (!isMountedRef.current) return;
        
        setActiveImageSet(prev => (prev === 0 ? 1 : 0));
      }, SLIDE_INTERVAL);
    }, 500);
    
    // Cleanup function
    return clearAllTimers;
  }, [isMobile, userInteracted, clearAllTimers, SLIDE_INTERVAL]);

  // Simplified indicator click handler
  const handleIndicatorClick = useCallback((setIndex) => {
    if (!isMountedRef.current) return;
    
    setActiveImageSet(setIndex);
    setUserInteracted(true);
    clearAllTimers(); // Stop all timers when user interacts
  }, [clearAllTimers]);
  
  // FIXED: Touch handlers with proper checks
  const onTouchStart = useCallback((e) => {
    if (!isMountedRef.current) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!isMountedRef.current) return;
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isMountedRef.current || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
      setUserInteracted(true);
      clearAllTimers();
      
      if (isLeftSwipe) {
        setActiveImageSet(prev => prev === 0 ? 1 : 0);
      } else if (isRightSwipe) {
        setActiveImageSet(prev => prev === 1 ? 0 : 1);
      }
    }
  }, [touchStart, touchEnd, clearAllTimers, minSwipeDistance]);

  // Images array
  const introImages = [
    pageContent["image-gauche"],
    pageContent["image-droite"],
    pageContent["image-trois"] || pageContent["image-gauche"],
    pageContent["image-quatre"] || pageContent["image-droite"],
  ];

  return (
    <>
      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.agrotourismeBody}>
        {/* Hero section */}
        <section className={`${styles.heroSection}`}>
          <div className={styles.heroContent}>
            <h1>{pageContent["titre-principal"]}</h1>
            <div className={styles.heroDescription}>
              {renderContent(pageContent["description-principale"])}
            </div>
          </div>
        </section>

        {/* Info section with 4 images */}
        <section className={`${styles.infoSection} reveal-on-scroll`} ref={addScrollRef}>
          <div className={styles.infoContainer}>
            {/* Text Column */}
            <div className={styles.textColumn}>
              <h2>{pageContent["titre-info"]}</h2>
              <div className={styles.infoText}>
                {renderContent(pageContent["texte-info"])}
              </div>
            </div>
            
            {/* FIXED: Images Gallery with proper event handlers */}
            <div 
              className={styles.imagesGallery}
              onTouchStart={isMobile ? onTouchStart : undefined}
              onTouchMove={isMobile ? onTouchMove : undefined}
              onTouchEnd={isMobile ? onTouchEnd : undefined}
            >
              {introImages.map((image, index) => {
                const isFirstSet = index < 2;
                const isVisible = !isMobile || (activeImageSet === 0 && isFirstSet) || (activeImageSet === 1 && !isFirstSet);
                
                return (
                  <div 
                    key={`intro-image-${index}`} 
                    className={`${styles.imageColumn} ${isMobile ? (isVisible ? styles.visible : styles.hidden) : ''}`}
                    style={{
                      gridColumn: isMobile ? (index % 2 === 0 ? "1" : "2") : "auto",
                      gridRow: isMobile ? (index < 2 ? "1" : "2") : "auto"
                    }}
                  >
                    {image && (
                      <div className={styles.imageWrapper}>
                        <WPImage 
                          image={image}
                          className={styles.infoImage}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Indicators for mobile view */}
            {isMobile && (
              <div className={styles.imageIndicators}>
                <button 
                  className={`${styles.indicator} ${activeImageSet === 0 ? styles.active : ''}`}
                  onClick={() => handleIndicatorClick(0)}
                  aria-label="View first set of images"
                />
                <button 
                  className={`${styles.indicator} ${activeImageSet === 1 ? styles.active : ''}`}
                  onClick={() => handleIndicatorClick(1)}
                  aria-label="View second set of images"
                />
              </div>
            )}
            
            {/* Optional swipe instruction */}
            {isMobile && showSwipeInstruction && (
              <div className={styles.swipeInstruction}>
                <p>Faire glisser pour naviguer</p>
              </div>
            )}
          </div>
        </section>

        {/* Booking section */}
        <section className={`${styles.bookingSection} reveal-on-scroll`} ref={addScrollRef}>
          <div className={styles.bookingContainer}>
            <h2>{pageContent["titre-visites"] || "Nos visites guidées"}</h2>
            <div className={styles.bookingDescription}>
              {renderContent(pageContent["description-visites"] || "Réservez dès maintenant une visite guidée de notre ferme.")}
            </div>
            
            <BookingProductsList 
              products={bookingProducts} 
            />
          </div>
        </section>

        {/* FAQ Section */}
        {pageContent["faq-titre"] && (
          <section className={`${styles.faqSection} reveal-on-scroll`} ref={addScrollRef}>
            <div className={styles.faqContainer}>
              <h2>{pageContent["faq-titre"]}</h2>
              <div className={styles.faqGrid}>
                {Array.from({ length: 4 }).map((_, index) => {
                  const questionKey = `faq-question-${index + 1}`;
                  const answerKey = `faq-reponse-${index + 1}`;
                  
                  if (pageContent[questionKey] && pageContent[answerKey]) {
                    return (
                      <div key={index} className={styles.faqItem}>
                        <h3>{pageContent[questionKey]}</h3>
                        {renderContent(pageContent[answerKey])}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      {isMobile ? (
        <MobileFooter pageData={footerData} />
      ) : (
        <DesktopFooter pageData={footerData} />
      )}
    </>
  );
}
