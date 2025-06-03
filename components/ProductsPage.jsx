"use client";

import { useEffect, useState } from "react";
import WPImage from "@/components/WPImage";
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import { renderContent } from "@/lib/textUtils";
import styles from '@/styles/ProductsPage.module.css';
import useIntersectionObserver from '@/lib/useIntersectionObserver';

export default function ProductsPage({ 
  pageData,
  headerData,
  footerData
}) {
  const pageContent = pageData.acfFields;
  const [isMobile, setIsMobile] = useState(false);

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

  // Extract products from pageContent dynamically
  const getProducts = () => {
    const products = [];
    let index = 1;
    
    // Loop through and find all img-produit-X and description-produit-X pairs
    while (pageContent[`img-produit-${index}`] && pageContent[`description-produit-${index}`]) {
      products.push({
        image: pageContent[`img-produit-${index}`],
        description: pageContent[`description-produit-${index}`],
        index: index
      });
      index++;
    }
    
    return products;
  };

  const products = getProducts();

  return (
    <>
      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.productsBody}>
        {/* Animated Background SVGs */}
        <div className={styles.backgroundAnimations}>
          <svg className={styles.floatingCircle1} width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="60" fill="var(--green)" opacity="0.08"/>
          </svg>
          
          <svg className={styles.floatingCircle2} width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="40" fill="var(--red)" opacity="0.06"/>
          </svg>
          
          <svg className={styles.floatingShape1} width="150" height="150" viewBox="0 0 150 150" fill="none">
            <path d="M75 10C95 30 140 45 130 85C120 125 95 140 75 130C55 120 40 95 30 75C20 55 35 10 75 10Z" fill="var(--pink)" opacity="0.05"/>
          </svg>
          
          <svg className={styles.floatingShape2} width="100" height="100" viewBox="0 0 100 100" fill="none">
            <path d="M50 5C70 15 95 25 90 50C85 75 70 95 50 90C30 85 5 70 10 50C15 30 30 5 50 5Z" fill="var(--blue)" opacity="0.07"/>
          </svg>
          
          <svg className={styles.floatingCircle3} width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="30" fill="var(--orange)" opacity="0.04"/>
          </svg>
          
          <svg className={styles.floatingShape3} width="90" height="90" viewBox="0 0 90 90" fill="none">
            <path d="M45 8C60 12 82 20 80 45C78 70 60 82 45 80C30 78 8 60 10 45C12 30 30 8 45 8Z" fill="var(--green)" opacity="0.06"/>
          </svg>
        </div>

        {/* Header Section */}
        <section 
          className={`${styles.headerSection} reveal-on-scroll`}
          ref={addScrollRef}
        >
          <div className={styles.headerContent}>
            <h1>{pageContent["h1-titre"]}</h1>
            {renderContent(pageContent["h1-paragraph"])}
          </div>
        </section>

        {/* Products Section */}
        <section className={styles.productsSection}>
          {products.map((product, index) => (
            <div 
              key={product.index}
              className={`${styles.productItem} ${index % 2 === 0 ? styles.productLeft : styles.productRight} reveal-on-scroll`}
              ref={addScrollRef}
            >
              <div className={styles.productImageContainer}>
                <WPImage 
                  image={product.image} 
                  className={styles.productImage}
                />
              </div>
              <div className={styles.productDescription}>
                {renderContent(product.description)}
              </div>
            </div>
          ))}
        </section>

        {/* Bottom Section */}
        {pageContent["paragraph-bas-de-page"] && (
          <section 
            className={`${styles.bottomSection} reveal-on-scroll`}
            ref={addScrollRef}
          >
            <div className={styles.bottomContent}>
              {renderContent(pageContent["paragraph-bas-de-page"])}
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
