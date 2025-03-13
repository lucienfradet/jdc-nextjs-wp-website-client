'use client';

import Link from 'next/link';
import EventCard from './EventCard';
import styles from '@/styles/events/EventList.module.css';

export default function EventList({ initialData }) {
  const { posts, pagination } = initialData;

  // Generate pagination links
  const renderPagination = () => {
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= 1) return null;
    
    const pages = [];
    
    // Previous button
    if (currentPage > 1) {
      pages.push(
        <Link 
          key="prev" 
          href={`/evenements?page=${currentPage - 1}`}
          className={styles.pageLink}
        >
          &laquo; Précédent
        </Link>
      );
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Link 
          key={i}
          href={`/evenements?page=${i}`}
          className={`${styles.pageLink} ${i === currentPage ? styles.active : ''}`}
        >
          {i}
        </Link>
      );
    }
    
    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <Link 
          key="next" 
          href={`/evenements?page=${currentPage + 1}`}
          className={styles.pageLink}
        >
          Suivant &raquo;
        </Link>
      );
    }
    
    return (
      <div className={styles.pagination}>
        {pages}
      </div>
    );
  };
  
  return (
    <div className={styles.eventList}>
      {posts.length === 0 ? (
        <div className={styles.noEvents}>
          <p>Aucun événement trouvé.</p>
        </div>
      ) : (
        <>
          <div className={styles.eventGrid}>
            {posts.map(post => (
              <EventCard key={post.id} post={post} />
            ))}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
}
