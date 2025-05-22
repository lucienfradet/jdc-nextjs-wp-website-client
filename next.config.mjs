/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    remotePatterns: [
      // Development - localhost
      {
        protocol: 'https',
        hostname: '127.0.0.1',
        pathname: '/wp-content/uploads/**',
      },
      // Production - WordPress hostname from environment
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_WORDPRESS_HOSTNAME || 'wordpress.jardindeschefs.ca',
        pathname: '/wp-content/uploads/**',
      },
      // Fallback - allow all WordPress paths
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_WORDPRESS_HOSTNAME || 'wordpress.jardindeschefs.ca',
        pathname: '/**',
      },
    ],
  },
};

// Disable SSL verification in development environment
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export default nextConfig;
