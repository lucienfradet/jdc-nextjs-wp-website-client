import { useEffect, useState, useRef } from 'react';
import WPImage from '@/components/WPImage';
import WPContent from '@/components/wordpress/WPContent';
import styles from '@/styles/events/EventDetail.module.css';

export default function EventDetail({ post }) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);
  
  useEffect(() => {
    // Set the current URL when component mounts
    setCurrentUrl(window.location.href);
    
    // Cleanup function to clear any timeout on unmount
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);
  
  if (!post) return null;
  
  const { title, content, date, featuredImage } = post;
  
  // Format date
  const formattedDate = new Date(date).toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Handle share functionality
  const sharePost = (event) => {
    event.preventDefault();
    
    const postTitle = title.replace(/<[^>]*>/g, ''); // Remove HTML tags
    
    if (navigator.share) {
      navigator.share({
        title: postTitle,
        url: currentUrl
      })
      .then(() => console.log('Successfully shared'))
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(currentUrl)
        .then(() => {
          // Clear any existing timeout
          if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
          }
          
          // Show toast message
          setToastMessage('Lien copié dans le presse-papier!');
          setShowToast(true);
          
          // Hide message after 3 seconds
          toastTimeoutRef.current = setTimeout(() => {
            setShowToast(false);
          }, 3000);
        })
        .catch(() => {
          setToastMessage('Impossible de copier le lien. Veuillez copier l\'URL manuellement.');
          setShowToast(true);
          
          toastTimeoutRef.current = setTimeout(() => {
            setShowToast(false);
          }, 3000);
        });
    }
  };
  
  return (
    <article className={styles.eventDetail}>
      {/* Toast notification */}
      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title} dangerouslySetInnerHTML={{ __html: title }}></h1>
          <button 
            className={styles.shareButton} 
            onClick={sharePost}
            aria-label="Partager cet article"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
        </div>
        <div className={styles.meta}>
          <div className={styles.date}>{formattedDate}</div>
        </div>
      </header>
      
      {featuredImage && (
        <div className={styles.featuredImage}>
          <WPImage image={featuredImage} />
        </div>
      )}
      
      <WPContent content={content} className={styles.content} />
    </article>
  );
}
