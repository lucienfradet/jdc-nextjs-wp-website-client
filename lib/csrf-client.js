/**
 * Client-side function to fetch a CSRF token
 * @returns {Promise<string>} The CSRF token
 */
export async function fetchCsrfToken() {
  const response = await fetch('/api/csrf/token');
  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }
  const data = await response.json();
  return data.token;
}

/**
 * Tests if cookies are enabled in the browser
 * @returns {boolean} Whether cookies are enabled
 */
export function checkCookiesEnabled() {
  try {
    // Create a test cookie
    document.cookie = "csrfCookieTest=1; path=/; SameSite=Lax; max-age=60";
    // Check if the cookie was set successfully
    const cookieEnabled = document.cookie.indexOf("csrfCookieTest=") !== -1;
    // Clean up the test cookie
    document.cookie = "csrfCookieTest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    return cookieEnabled;
  } catch (e) {
    // If there's an error (e.g., in a sandboxed iframe), assume cookies are disabled
    console.error(e);
    return false;
  }
}

/**
 * Add CSRF token to a fetch request
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {string} csrfToken - The CSRF token to include
 * @returns {Promise<Response>} The fetch response
 */
export async function fetchWithCsrf(url, options = {}, csrfToken) {
  if (!csrfToken) {
    throw new Error('CSRF token is required');
  }

  // Deep clone the options to avoid mutating the original
  const newOptions = JSON.parse(JSON.stringify(options));
  
  // Initialize headers if they don't exist
  newOptions.headers = newOptions.headers || {};
  
  // Add CSRF token to headers
  newOptions.headers['X-CSRF-Token'] = csrfToken;
  
  // For non-GET requests with a body, add token to body as well
  if (newOptions.body && !['GET', 'HEAD'].includes(newOptions.method)) {
    try {
      // For JSON body
      if (newOptions.headers['Content-Type']?.includes('application/json')) {
        const bodyObj = typeof newOptions.body === 'string' 
          ? JSON.parse(newOptions.body) 
          : newOptions.body;
        
        bodyObj.csrf_token = csrfToken;
        newOptions.body = JSON.stringify(bodyObj);
      }
      // For FormData body
      else if (newOptions.body instanceof FormData) {
        newOptions.body.append('csrf_token', csrfToken);
      }
    } catch (error) {
      console.error('Error adding CSRF token to request body:', error);
    }
  }
  
  return fetch(url, newOptions);
}
