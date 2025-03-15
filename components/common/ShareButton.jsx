'use client';

import { useState } from 'react';
import styles from '@/styles/events/EventList.module.css';

export default function ShareButton({ url, title, children }) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleShare = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Check if navigator.share is supported
    if (navigator.share) {
      navigator.share({
        title: title,
        url: url
      })
      .catch(error => {
        console.log('Error sharing:', error);
      });
    } else {
      // Fallback to clipboard copy
      navigator.clipboard.writeText(url)
        .then(() => {
          setToastMessage('Lien copié dans le presse-papier!');
          setShowToast(true);
          
          // Hide toast after 3 seconds
          setTimeout(() => {
            setShowToast(false);
          }, 3000);
        })
        .catch(() => {
          setToastMessage('Impossible de copier le lien. Veuillez copier l\'URL manuellement.');
          setShowToast(true);
          
          setTimeout(() => {
            setShowToast(false);
          }, 3000);
        });
    }
  };

  return (
    <>
      {/* Toast notification */}
      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
      
      {/* Wrap children with onClick handler */}
      <div onClick={handleShare} style={{ cursor: 'pointer' }}>
        {children}
      </div>
    </>
  );
}
