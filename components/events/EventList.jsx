'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import WPImage from '@/components/WPImage';
import WPContent from '@/components/wordpress/WPContent';
import styles from '@/styles/events/EventList.module.css';

export default function EventList({ initialData }) {
  const { posts, pagination } = initialData;
  const [processedPosts, setProcessedPosts] = useState([]);
  
  // Move the processing to useEffect to ensure it runs only client-side
  useEffect(() => {
    const processed = posts.map(post => {
      // Strip HTML tags for length calculation
      const strippedContent = post.content.replace(/<[^>]*>/g, '');
      const maxLength = 2000;
      
      // If content is not too long, show it entirely
      if (strippedContent.length <= maxLength) {
        return {
          ...post,
          processedContent: post.content,
          needsTruncation: false
        };
      }
      
      // Content is too long, truncate it
      // Find a good place to break (end of paragraph, sentence, etc.)
      let breakPoint = post.content.lastIndexOf('</p>', maxLength);
      if (breakPoint === -1) {
        breakPoint = post.content.lastIndexOf('. ', maxLength);
        if (breakPoint === -1) {
          breakPoint = maxLength;
        } else {
          breakPoint += 1; // Include the period
        }
      }
      
      return {
        ...post,
        processedContent: post.content.substring(0, breakPoint) + '...</p>', 
        needsTruncation: true
      };
    });
    
    setProcessedPosts(processed);
  }, [posts]);

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
  
  // First render - show a skeleton or simple version while processing
  if (processedPosts.length === 0) {
    return (
      <div className={styles.eventList}>
        {posts.length === 0 ? (
          <div className={styles.noEvents}>
            <p>Aucun événement trouvé.</p>
          </div>
        ) : (
          <div className={styles.eventPosts}>
            {posts.map(post => (
              <article key={post.id} className={styles.eventPost}>
                <header className={styles.postHeader}>
                  <div className={styles.postMeta}>
                    <time className={styles.postDate}>
                      {new Date(post.date).toLocaleDateString('fr-CA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                  <h2 className={styles.postTitle}>
                    <Link href={`/evenements/${post.slug}`}>
                      <span dangerouslySetInnerHTML={{ __html: post.title }}></span>
                    </Link>
                  </h2>
                </header>
                
                {post.featuredImage && (
                  <div className={styles.postImage}>
                    <WPImage image={post.featuredImage} />
                  </div>
                )}
                
                <div className={styles.postContent}>
                  <p>Chargement du contenu...</p>
                </div>
              </article>
            ))}
          </div>
        )}
        {renderPagination()}
      </div>
    );
  }
  
  // Full render with processed content
  return (
    <div className={styles.eventList}>
      {posts.length === 0 ? (
        <div className={styles.noEvents}>
          <p>Aucun événement trouvé.</p>
        </div>
      ) : (
        <>
          <div className={styles.eventPosts}>
            {processedPosts.map(post => (
              <article key={post.id} className={styles.eventPost}>
                <header className={styles.postHeader}>
                  <div className={styles.postMeta}>
                    <time className={styles.postDate}>
                      {new Date(post.date).toLocaleDateString('fr-CA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                  <h2 className={styles.postTitle}>
                    <Link href={`/evenements/${post.slug}`}>
                      <span dangerouslySetInnerHTML={{ __html: post.title }}></span>
                    </Link>
                  </h2>
                </header>
                
                {post.featuredImage && (
                  <div className={styles.postImage}>
                    <WPImage image={post.featuredImage} />
                  </div>
                )}
                
                <div className={styles.postContent}>
                  <WPContent content={post.processedContent} />
                </div>
                
                {post.needsTruncation && (
                  <div className={styles.postFooter}>
                    <Link 
                      href={`/evenements/${post.slug}`} 
                      className={styles.readMore}
                    >
                      Lire plus
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
}
