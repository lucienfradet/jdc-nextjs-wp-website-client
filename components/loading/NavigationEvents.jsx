'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loading from '@/components/loading/Loading';
import loadingStyles from '@/styles/Loading.module.css';

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  
  useEffect(() => {
    // When route changes, show the loading indicator
    setIsNavigating(true);
    setFadeOut(false);
    
    // Start fade-out animation after a brief delay
    const fadeTimeout = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setIsNavigating(false), 500); // Hide after fade completes
    }, 300); // Show for at least 300ms
    
    return () => clearTimeout(fadeTimeout);
  }, [pathname, searchParams]);
  
  if (!isNavigating) return null;
  
  return (
    <div className={`${loadingStyles["loading-container"]} ${fadeOut ? loadingStyles["fade-out"] : ""}`}>
      <Loading />
    </div>
  );
}
