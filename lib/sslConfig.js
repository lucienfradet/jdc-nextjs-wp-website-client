import https from 'https';
import { GraphQLClient } from 'graphql-request';
import axios from 'axios';

const sslIgnore = process.env.NEXT_PUBLIC_SSL_IGNORE === 'true';

// Create reusable axios instance with SSL configuration
export const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: !sslIgnore
  })
});

// Configure GraphQL client with SSL support
export const graphQLClient = new GraphQLClient(process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL, {
  fetch: async (url, options) => {
    return axiosInstance({
      url,
      method: options?.method || 'POST',
      data: options?.body,
      headers: options?.headers
    }).then(response => ({
      ok: true,
      status: response.status,
      statusText: response.statusText,
      json: () => Promise.resolve(response.data)
    }));
  }
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
    json: () => Promise.resolve(response.data)
  }));
};
