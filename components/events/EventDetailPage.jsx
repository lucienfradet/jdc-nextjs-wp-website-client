'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import EventDetail from '@/components/events/EventDetail';
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import styles from '@/styles/events/EventDetailPage.module.css';

export default function EventDetailPage({ 
  headerData, 
  footerData, 
  post 
}) {
  const [isMobile, setIsMobile] = useState(false);

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

      <main className={styles.eventDetailPage}>
        <div className={styles.backLinkContainer}>
          <Link href="/evenements" className={styles.backLink}>
            &larr; Retour aux événements
          </Link>
        </div>
        
        <EventDetail post={post} />
      </main>

      {isMobile ? (
        <MobileFooter pageData={footerData} />
      ) : (
        <DesktopFooter pageData={footerData} />
      )}
    </>
  );
}
