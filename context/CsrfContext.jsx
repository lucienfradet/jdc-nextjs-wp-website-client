"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { fetchCsrfToken, checkCookiesEnabled } from '@/lib/csrf-client';

const CSRF_TOKEN = "jardindeschefs_csrf_token_local_storage";
const CSRF_TOKEN_TIMESTAMP = "jardindeschefs_csrf_token_timestamp";
const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000;

// Create context
const CsrfContext = createContext(null);

export function CsrfProvider({ children }) {
  const [csrfToken, setCsrfToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cookiesEnabled, setCookiesEnabled] = useState(true);
  
  // Check if cookies are enabled
  useEffect(() => {
    setCookiesEnabled(checkCookiesEnabled());
  }, []);

  // Function to verify token validity
  const verifyTokenValidity = async (token) => {
    try {
      // Make a lightweight request to verify token is still valid
      const response = await fetch('/api/csrf/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify({ csrf_token: token })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  };

  // Get a fresh token
  const fetchFreshToken = async () => {
    setIsLoading(true);
    try {
      const token = await fetchCsrfToken();
      setCsrfToken(token);
      sessionStorage.setItem(CSRF_TOKEN, token);
      sessionStorage.setItem(CSRF_TOKEN_TIMESTAMP, Date.now().toString());
      setError(null);
      return token;
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
      setError(err.message || 'Failed to fetch CSRF token');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWithRetry = async (attempts = 3) => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fetchFreshToken();
      } catch (err) {
        if (i === attempts - 1) throw err;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  };

  const ensureFreshToken = async () => {
    // If token is within 5 minutes of expiry, refresh it
    const tokenTimestamp = parseInt(sessionStorage.getItem(CSRF_TOKEN_TIMESTAMP) || '0');
    const tokenAgeMinutes = (Date.now() - tokenTimestamp) / (60 * 1000);

    if (tokenAgeMinutes > 55) { // Token is older than 55 minutes (about to expire)
      return await fetchWithRetry();
    }
    return csrfToken;
  };

  // Initialize or refresh token
  const getToken = async () => {
    // Don't fetch if cookies are disabled
    if (!cookiesEnabled) {
      setIsLoading(false);
      return null;
    }
    
    try {
      // Try to get token from sessionStorage first
      const storedToken = sessionStorage.getItem(CSRF_TOKEN);
      
      // If we have a stored token, verify it's still valid
      if (storedToken) {
        const isValid = await verifyTokenValidity(storedToken);
        
        if (isValid) {
          setCsrfToken(storedToken);
          setIsLoading(false);
          return storedToken;
        }
        
        // If token is invalid, clear it from storage
        sessionStorage.removeItem(CSRF_TOKEN);
      }
      
      // Fetch a new token
      return await fetchWithRetry();
    } catch (err) {
      console.error('Error in token initialization:', err);
      setError(err.message || 'Failed to initialize CSRF protection');
      setIsLoading(false);
      return null;
    }
  };

  // Initial token setup
  useEffect(() => {
    getToken();
    
    // Set up token refresh interval (e.g., every 50 minutes if token expires at 60)
    const refreshInterval = setInterval(() => {
      fetchWithRetry();
    }, TOKEN_REFRESH_INTERVAL);
    
    return () => clearInterval(refreshInterval);
  }, [cookiesEnabled]);

  // Add event listeners for page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check token validity when tab becomes visible again
        getToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <CsrfContext.Provider 
      value={{ 
        csrfToken, 
        isLoading, 
        error, 
        refreshToken: fetchWithRetry,
        ensureFreshToken,
        cookiesEnabled
      }}
    >
      {children}
      
      {/* Warning for disabled cookies */}
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

export function useCsrf() {
  const context = useContext(CsrfContext);
  if (!context) {
    throw new Error('useCsrf must be used within a CsrfProvider');
  }
  return context;
}
