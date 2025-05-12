"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCsrf } from '@/context/CsrfContext';
import styles from '@/styles/Unsubscribe.module.css';

export default function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(true);
  const searchParams = useSearchParams();
  const { csrfToken, isLoading: csrfLoading } = useCsrf();

  useEffect(() => {
    // Check if email is provided in the URL
    const emailParam = searchParams.get('email');

    if (emailParam) {
      setEmail(emailParam);

      // If email is provided and valid, process automatically
      if (!csrfLoading && csrfToken && /^\S+@\S+\.\S+$/.test(emailParam)) {
        handleUnsubscribe(emailParam);
        setShowForm(false); // Hide the form during automatic processing
      }
    }
  }, [searchParams, csrfToken, csrfLoading]);

  const handleUnsubscribe = async (emailToUse, token = null) => {
    // Use passed email or state email
    const emailValue = emailToUse || email;

    // Validate email
    if (!emailValue || !/^\S+@\S+\.\S+$/.test(emailValue)) {
      setStatus('error');
      setMessage('Veuillez entrer une adresse email valide');
      return;
    }

    // Don't submit if CSRF token is not yet loaded
    if (csrfLoading || !csrfToken) {
      setStatus('error');
      setMessage('Veuillez patienter, sécurisation de la connexion en cours...');
      return;
    }

    // Set loading state
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ 
          email: emailValue,
          token, 
          csrf_token: csrfToken // Include in body as well for compatibility
        }),
      });

      const data = await response.json();

      // Always show success message for privacy reasons,
      // even if the email doesn't exist
      setStatus('success');
      setMessage(data.message || 'Vous avez été désabonné avec succès');
    } catch (error) {
      setStatus('error');
      setMessage('Une erreur est survenue. Veuillez réessayer.');
      console.log(error);
      // Show the form again in case of error
      setShowForm(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleUnsubscribe();
  };

  return (
    <div className={styles.unsubscribeContainer}>
      <h1 className={styles.title}>Se désabonner de l&apos;infolettre</h1>

      {status === 'success' ? (
        <div className={styles.successMessage}>
          <p>{message}</p>
          <br />
          <p>Nous sommes désolés de vous voir partir. Si vous souhaitez vous réabonner, vous pouvez le faire depuis notre page d&apos;accueil.</p>
        </div>
      ) : (
          <>
            {status === 'loading' && (
              <div>
                Traitement de votre demande...
              </div>
            )}

            {status === 'error' && (
              <div>
                {message}
              </div>
            )}

            {showForm && (
              <>
                <p className={styles.description}>
                  Veuillez saisir votre adresse email pour vous désabonner de notre infolettre.
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="email" className={styles.label}>Adresse email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Votre adresse email"
                      className={styles.input}
                      required
                    />
                  </div>

                  {status === 'error' && (
                    <div className={styles.errorMessage}>{message}</div>
                  )}

                  <button 
                    type="submit" 
                    className={styles.button}
                    disabled={status === 'loading' || csrfLoading}
                  >
                    {status === 'loading' ? 'Traitement...' : 'Se désabonner'}
                  </button>
                </form>
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
