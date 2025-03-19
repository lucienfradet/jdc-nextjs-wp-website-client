import Link from 'next/link';
import WPImage from '@/components/WPImage';
import styles from '@/styles/events/EventCard.module.css';
import { useEffect, useState } from 'react';

export default function EventCard({ post }) {
  const { title, excerpt, content, date, slug, featuredImage } = post;
  const [firstContentImage, setFirstContentImage] = useState(null);
  
  // Format date
  const formattedDate = new Date(date).toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Clean excerpt for card - remove images and limit length
  const cleanExcerpt = excerpt
    // Remove image tags
    .replace(/<img[^>]*>/g, '')
    // Remove empty paragraphs that might result from removing images
    .replace(/<p>\s*<\/p>/g, '')
    // Remove other potentially problematic elements
    .replace(/<figure[^>]*>.*?<\/figure>/g, '');
  
  // Extract the first image from content if there's no text
  useEffect(() => {
    if (!cleanExcerpt || cleanExcerpt.trim() === '') {
      // Use regex to extract the first image from content
      const imgMatch = content.match(/<img[^>]+src="([^"]+)"[^>]*>/);
      if (imgMatch && imgMatch[1]) {
        const imgSrc = imgMatch[1];
        
        // Try to extract alt text if available
        const altMatch = imgMatch[0].match(/alt="([^"]+)"/);
        const imgAlt = altMatch ? altMatch[1] : title;
        
        setFirstContentImage({
          src: imgSrc,
          alt: imgAlt
        });
      }
    }
  }, [content, cleanExcerpt, title]);
  
  // Check if the excerpt has meaningful text content
  const hasTextContent = cleanExcerpt && cleanExcerpt.replace(/<[^>]*>/g, '').trim().length > 0;
  
  return (
    <article className={styles.eventCard}>
      <Link href={`/evenements/${slug}`} className={styles.cardLink} draggable="false">
        {featuredImage && (
          <div className={styles.imageContainer}>
            <WPImage image={featuredImage} className={styles.image} draggable="false" />
          </div>
        )}
        
        <div className={styles.content}>
          <div className={styles.date}>{formattedDate}</div>
          <h2 className={styles.title} dangerouslySetInnerHTML={{ __html: title }}></h2>
          
          {hasTextContent ? (
            <div 
              className={styles.excerpt} 
              dangerouslySetInnerHTML={{ __html: cleanExcerpt }}
            ></div>
          ) : firstContentImage ? (
            <div className={styles.inlineImageContainer}>
              <img 
                src={firstContentImage.src} 
                alt={firstContentImage.alt}
                className={styles.inlineImage}
                draggable="false"
              />
            </div>
          ) : null}
          
          <div className={styles.readMore}>Lire plus →</div>
        </div>
      </Link>
    </article>
  );
}
