"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { fetchCsrfToken, checkCookiesEnabled } from '@/lib/csrf-client';

const CSRF_TOKEN = "jardindeschefs_csrf_token_local_storage";

// Create context
const CsrfContext = createContext(null);

/**
 * Provider component for CSRF tokens
 * Makes CSRF tokens available to all child components
 */
export function CsrfProvider({ children }) {
  const [csrfToken, setCsrfToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cookiesEnabled, setCookiesEnabled] = useState(true);

  // Check if cookies are enabled
  useEffect(() => {
    setCookiesEnabled(checkCookiesEnabled());
  }, []);

  // Fetch a CSRF token when the component mounts
  useEffect(() => {
    // Don't fetch token if cookies are disabled
    if (!cookiesEnabled) {
      setIsLoading(false);
      return;
    }
    
    const getToken = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to get token from sessionStorage first (for SPA navigation)
        const storedToken = sessionStorage.getItem(CSRF_TOKEN);
        if (storedToken) {
          setCsrfToken(storedToken);
          setIsLoading(false);
          return;
        }
        
        // Fetch a new token if not found in sessionStorage
        const token = await fetchCsrfToken();
        
        // Store token in state and sessionStorage
        setCsrfToken(token);
        sessionStorage.setItem(CSRF_TOKEN, token);
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        setError(err.message || 'Failed to fetch CSRF token');
      } finally {
        setIsLoading(false);
      }
    };

    getToken();
  }, [cookiesEnabled]);

  // Refresh the token when needed (e.g., after a certain time)
  const refreshToken = async () => {
    if (!cookiesEnabled) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch a new token
      const token = await fetchCsrfToken();
      
      // Update state and sessionStorage
      setCsrfToken(token);
      sessionStorage.setItem(CSRF_TOKEN, token);
    } catch (err) {
      console.error('Failed to refresh CSRF token:', err);
      setError(err.message || 'Failed to refresh CSRF token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CsrfContext.Provider 
      value={{ 
        csrfToken, 
        isLoading, 
        error, 
        refreshToken,
        cookiesEnabled
      }}
    >
      {children}
      
      {/* Show warning if cookies are disabled */}
      {!cookiesEnabled && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffdddd',
          color: '#cc0000',
          padding: '10px',
          textAlign: 'center',
          zIndex: 9999
        }}>
          Pour des raisons de sécurité, ce site nécessite que les cookies essentiels soient activés.
          Veuillez activer les cookies dans les paramètres de votre navigateur pour continuer.
        </div>
      )}
    </CsrfContext.Provider>
  );
}

/**
 * Hook to use CSRF context in components
 * @returns {Object} CSRF context value
 */
export function useCsrf() {
  const context = useContext(CsrfContext);
  if (!context) {
    throw new Error('useCsrf must be used within a CsrfProvider');
  }
  return context;
}
