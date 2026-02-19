/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH === 'undefined' ? undefined : process.env.NEXT_PUBLIC_BASE_PATH,

  async headers() {
    return [
      {
        // All HTML/dynamic pages — never cache
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "CDN-Cache-Control",  // Cloudflare-specific override
            value: "no-store",
          },
        ],
      },
    ];
  },

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
