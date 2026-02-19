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
 * Get the appropriate WordPress API base URL.
 * At runtime on the server: uses internal Docker URL if available (bypasses Cloudflare).
 * At build time or client-side: uses the public URL.
 */
function getInternalUrl(originalUrl) {
  if (typeof window !== 'undefined') return null; // Client-side, no swap

  const internalBase = process.env.WORDPRESS_INTERNAL_URL;
  if (!internalBase) return null; // Not set (e.g., during GitHub Actions build)

  const publicBase = process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
  if (!publicBase || !originalUrl.startsWith(publicBase)) return null;

  // Replace the public base with the internal one
  return originalUrl.replace(publicBase, internalBase);
}

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
  // Check if we should use internal Docker networking
  const internalUrl = getInternalUrl(url);
  const fetchUrl = internalUrl || url;

  // If using internal URL, add Host header so WordPress accepts the request
  const fetchOptions = { ...options };
  if (internalUrl) {
    const wpHostname = process.env.NEXT_PUBLIC_WORDPRESS_HOSTNAME || 'wordpress.jardindeschefs.ca';
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Host': wpHostname,
    };
  }

  // If we're not ignoring SSL issues, use native fetch for revalidation support
  if (!sslIgnore) {
    const response = await fetch(fetchUrl, options);
    return response;
  }
  
  // Otherwise use axios for development with custom SSL certs
  return axiosInstance({
    url: fetchUrl,
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
