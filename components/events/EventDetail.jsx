import WPImage from '@/components/WPImage';
import styles from '@/styles/events/EventDetail.module.css';

export default function EventDetail({ post }) {
  if (!post) return null;
  
  const { title, content, date, featuredImage } = post;
  
  // Format date
  const formattedDate = new Date(date).toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <article className={styles.eventDetail}>
      <header className={styles.header}>
        <h1 className={styles.title} dangerouslySetInnerHTML={{ __html: title }}></h1>
        <div className={styles.meta}>
          <div className={styles.date}>{formattedDate}</div>
        </div>
      </header>
      
      {featuredImage && (
        <div className={styles.featuredImage}>
          <WPImage image={featuredImage} />
        </div>
      )}
      
      <div 
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
    </article>
  );
}
