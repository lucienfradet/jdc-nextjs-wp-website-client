'use client';

import { useState, useRef } from 'react';
import styles from '@/styles/events/EventList.module.css';

export default function ShareButton({ url, title, children }) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const textAreaRef = useRef(null);

  // Function to copy text using the fallback method (textarea element)
  const copyTextFallback = (text) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make the textarea out of viewport
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // Select and copy the text
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    } catch (err) {
      return false;
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // First try: Web Share API (best for mobile)
    if (navigator.share) {
      navigator.share({
        title: title,
        url: url
      })
      .catch(error => {
        console.log('Error sharing:', error);
        // If share fails, try clipboard methods
        tryClipboardMethods();
      });
    } else {
      // If Web Share API is not available, try clipboard methods
      tryClipboardMethods();
    }
  };

  const tryClipboardMethods = () => {
    // Second try: Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => {
          showSuccessMessage();
        })
        .catch(() => {
          // Third try: execCommand fallback
          const success = copyTextFallback(url);
          if (success) {
            showSuccessMessage();
          } else {
            showErrorMessage();
          }
        });
    } else {
      // Clipboard API not available, try execCommand fallback
      const success = copyTextFallback(url);
      if (success) {
        showSuccessMessage();
      } else {
        showErrorMessage();
      }
    }
  };

  const showSuccessMessage = () => {
    setToastMessage('Lien copié dans le presse-papier!');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const showErrorMessage = () => {
    setToastMessage('Impossible de copier le lien. Veuillez copier l\'URL manuellement.');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
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
