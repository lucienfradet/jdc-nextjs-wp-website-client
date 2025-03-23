"use client";

import { useState } from 'react';
import styles from '@/styles/NewsletterForm.module.css';

export default function NewsletterForm({ 
  inputPlaceholder = "Votre email",
  buttonText = "S'abonner", 
  className = ""
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Réinitialiser le statut
    setStatus('loading');
    setMessage('');
    
    try {
      // Appeler notre API Next.js
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Échec de l&apos;abonnement');
      }
      
      // Succès !
      setStatus('success');
      setMessage(data.message || 'Abonnement réussi !');
      setEmail(''); // Vider le champ email
    } catch (error) {
      // Gérer les abonnés existants ou autres erreurs
      setStatus('error');
      setMessage(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    }
  };
  
  return (
    <div className={`${styles.newsletterForm} ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={inputPlaceholder}
            className={styles.emailInput}
            disabled={status === 'loading'}
            required
          />
          <button 
            type="submit" 
            className={styles.subscribeButton}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Envoi...' : buttonText}
          </button>
        </div>
        
        {status === 'success' && (
          <div className={styles.successMessage}>{message}</div>
        )}
        
        {status === 'error' && (
          <div className={styles.errorMessage}>{message}</div>
        )}
        
        <div className={styles.privacyNote}>
          <small>
            Vous pouvez vous <a href="/unsubscribe">désabonner</a> à tout moment.
          </small>
        </div>
      </form>
    </div>
  );
}
