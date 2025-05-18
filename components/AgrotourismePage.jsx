"use client";

import { useEffect, useState } from "react";
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
  const pageContent = pageData.acfFields;

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

        {/* Info section with 2 images */}
        <section className={`${styles.infoSection} reveal-on-scroll`} ref={addScrollRef}>
          <div className={styles.infoContainer}>
            <div className={styles.imageColumn}>
              {pageContent["image-gauche"] && (
                <div className={styles.imageWrapper}>
                  <WPImage 
                    image={pageContent["image-gauche"]}
                    className={styles.infoImage}
                  />
                </div>
              )}
            </div>
            
            <div className={styles.textColumn}>
              <h2>{pageContent["titre-info"]}</h2>
              <div className={styles.infoText}>
                {renderContent(pageContent["texte-info"])}
              </div>
            </div>
            
            <div className={styles.imageColumn}>
              {pageContent["image-droite"] && (
                <div className={styles.imageWrapper}>
                  <WPImage 
                    image={pageContent["image-droite"]}
                    className={styles.infoImage}
                  />
                </div>
              )}
            </div>
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
