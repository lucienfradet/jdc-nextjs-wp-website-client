"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CustomHead from '@/components/CustomHead';
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import styles from '@/styles/checkout/OrderConfirmationPage.module.css';

export default function OrderConfirmationPage({ headerData, footerData, siteIconUrl }) {
  const [isMobile, setIsMobile] = useState(false);
  
  // Generate a random order number for demonstration purposes
  const orderNumber = `JDC-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  
  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <>
      <CustomHead
        title="Confirmation de commande - Le Jardin des chefs"
        description="Merci pour votre commande!"
        canonicalUrl={process.env.NEXT_PUBLIC_SITE_URL + '/order-confirmation'}
        siteIconUrl={siteIconUrl}
      />

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
          
          <h1>Merci pour votre commande!</h1>
          
          <p className={styles.orderNumber}>
            Numéro de commande: <strong>{orderNumber}</strong>
          </p>
          
          <p className={styles.confirmationMessage}>
            Nous avons bien reçu votre commande et nous la préparons actuellement. Vous recevrez un courriel de confirmation avec les détails de votre commande.
          </p>
          
          <div className={styles.nextSteps}>
            <h2>Prochaines étapes</h2>
            <ul>
              <li>Vérifiez votre boîte de réception pour le courriel de confirmation.</li>
              <li>Si vous avez choisi le paiement par virement, suivez les instructions dans le courriel.</li>
              <li>Préparez-vous pour la cueillette à votre point de chute (si applicable).</li>
            </ul>
          </div>
          
          <div className={styles.contactInfo}>
            <p>
              Pour toute question concernant votre commande, n'hésitez pas à
              nous contacter par courriel à <a
                href="mailto:contact@jardindeschefs.com">contact@jardindeschefs.com</a>.
            </p>
          </div>
          
          <div className={styles.buttonContainer}>
            <Link href="/" className={styles.returnButton}>
              Retourner à l'accueil
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
