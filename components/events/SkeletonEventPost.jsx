import styles from '@/styles/events/EventList.module.css';

export default function SkeletonEventPost() {
  return (
    <article className={styles.eventPost}>
      <header className={styles.postHeader}>
        <div className={styles.postMeta}>
          <div className={styles.skeletonDate}></div>
        </div>
        <div className={styles.skeletonTitle}></div>
      </header>
      
      <div className={styles.skeletonImage}></div>
      
      <div className={styles.postContent}>
        <div className={styles.skeletonText}></div>
        <div className={styles.skeletonText}></div>
        <div className={styles.skeletonText}></div>
        <div className={styles.skeletonText}></div>
      </div>
      
      <div className={styles.postFooter}>
        <div className={styles.skeletonReadMore}></div>
      </div>
    </article>
  );
}
