import https from 'https';
import axios from 'axios';

const sslIgnore = process.env.NEXT_PUBLIC_SSL_IGNORE === 'true';
const isProduction = process.env.NODE_ENV === 'production';

// Create reusable axios instance with SSL configuration
export const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: !sslIgnore
  }),
  timeout: 10000, // 10 second timeout
});

/**
 * Hybrid fetch implementation that handles production/development differences
 */
export const safeFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    // In production, always use native fetch with proper error handling
    if (isProduction || !sslIgnore) {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    }
    
    // Development mode with SSL ignore
    const response = await axiosInstance({
      url,
      method: options.method || 'GET',
      data: options.body,
      headers: options.headers,
      timeout: 10000,
    });
    
    clearTimeout(timeoutId);
    
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      json: () => Promise.resolve(response.data),
      text: () => Promise.resolve(JSON.stringify(response.data)),
      headers: {
        get: (name) => response.headers[name.toLowerCase()]
      }
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.error(`Fetch error for ${url}:`, error.message);
    
    // Return a proper error response
    return {
      ok: false,
      status: 500,
      statusText: error.message,
      json: () => Promise.reject(error),
      text: () => Promise.reject(error),
      headers: { get: () => null }
    };
  }
};
