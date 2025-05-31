"use client";

import Link from 'next/link';
import { useNavigation } from '@/context/NavigationContext';
import { usePathname } from 'next/navigation';

export default function NavigationLink({ 
  href, 
  children, 
  className, 
  onClick, 
  showLoader = true,
  ...props 
}) {
  const { startNavigation } = useNavigation();
  const pathname = usePathname();

  const handleClick = (e) => {
    // Call custom onClick if provided
    if (onClick) {
      onClick(e);
    }
    
    // Only show loader if navigation wasn't prevented and we should show loader
    // and we're actually navigating to a different page
    if (!e.defaultPrevented && showLoader && href !== pathname) {
      startNavigation();
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
