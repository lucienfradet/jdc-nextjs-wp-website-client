import https from 'https';
import axios from 'axios';

const sslIgnore = process.env.NEXT_PUBLIC_SSL_IGNORE === 'true';

// Create reusable axios instance with SSL configuration
export const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: !sslIgnore
  })
});

// Reusable fetch wrapper with SSL configuration
export const safeFetch = async (url, options = {}) => {
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
    headers: {
      get: (name) => response.headers[name.toLowerCase()]
    }
  }));
};
