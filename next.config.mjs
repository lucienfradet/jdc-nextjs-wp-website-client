/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '', // Serve the app under /jardindeschefs
  images: {
    remotePatterns: [
      {
        protocol: 'https', // or 'http' if you're using an unsecured domain
        hostname: '127.0.0.1',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL|| 'default-domain.com', // Use the third domain or fallback
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
};

// Disable SSL verification in development environment
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export default nextConfig;
