"use client";

import { useState } from 'react';
import styles from '@/styles/NewsletterForm.module.css';
import { useCsrf } from '@/context/CsrfContext';

export default function NewsletterForm({ 
  inputPlaceholder = "Votre email",
  buttonText = "S'abonner", 
  className = ""
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const { csrfToken, isLoading: csrfLoading } = useCsrf();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Don't submit if CSRF token is not yet loaded
    if (csrfLoading || !csrfToken) {
      setStatus('error');
      setMessage('Veuillez patienter, sécurisation de la connexion en cours...');
      return;
    }
    
    // Reset status
    setStatus('loading');
    setMessage('');
    
    try {
      // Call our Next.js API
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ 
          email,
          csrf_token: csrfToken // Include in body as well for compatibility
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Échec de l'abonnement");
      }
      
      // Success!
      setStatus('success');
      setMessage(data.message || 'Abonnement réussi !');
      setEmail(''); // Clear email field
    } catch (error) {
      // Handle existing subscribers or other errors
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
            disabled={status === 'loading' || csrfLoading}
            required
          />
          <button 
            type="submit" 
            className={styles.subscribeButton}
            disabled={status === 'loading' || csrfLoading}
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
