"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { newsletterSchema } from '@/lib/validationSchemas';
import { sanitizeString } from '@/lib/validation';
import styles from '@/styles/NewsletterForm.module.css';
import { useCsrf } from '@/context/CsrfContext';

export default function NewsletterForm({ 
  inputPlaceholder = "Votre email",
  buttonText = "S'abonner", 
  className = ""
}) {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const { csrfToken, isLoading: csrfLoading } = useCsrf();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(newsletterSchema),
    mode: 'onBlur'
  });
  
  const onSubmit = async (data) => {
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
      // Sanitize the email before submitting
      const sanitizedEmail = sanitizeString(data.email);
      
      // Call our Next.js API
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ 
          email: sanitizedEmail,
          csrf_token: csrfToken // Include in body as well for compatibility
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || "Échec de l'abonnement");
      }
      
      // Success!
      setStatus('success');
      setMessage(responseData.message || 'Abonnement réussi !');
      reset(); // Clear the form
    } catch (error) {
      // Handle existing subscribers or other errors
      setStatus('error');
      setMessage(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    }
  };
  
  return (
    <div className={`${styles.newsletterForm} ${className}`}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.inputWrapper}>
          <input
            type="email"
            {...register('email')}
            placeholder={inputPlaceholder}
            className={`${styles.emailInput} ${errors.email ? styles.inputError : ''}`}
            disabled={status === 'loading' || csrfLoading}
          />
          <button 
            type="submit" 
            className={styles.subscribeButton}
            disabled={status === 'loading' || csrfLoading}
          >
            {status === 'loading' ? 'Envoi...' : buttonText}
          </button>
        </div>
        
        {errors.email && (
          <div className={styles.errorMessage}>{errors.email.message}</div>
        )}
        
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
