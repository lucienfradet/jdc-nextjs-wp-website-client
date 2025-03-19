"use client";

import { useEffect, useState, useRef } from 'react';
import EventCard from '@/components/events/EventCard';
import styles from '@/styles/events/EventsSection.module.css';

export default function EventsSection({ title = "Événements et actualités" }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCentered, setIsCentered] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/latest-posts?count=3`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        
        const data = await response.json();
        setPosts(data.posts);
      } catch (error) {
        console.error('Error fetching latest posts:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPosts();
  }, []);

  // Check if scrolling is needed
  useEffect(() => {
    if (!posts.length || isLoading) return;
    
    const checkScrollWidth = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      // If scroll width is less than or equal to client width, content fits
      setIsCentered(container.scrollWidth <= container.clientWidth);
    };
    
    checkScrollWidth();
    window.addEventListener('resize', checkScrollWidth);
    
    return () => window.removeEventListener('resize', checkScrollWidth);
  }, [posts, isLoading]);

  return (
    <section className={styles.eventsSection}>
      <div className={styles.eventsContainer}>
        <h2>{title}</h2>
        
        <div 
          className={`${styles.eventsScrollContainer} ${isCentered ? styles.centered : ''}`}
          ref={scrollContainerRef}
        >
          {isLoading ? (
            <div className={styles.loading}>Chargement des événements...</div>
          ) : posts.length === 0 ? (
            <div className={styles.noEvents}>Aucun événement trouvé.</div>
          ) : (
            posts.map(post => (
              <div key={post.id} className={styles.eventCardWrapper}>
                <EventCard post={post} />
              </div>
            ))
          )}
        </div>
        
        {!isCentered && (
          <div className={styles.scrollHint}>
            <span>← Faites défiler pour voir plus →</span>
          </div>
        )}
      </div>
    </section>
  );
}
