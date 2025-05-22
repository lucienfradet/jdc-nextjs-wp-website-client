'use client';
import { useEffect } from 'react';
import styles from '@/styles/RedirectPage.module.css';

export default function AbonnementPage() {
  useEffect(() => {
    // Redirect after 1.5 seconds
    const timer = setTimeout(() => {
      window.location.href = 'https://www.potagerdelacrapaudine.ca/services';
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Redirection en cours...</h1>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.message}>
          Vous êtes redirigé vers la plateforme d&apos;abonnement de nos partenaires des <strong>jardins de la crapaudine</strong>.
        </p>
        <p className={styles.submessage}>
          Si la redirection ne fonctionne pas automatiquement, cliquez sur le lien ci-dessous :
        </p>
        <a 
          href="https://www.potagerdelacrapaudine.ca/services"
          className={styles.button}
          target="_blank"
          rel="noopener noreferrer"
        >
          Accéder à la plateforme d&apos;abonnement
        </a>
      </div>
    </div>
  );
}
