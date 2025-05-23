import https from 'https';
import axios from 'axios';

const sslIgnore = process.env.NEXT_PUBLIC_SSL_IGNORE === 'true';

// Create reusable axios instance with SSL configuration
export const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: !sslIgnore
  })
});

/**
 * Hybrid fetch implementation that uses:
 * - Axios in development when SSL ignore is needed
 * - Native fetch in production for revalidation support
 * 
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} options.next - Next.js fetch options including revalidate
 * @returns {Promise<Response>} - Fetch-like response object
 */
export const safeFetch = async (url, options = {}) => {
  // If we're not ignoring SSL issues, use native fetch for revalidation support
  if (!sslIgnore) {
    const response = await fetch(url, options);
    return response;
  }
  
  // Otherwise use axios for development with custom SSL certs
  return axiosInstance({
    url,
    method: options.method || 'GET',
    data: options.body,
    headers: options.headers
  }).then(response => ({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText,
    json: () => Promise.resolve(response.data),
    text: () => Promise.resolve(JSON.stringify(response.data)),
    headers: {
      get: (name) => response.headers[name.toLowerCase()]
    }
  }));
};
