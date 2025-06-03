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
