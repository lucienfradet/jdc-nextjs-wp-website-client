import Link from 'next/link';
import WPImage from '@/components/WPImage';
import styles from '@/styles/events/EventCard.module.css';

export default function EventCard({ post }) {
  const { title, excerpt, date, slug, featuredImage } = post;
  
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
  
  return (
    <article className={styles.eventCard}>
      <Link href={`/evenements/${slug}`} className={styles.cardLink}>
        {featuredImage && (
          <div className={styles.imageContainer}>
            <WPImage image={featuredImage} className={styles.image} />
          </div>
        )}
        
        <div className={styles.content}>
          <div className={styles.date}>{formattedDate}</div>
          <h2 className={styles.title} dangerouslySetInnerHTML={{ __html: title }}></h2>
          <div 
            className={styles.excerpt} 
            dangerouslySetInnerHTML={{ __html: cleanExcerpt }}
          ></div>
          <div className={styles.readMore}>Lire plus →</div>
        </div>
      </Link>
    </article>
  );
}
