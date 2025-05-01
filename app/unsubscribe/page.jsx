"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '@/styles/Unsubscribe.module.css';

export default function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Vérifier si l'email est fourni dans l'URL
    const emailParam = searchParams.get('email');

    if (emailParam) {
      setEmail(emailParam);

      // Si l'email est fourni et valide, traitement automatique
      if (/^\S+@\S+\.\S+$/.test(emailParam)) {
        handleUnsubscribe(emailParam);
        setShowForm(false); // Masquer le formulaire pendant le traitement automatique
      }
    }
  }, [searchParams]);

  const handleUnsubscribe = async (emailToUse, token = null) => {
    // Utiliser l'email passé ou l'email d'état
    const emailValue = emailToUse || email;

    // Valider l'email
    if (!emailValue || !/^\S+@\S+\.\S+$/.test(emailValue)) {
      setStatus('error');
      setMessage('Veuillez entrer une adresse email valide');
      return;
    }

    // Définir l'état de chargement
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: emailValue,
          token 
        }),
      });

      const data = await response.json();

      // Toujours afficher un message de succès pour des raisons de confidentialité,
      // même si l'email n'existe pas
      setStatus('success');
      setMessage(data.message || 'Vous avez été désabonné avec succès');
    } catch (error) {
      setStatus('error');
      setMessage('Une erreur est survenue. Veuillez réessayer.');
      console.log(error);
      // Afficher à nouveau le formulaire en cas d'erreur
      setShowForm(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleUnsubscribe();
  };

  return (
    <div className={styles.unsubscribeContainer}>
      <h1 className={styles.title}>Se désabonner de l'infolettre</h1>

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
                    disabled={status === 'loading'}
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
