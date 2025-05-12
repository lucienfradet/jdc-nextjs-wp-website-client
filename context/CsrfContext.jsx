"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { fetchCsrfToken, checkCookiesEnabled } from '@/lib/csrf-client';

const CSRF_TOKEN = "jardindeschefs_csrf_token_local_storage";

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
      return await fetchFreshToken();
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
      fetchFreshToken();
    }, 50 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [cookiesEnabled]);

  return (
    <CsrfContext.Provider 
      value={{ 
        csrfToken, 
        isLoading, 
        error, 
        refreshToken: fetchFreshToken,
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
