"use client";

import { useEffect, useState, useRef } from "react";
import WPImage from "@/components/WPImage";
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import ProductGrid from '@/components/products/ProductGrid';
import styles from '@/styles/abonnement.module.css';
import { renderContent } from '@/lib/textUtils';

export default function Abonnement({ 
  pageData,
  headerData,
  footerData,
  pointDeChute,
  products
}) {
  const pageContent = pageData.acfFields;
  const [isMobile, setIsMobile] = useState(false);
  const panierRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991); // Define breakpoint for mobile/tablet
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Function to scroll to the panier section
  const scrollToPanier = () => {
    if (panierRef.current) {
      panierRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <>
      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.Body}>
        <section className={styles.introSection}>
          <h2>{pageContent["intro-title"]}</h2>
          <div className={styles.introContainer}>
            <div className={styles.containerLeft}>
              {renderContent(pageContent["paragraphe-explicatif"])}
            </div>
            <div className={styles.containerRight}>
              <WPImage className={styles.imgIntro} image={pageContent["intro-img"]} />
            </div>
          </div>
        </section>

        <section className={styles.bonifSection}>
          <div className={styles.bonifContainer}>
            <div className={styles.containerLeft}>
              <h2>{pageContent["bonif-title"]}</h2>
              <div className={styles.TableContainer}>
                {/* Row of 4 rectangles */}
                <div className={styles.rectanglesRow}>
                  <div 
                    className={styles.rectangle} 
                    onClick={scrollToPanier} 
                    style={{ cursor: 'pointer' }}
                  >
                    {pageContent["forfaits-noms"]["forfait-1"]}
                  </div>
                  <div 
                    className={styles.rectangle} 
                    onClick={scrollToPanier} 
                    style={{ cursor: 'pointer' }}
                  >
                    {pageContent["forfaits-noms"]["forfait-2"]}
                  </div>
                  <div 
                    className={styles.rectangle} 
                    onClick={scrollToPanier} 
                    style={{ cursor: 'pointer' }}
                  >
                    {pageContent["forfaits-noms"]["forfait-3"]}
                  </div>
                  <div 
                    className={styles.rectangle} 
                    onClick={scrollToPanier} 
                    style={{ cursor: 'pointer' }}
                  >
                    {pageContent["forfaits-noms"]["forfait-4"]}
                  </div>
                </div>

                {/* Row of values */}
                <div className={styles.valuesRow}>
                  <span className={styles.value}>{pageContent["bonifications-pourcentage"]["bonif-1"]}</span>
                  <span className={styles.value}>{pageContent["bonifications-pourcentage"]["bonif-2"]}</span>
                  <span className={styles.value}>{pageContent["bonifications-pourcentage"]["bonif-3"]}</span>
                  <span className={styles.value}>{pageContent["bonifications-pourcentage"]["bonif-4"]}</span>
                </div>

                <div className={styles.separator} />

                <div className={styles.suplementaire}>Suplémentaire</div>
              </div>
            <WPImage className={styles.imgBonif} image={pageContent["bonif-img"]} />
            </div>

            <div className={styles.containerRight}>
              {renderContent(pageContent["paragraphe-explicatif-bonif"])}
            </div>
          </div>

          <svg width="3929" height="937" viewBox="0 0 3929 937" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M35 739.5C35 739.5 682.5 197.549 1151 279C1299.33 304.788 1330.86 526.561 1469.5 585.256C1738.59 699.178 1741.96 -51.8941 2009 66.7557C2218.77 159.959 1977.52 658.674 2204 621.256C2334.79 599.646 2366.63 384.176 2499 377C3177 340.244 3896 894 3896 894" stroke="url(#paint0_linear_291_82)" strokeWidth="107"/>
            <defs>
              <linearGradient id="paint0_linear_291_82" x1="35" y1="383.5" x2="3856.5" y2="383.945" gradientUnits="userSpaceOnUse">
                <stop offset="0.0433595" stopColor="#24311B" stopOpacity="0"/>
                <stop offset="0.305" stopColor="#24311B"/>
                <stop offset="0.74" stopColor="#F5F0E1"/>
                <stop offset="0.884955" stopColor="#F5F0E1" stopOpacity="0"/>
              </linearGradient>
            </defs>
          </svg>
        </section>

        <section className={styles.paimentSection}>
          <div className={styles.paimentContainer}>
            <h2>{pageContent["paiments-h1"]}</h2>
            <div className={styles.paimentWrapper}>
              <div className={styles.paimentTextSide}>
                <h3>{pageContent["paiments-virement-h2"]}</h3>
                {renderContent(pageContent["paiments-virement-p"])}
              </div>
              <div className={styles.paimentTextSide}>
                <h3>{pageContent["paiments-credit-h2"]}</h3>
                {renderContent(pageContent["paiments-credit-p"])}

                <h3>{pageContent["point-de-chute-h2"]}</h3>
                {renderContent(pageContent["point-de-chute-p"])}
                {/* Map through the point-de-chute and display them */}
                <div className={styles.pointDeChuteContainer}>
                  {pointDeChute.map((point) => (
                    <div key={point.id} className={styles.pointDeChute}>
                      <h4>{point.location_name}</h4>
                      <p>
                        {point.adresse.adresse}, {point.adresse.city}, {point.adresse.code_postale}, {point.adresse.province}, {point.adresse.pays}
                      </p>
                      <p>
                      </p>
                      {point.description_instructions && (
                        <p>
                          <strong>{point.description_instructions}</strong>
                        </p>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
          <div className={styles.overlay}></div>
          <WPImage className={styles.imgPaimentBackground} image={pageContent["img-paiments-background"]} forceFullSize={true} />
        </section>

        <section ref={panierRef} className={styles.panierContainer}>
          <h2>{pageContent["panier-h2"]}</h2>
        </section>
        <ProductGrid 
          products={products}
          showDescription={true}
          showQuantity={true}
          showRemove={false}
          showAddToCart={true}
        />

        {isMobile ? (
          <MobileFooter pageData={footerData} />
        ) : (
            <DesktopFooter pageData={footerData} />
          )}
      </main>
    </>
  );
}
