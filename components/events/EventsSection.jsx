// components/events/EventsSection.jsx
// This component will display latest events in a horizontal scrollable section
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

  // Setup horizontal drag scrolling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false; // Track if user is actually dragging or just clicking
    
    const handleMouseDown = (e) => {
      // Prevent default behavior for all elements during mousedown
      e.preventDefault();
      
      isDown = true;
      isDragging = false; // Reset drag detection
      scrollContainer.classList.add(styles.grabbing);
      startX = e.pageX - scrollContainer.offsetLeft;
      scrollLeft = scrollContainer.scrollLeft;
    };
    
    const handleMouseLeave = () => {
      isDown = false;
      scrollContainer.classList.remove(styles.grabbing);
    };
    
    const handleMouseUp = (e) => {
      isDown = false;
      scrollContainer.classList.remove(styles.grabbing);
      
      // If it wasn't a drag, don't interfere with link clicks
      if (!isDragging) {
        return;
      }
      
      // If it was a drag, prevent link navigation
      e.stopPropagation();
      const links = scrollContainer.querySelectorAll('a');
      links.forEach(link => {
        link.addEventListener('click', preventClick, { once: true });
      });
    };
    
    const preventClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      
      const x = e.pageX - scrollContainer.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed factor
      
      // If the user has moved more than a small threshold, consider it a drag
      if (Math.abs(walk) > 5) {
        isDragging = true;
      }
      
      scrollContainer.scrollLeft = scrollLeft - walk;
    };
    
    // Prevent default link behavior during mousedown anywhere in the container
    const preventLinkDrag = (e) => {
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        e.preventDefault();
      }
    };
    
    // Add mouse event listeners for drag scrolling
    scrollContainer.addEventListener('mousedown', handleMouseDown);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);
    scrollContainer.addEventListener('mouseup', handleMouseUp);
    scrollContainer.addEventListener('mousemove', handleMouseMove);
    scrollContainer.addEventListener('dragstart', preventLinkDrag);
    
    // Add touch event listeners for mobile devices
    scrollContainer.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX - scrollContainer.offsetLeft;
      scrollLeft = scrollContainer.scrollLeft;
      isDragging = false;
    }, { passive: true });
    
    scrollContainer.addEventListener('touchmove', (e) => {
      if (!startX) return;
      const x = e.touches[0].clientX - scrollContainer.offsetLeft;
      const walk = (x - startX) * 2;
      scrollContainer.scrollLeft = scrollLeft - walk;
      isDragging = Math.abs(walk) > 5;
    }, { passive: true });
    
    scrollContainer.addEventListener('touchend', (e) => {
      if (isDragging) {
        // Prevent link navigation after drag on touch
        e.stopPropagation();
        const links = scrollContainer.querySelectorAll('a');
        links.forEach(link => {
          link.addEventListener('click', preventClick, { once: true });
        });
      }
    });
    
    return () => {
      // Clean up event listeners
      scrollContainer.removeEventListener('mousedown', handleMouseDown);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      scrollContainer.removeEventListener('mouseup', handleMouseUp);
      scrollContainer.removeEventListener('mousemove', handleMouseMove);
      scrollContainer.removeEventListener('dragstart', preventLinkDrag);
    };
  }, []);

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
