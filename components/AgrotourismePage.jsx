"use client";

import { useEffect, useState, useCallback } from "react";
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
  bookingProducts
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeImageSet, setActiveImageSet] = useState(0);
  const pageContent = pageData.acfFields;
  const SLIDE_INTERVAL = 5000; // Rotation time in milliseconds

  // Set up the intersection observer
  const [addScrollRef, observerEntries] = useIntersectionObserver({
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1
  });

  // Handle visibility based on intersection
  useEffect(() => {
    observerEntries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, [observerEntries]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Image rotation for mobile view
  useEffect(() => {
    if (!isMobile) return;
    
    // Add a small delay to ensure proper rendering before starting the rotation
    const initialTimer = setTimeout(() => {
      const rotationTimer = setInterval(() => {
        setActiveImageSet(prev => (prev === 0 ? 1 : 0));
      }, SLIDE_INTERVAL);
      
      return () => {
        clearInterval(rotationTimer);
      };
    }, 500);
    
    return () => {
      clearTimeout(initialTimer);
    };
  }, [isMobile, SLIDE_INTERVAL]);

  // Images array - assuming you'll provide these in the CMS
  // If not already in the CMS, you'll need to modify the data structure
  const introImages = [
    pageContent["image-gauche"],
    pageContent["image-droite"],
    pageContent["image-trois"] || pageContent["image-gauche"], // Fallback if not available
    pageContent["image-quatre"] || pageContent["image-droite"], // Fallback if not available
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
            
            {/* Images Gallery */}
            <div className={styles.imagesGallery}>
              {introImages.map((image, index) => {
                const isFirstSet = index < 2;
                const isVisible = !isMobile || (activeImageSet === 0 && isFirstSet) || (activeImageSet === 1 && !isFirstSet);
                
                // On desktop, display all images in a grid
                // On mobile, only display the active set
                return (
                  <div 
                    key={`intro-image-${index}`} 
                    className={`${styles.imageColumn} ${isMobile ? (isVisible ? styles.visible : styles.hidden) : ''}`}
                    style={{
                      // For desktop view, all images remain in the grid
                      // For mobile view, explicitly set grid positions for proper layout
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
                  onClick={() => setActiveImageSet(0)}
                  aria-label="View first set of images"
                />
                <button 
                  className={`${styles.indicator} ${activeImageSet === 1 ? styles.active : ''}`}
                  onClick={() => setActiveImageSet(1)}
                  aria-label="View second set of images"
                />
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

        {/* FAQ Section (optional) */}
        {pageContent["faq-titre"] && (
          <section className={`${styles.faqSection} reveal-on-scroll`} ref={addScrollRef}>
            <div className={styles.faqContainer}>
              <h2>{pageContent["faq-titre"]}</h2>
              <div className={styles.faqGrid}>
                {/* Display FAQ items if they exist in page content */}
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
