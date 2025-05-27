'use client';
import { useEffect } from 'react';
import styles from '@/styles/RedirectPage.module.css';

export default function AbonnementPage() {
  useEffect(() => {
    // Redirect after 1.5 seconds - opens in new tab
    const timer = setTimeout(() => {
      window.open('https://www.potagerdelacrapaudine.ca/services', '_blank');
      window.location.href = '/';
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoOut = () => {
    window.open('https://www.potagerdelacrapaudine.ca/services', '_blank');
    window.location.href = '/';
  };

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
        <div className={styles.buttonContainer}>
          <button 
            onClick={handleGoOut}
            className={`${styles.button} ${styles.homeButton}`}
          >
            Accéder à la plateforme d&apos;abonnement
          </button>
        </div>
        <div className={styles.buttonContainer}>
          <button 
            onClick={handleGoHome}
            className={`${styles.button} ${styles.homeButton}`}
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    </div>
  );
}
