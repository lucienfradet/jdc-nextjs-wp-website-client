'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import ShareButton from '@/components/common/ShareButton';
import WPImage from '@/components/WPImage';
import WPContent from '@/components/wordpress/WPContent';
import SkeletonEventPost from './SkeletonEventPost';
import styles from '@/styles/events/EventList.module.css';

export default function EventList({ initialData }) {
  const { posts, pagination } = initialData;
  const [processedPosts, setProcessedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Move the processing to useEffect to ensure it runs only client-side
  useEffect(() => {
    // Set a small minimum delay to avoid flashes of loading state on fast connections
    const timer = setTimeout(() => {
      const processed = posts.map(post => {
        try {
          // Create a wrapper to parse the HTML properly
          const wrapper = document.createElement('div');
          wrapper.innerHTML = post.content;

          // Get all top-level blocks (direct children of the wrapper)
          const elements = wrapper.children;

          // If not many blocks, show everything
          if (elements.length <= 5) {
            return {
              ...post,
              processedContent: post.content,
              needsTruncation: false
            };
          }

          // Create a new container for the truncated content
          const container = document.createElement('div');

          // Add the first few elements (typically 3-4 is good for previews)
          for (let i = 0; i < Math.min(4, elements.length); i++) {
            if (elements[i]) {
              container.appendChild(elements[i].cloneNode(true));
            }
          }

          return {
            ...post,
            processedContent: container.innerHTML + '<p style="font-weight: bold;">( ... )',
            needsTruncation: true
          };
        } catch (error) {
          console.error("Error processing post content:", error);

          // Fallback to simple string truncation
          const strippedContent = post.content.replace(/<[^>]*>/g, '');
          const maxLength = 300; // Shorter for fallback method

          if (strippedContent.length <= maxLength) {
            return {
              ...post,
              processedContent: post.content,
              needsTruncation: false
            };
          }

          // Simple truncation at paragraph
          let breakPoint = post.content.lastIndexOf('</p>', maxLength * 4);
          if (breakPoint === -1) breakPoint = maxLength * 4;

          return {
            ...post,
            processedContent: post.content.substring(0, breakPoint) + '...</p>',
            needsTruncation: true
          };
        }
      });

      setProcessedPosts(processed);
      setIsLoading(false);
    }, 500); // Minimum loading time of 500ms to avoid flash

    return () => clearTimeout(timer);
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
  
  // Loading state - show skeleton UI
  if (isLoading) {
    return (
      <div className={styles.eventList}>
        {posts.length === 0 ? (
          <div className={styles.noEvents}>
            <p>Aucun événement trouvé.</p>
          </div>
        ) : (
          <div className={styles.eventPosts}>
            {Array.from({ length: posts.length }).map((_, index) => (
              <SkeletonEventPost key={index} />
            ))}
          </div>
        )}
        {renderPagination()}
      </div>
    );
  }
  
  // Loaded state - show processed content
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
                  <div className={styles.headerTop}>
                    <div className={styles.postMeta}>
                      <time className={styles.postDate}>
                        {new Date(post.date).toLocaleDateString('fr-CA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    </div>
                    <ShareButton
                      url={`${process.env.NEXT_PUBLIC_SITE_URL}/evenements/${post.slug}`}
                      title={post.title.replace(/<[^>]*>/g, '')}
                    >
                      <button 
                        className={styles.shareButton} 
                        aria-label="Partager cet article"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3"></circle>
                          <circle cx="6" cy="12" r="3"></circle>
                          <circle cx="18" cy="19" r="3"></circle>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                      </button>
                    </ShareButton>
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
