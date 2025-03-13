'use client';

// components/events/EventsPage.jsx
import { useState, useEffect } from 'react';
import EventList from '@/components/events/EventList';
import CustomHead from '@/components/CustomHead';
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import styles from '@/styles/events/EventsPage.module.css';

export default function EventsPage({ 
  headerData, 
  footerData, 
  siteIconUrl, 
  postsData,
  currentPage 
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
      <CustomHead
        title="Événements - Le Jardin des chefs"
        description="Découvrez nos événements et actualités"
        canonicalUrl={`${process.env.NEXT_PUBLIC_SITE_URL}/evenements${currentPage > 1 ? `?page=${currentPage}` : ''}`}
        siteIconUrl={siteIconUrl}
      />

      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.eventsPage}>
        <h1 className={styles.pageTitle}>Événements</h1>
        <EventList initialData={postsData} />
      </main>

      {isMobile ? (
        <MobileFooter pageData={footerData} />
      ) : (
        <DesktopFooter pageData={footerData} />
      )}
    </>
  );
}
