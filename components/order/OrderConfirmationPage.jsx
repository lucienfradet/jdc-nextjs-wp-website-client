"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // Add useSearchParams
import { renderContent } from "@/lib/textUtils";
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import styles from '@/styles/checkout/OrderConfirmationPage.module.css';
import { useCart } from '@/context/CartContext';

export default function OrderConfirmationPage({ pageData, headerData, footerData }) {
  const pageContent = pageData.acfFields;
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const router = useRouter();
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check for order in URL first, then sessionStorage
    const loadOrderData = async () => {
      // Try to get order ID from URL
      const orderNumberFromUrl = searchParams.get('order');

      if (orderNumberFromUrl && !orderData) {
        setOrderData({ orderNumber: orderNumberFromUrl });
        clearCart();
        setIsLoading(false);
        return;
      }

      // If not in URL, check sessionStorage
      const storedOrderData = sessionStorage.getItem('orderConfirmation');
      if (storedOrderData) {
        setOrderData(JSON.parse(storedOrderData));
        sessionStorage.removeItem('orderConfirmation');
        clearCart();
        setIsLoading(false);
        return;
      }

      // No order data found in either place
      setIsLoading(false);
    };

    loadOrderData();
  }, [searchParams, clearCart]);

  // check if redirection is needed
  useEffect(() => {
    if (!isLoading && !orderData) {
      router.push('/');
    }
  }, [isLoading, orderData, router]);
  
  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991);
    };
    
    window.addEventListener("resize", handleResize);
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Show loading state
  if (!orderData) return null;
  
  return (
    <>
      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.confirmationContainer}>
        <div className={styles.confirmationCard}>
          <div className={styles.iconContainer}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          
          <h1>{renderContent(pageContent["h1-title"])}</h1>
          
          <p className={styles.orderNumber}>
            Numéro de confirmation: <strong>{orderData.orderNumber}</strong>
          </p>
          
          <div className={styles.confirmationMessage}>
            {renderContent(pageContent["message-confirmation"])}
          </div>
          
          <div className={styles.nextSteps}>
            {renderContent(pageContent["next-steps"])}
          </div>
          
          <div className={styles.contactInfo}>
            {renderContent(pageContent["contact-info"])}
          </div>
          
          <div className={styles.buttonContainer}>
            <Link href="/" className={styles.returnButton}>
              Retourner à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>

      {isMobile ? (
        <MobileFooter pageData={footerData} />
      ) : (
        <DesktopFooter pageData={footerData} />
      )}
    </>
  );
}
