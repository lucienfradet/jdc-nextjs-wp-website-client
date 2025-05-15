"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { unsubscribeSchema } from '@/lib/validationSchemas';
import { sanitizeString } from '@/lib/validation';
import { executeReCaptcha } from '@/lib/recaptcha';
import { useCsrf } from '@/context/CsrfContext';
import styles from '@/styles/Unsubscribe.module.css';

export default function UnsubscribePage() {
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [recaptchaError, setRecaptchaError] = useState(false);
  const searchParams = useSearchParams();
  const { csrfToken, isLoading: csrfLoading } = useCsrf();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(unsubscribeSchema),
    mode: 'onBlur'
  });

  useEffect(() => {
    // Check if email is provided in the URL
    const emailParam = searchParams.get('email');

    if (emailParam) {
      // Set the value in the form
      setValue('email', emailParam);

      // If email is provided and valid, process automatically
      if (!csrfLoading && csrfToken && unsubscribeSchema.fields.email.isValidSync(emailParam)) {
        handleUnsubscribe({ email: emailParam });
        setShowForm(false); // Hide the form during automatic processing
      }
    }
  }, [searchParams, csrfToken, csrfLoading, setValue]);

  const handleUnsubscribe = async (data) => {
    // Don't submit if CSRF token is not yet loaded
    if (csrfLoading || !csrfToken) {
      setStatus('error');
      setMessage('Veuillez patienter, sécurisation de la connexion en cours...');
      return;
    }

    // Set loading state
    setStatus('loading');
    setMessage('');
    setRecaptchaError(false);

    try {
      // Execute reCAPTCHA before form submission
      const recaptchaToken = await executeReCaptcha('newsletter_unsubscribe');
      
      // Sanitize email
      const sanitizedEmail = sanitizeString(data.email);
      
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ 
          email: sanitizedEmail,
          csrf_token: csrfToken, // Include in body as well for compatibility
          recaptchaToken // Add the reCAPTCHA token
        }),
      });

      const responseData = await response.json();

      // Check if reCAPTCHA validation failed
      if (!response.ok) {
        if (responseData.details && responseData.details.includes('reCAPTCHA')) {
          setRecaptchaError(true);
          throw new Error("Vérification de sécurité échouée. Veuillez réessayer.");
        }
        throw new Error(responseData.message || "Une erreur est survenue");
      }

      // Always show success message for privacy reasons,
      // even if the email doesn't exist
      setStatus('success');
      setMessage(responseData.message || 'Vous avez été désabonné avec succès');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Une erreur est survenue. Veuillez réessayer.');
      console.log(error);
      // Show the form again in case of error
      setShowForm(true);
    }
  };

  return (
    <div className={styles.unsubscribeContainer}>
      <h1 className={styles.title}>Se désabonner de l&apos;infolettre</h1>

      {status === 'success' ? (
        <>
          <div className={styles.successMessage}>
            <p>{message}</p>
            <br />
            <p>Nous sommes désolés de vous voir partir. Si vous souhaitez vous réabonner, vous pouvez le faire depuis notre page d&apos;accueil.</p>
          </div>
          <div className={styles.successMessage}>
            <Link href="/" className={styles.button}>
              Page d&apos;accueil
            </Link>
          </div>
        </>
      ) : (
        <>
          {status === 'loading' && (
            <div>
              Traitement de votre demande...
            </div>
          )}

          {status === 'error' && (
            <div className={styles.errorMessage}>
              {message}
              {recaptchaError && (
                <span> Cela peut arriver si votre connexion est instable ou si vous utilisez un VPN.</span>
              )}
            </div>
          )}

          {showForm && (
            <>
              <p className={styles.description}>
                Veuillez saisir votre adresse email pour vous désabonner de notre infolettre.
              </p>

              <form onSubmit={handleSubmit(handleUnsubscribe)} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="email" className={styles.label}>Adresse email</label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Votre adresse email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  />
                  {errors.email && (
                    <div className={styles.errorMessage}>{errors.email.message}</div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className={styles.button}
                  disabled={status === 'loading' || csrfLoading}
                >
                  {status === 'loading' ? 'Traitement...' : 'Se désabonner'}
                </button>
              </form>
              
              <div className={styles.note}>
                <small>
                  Ce site est protégé par reCAPTCHA et la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">politique de confidentialité</a> et les 
                  <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer"> conditions d&apos;utilisation</a> de Google s&apos;appliquent.
                </small>
              </div>
            </>
          )}

          <p className={styles.note}>
            Si vous rencontrez des difficultés pour vous désabonner, veuillez nous contacter à{' '}
            <a href="mailto:contact@jardindeschefs.ca">contact@jardindeschefs.ca</a>
          </p>
        </>
      )}
    </div>
  );
}
