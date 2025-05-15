"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { newsletterSchema } from '@/lib/validationSchemas';
import { sanitizeString } from '@/lib/validation';
import { executeReCaptcha } from '@/lib/recaptcha';
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
  const [recaptchaError, setRecaptchaError] = useState(false);
  
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
      // Execute reCAPTCHA before form submission
      const recaptchaToken = await executeReCaptcha('newsletter_subscription');

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
          csrf_token: csrfToken, // Include in body as well for compatibility
          recaptchaToken // Add the reCAPTCHA token to the request
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        if (responseData.details && responseData.details.includes('reCAPTCHA')) {
          setRecaptchaError(true);
          throw new Error("Vérification de sécurité échouée. Veuillez réessayer.");
        }
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
          <div className={styles.errorMessage}>
            {message}
            {recaptchaError && (
              <span> Cela peut arriver si votre connexion est instable ou si vous utilisez un VPN.</span>
            )}
          </div>
        )}
        
        <div className={styles.privacyNote}>
          <small>
            Vous pouvez vous <a href="/unsubscribe">désabonner</a> à tout moment.<br/>
            Ce site est protégé par reCAPTCHA et la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">politique de confidentialité</a> et les 
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer"> conditions d&apos;utilisation</a> de Google s&apos;appliquent.
          </small>
        </div>
      </form>
    </div>
  );
}
