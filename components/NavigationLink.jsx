"use client";

import Link from 'next/link';
import { useNavigation } from '@/context/NavigationContext';

export default function NavigationLink({ 
  href, 
  children, 
  className, 
  onClick, 
  showLoader = true,
  ...props 
}) {
  const { startNavigation } = useNavigation();

  const handleClick = (e) => {
    // Call custom onClick if provided
    if (onClick) {
      onClick(e);
    }
    
    // If navigation wasn't prevented and we should show loader
    if (!e.defaultPrevented && showLoader) {
      // Small delay to ensure click registers before loading starts
      setTimeout(() => {
        startNavigation();
      }, 50);
    }
  };

  return (
    <Link 
      href={href} 
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
