import { useEffect, useState } from 'react';
import ShareButton from '@/components/common/ShareButton';
import WPImage from '@/components/WPImage';
import WPContent from '@/components/wordpress/WPContent';
import styles from '@/styles/events/EventDetail.module.css';

export default function EventDetail({ post }) {
  const [currentUrl, setCurrentUrl] = useState('');
  
  useEffect(() => {
    // Set the current URL when component mounts
    setCurrentUrl(window.location.href);
  }, []);
  
  if (!post) return null;
  
  const { title, content, date, featuredImage } = post;
  
  // Format date
  const formattedDate = new Date(date).toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Clean title for sharing
  const cleanTitle = title.replace(/<[^>]*>/g, ''); // Remove HTML tags
  
  return (
    <article className={styles.eventDetail}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title} dangerouslySetInnerHTML={{ __html: title }}></h1>
          <ShareButton url={currentUrl} title={cleanTitle}>
            <button 
              className={styles.shareButton} 
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
          </ShareButton>
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
