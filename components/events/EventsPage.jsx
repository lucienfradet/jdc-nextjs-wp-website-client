'use client';

import { useState, useEffect } from 'react';
import EventList from '@/components/events/EventList';
import CustomHead from '@/components/CustomHead';
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import styles from '@/styles/events/EventsPage.module.css';
import loadingStyles from '@/styles/Loading.module.css';
import Loading from '@/components/loading/Loading';

export default function EventsPage({ 
  headerData, 
  footerData, 
  siteIconUrl, 
  postsData,
  currentPage 
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

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
  
  const handleContentProcessed = () => {
    setFadeOut(true);
    setTimeout(() => setIsLoading(false), 500);
  };

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
        {isLoading && (
          <div
            className={`${loadingStyles["loading-container"]} ${fadeOut ? loadingStyles["fade-out"] : ""}`}
          >
            <Loading />
          </div>
        )}
        <h1 className={styles.pageTitle}>Blog et Événements</h1>
        <EventList 
          initialData={postsData} 
          onContentProcessed={handleContentProcessed}
        />
      </main>

      {isMobile ? (
        <MobileFooter pageData={footerData} />
      ) : (
        <DesktopFooter pageData={footerData} />
      )}
    </>
  );
}
