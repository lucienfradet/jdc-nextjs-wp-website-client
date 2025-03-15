"use client";

import { useEffect, useState } from "react";
import WPImage from "@/components/WPImage";
import CustomHead from '@/components/CustomHead';
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import { renderContent } from "@/lib/textUtils";
import styles from '@/styles/ContactPage.module.css';

export default function ContactPage({ 
  pageData,
  headerData,
  footerData,
  siteIconUrl,
  mapsApiKey
}) {
  const pageContent = pageData.acfFields;
  const [isMobile, setIsMobile] = useState(false);

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

  // Extract address for Google Maps
  const extractAddress = (contactInfo) => {
    const lines = contactInfo.split('\r\n');
    // Assume the first line is the street address and the second line is city, province, postal
    if (lines.length >= 2) {
      return `${lines[0]}, ${lines[1]}`;
    }
    return "Les Éboulements, QC, Canada"; // Fallback
  };

  const address = extractAddress(pageContent["contact-info"]);
  const encodedAddress = encodeURIComponent(address);

  return (
    <>
      <CustomHead
        title={pageContent["head-title"]}
        description={pageContent["head-description"]}
        canonicalUrl={pageContent["head-url"]}
        siteIconUrl={siteIconUrl}
      />

      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.contactBody}>
        {/* Background SVG that overlaps with header and footer */}
        <svg className={styles.backgroundSvg} viewBox="0 0 1440 1205" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#filter0_d_137_1369)">
            <path d="M-220 831.884C-220 831.884 -92.5609 613.431 42.5
              605.884C196.487 597.279 190.733 831.395 341.5 863.884C656.158
              931.691 368 104.384 518.5 58.8838C669 13.3836 602.276 275.949
              758.5 292.5C882.079 305.593 905.352 185.815 1026.5 213.5C1283
              272.116 641.609 1102.08 1002.5 1141.88C1295.1 1174.15 1532.5
              605.884 1532.5 605.884" stroke="url(#paint0_linear_137_1369)"
              strokeWidth="107"/>
          </g>
          <defs>
            <filter id="filter0_d_137_1369" x="-270.198" y="0.0927734" width="1856.05" height="1204.62" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dy="4"/>
              <feGaussianBlur stdDeviation="2"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_137_1369"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_137_1369" result="shape"/>
            </filter>
            <linearGradient id="paint0_linear_137_1369" x1="-220" y1="600.304" x2="1532.5" y2="600.464" gradientUnits="userSpaceOnUse">
              <stop stopColor="#24311B"/>
              <stop offset="1" stopColor="#F5F0E1"/>
            </linearGradient>
          </defs>
        </svg>

        <section className={styles.contactSection}>
          <div className={styles.mapContainer}>
            <iframe 
              src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${encodedAddress}`} 
              width="100%" 
              height="450" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps"
              className={styles.googleMap}
            />
          </div>

          <div className={styles.infoContainer}>
            <div className={styles.contactInfo}>
              <h1 className={styles.contactTitle}>{renderContent(pageContent["contact-h1"])}</h1>
              {renderContent(pageContent["contact-info"])}
            </div>

            {pageContent["side-img"] && (
              <div className={styles.sideImageContainer}>
                <WPImage 
                  image={pageContent["side-img"]} 
                  className={styles.sideImage} 
                />
              </div>
            )}
          </div>

        </section>
      </main>

      {isMobile ? (
        <MobileFooter pageData={footerData} />
      ) : (
        <DesktopFooter pageData={footerData} />
      )}
    </>
  );
}
