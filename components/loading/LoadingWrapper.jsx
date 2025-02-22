'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Loading from '@/components/loading/Loading';
import loadingStyles from '@/styles/Loading.module.css';

export default function LoadingWrapper({ children }) {
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setLoading(true);
    setFadeOut(false);
    
    const timeout = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setLoading(false), 500);
    }, 100);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return (
    <>
      {loading && (
        <div
          className={`${loadingStyles["loading-container"]} ${fadeOut ? loadingStyles["fade-out"] : ""}`}
        >
          <Loading />
        </div>
      )}
      {children}
    </>
  );
}
