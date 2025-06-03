import '@/styles/globals.css';
import { CartProvider } from '@/context/CartContext';
import { CsrfProvider } from '@/context/CsrfContext';
import { NavigationProvider } from '@/context/NavigationContext';
import { Suspense } from 'react';
import { LoadingProvider } from '@/components/loading/LoadingManager';
import Loading from '@/components/loading/Loading';
import NavigationLoader from '@/components/loading/NavigationLoader';
import { fetchSiteIcon } from '@/lib/api';

export async function generateMetadata() {
  // Fetch the icon URL with caching/revalidation as specified
  const siteIconUrl = await fetchSiteIcon(86400); // 1 day cache

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jardindeschefs.ca'),
    title: {
      default: 'Le Jardin des chefs',
      template: '%s | Le Jardin des chefs'
    },
    description: `Ferme maraîchère familiale située à Charlevoix, Le Jardin des
                  Chefs est dirigé par trois jeunes passionnés alliant expertise agricole et
                  sensibilité gastronomique. Surplombant le fleuve Saint-Laurent, notre ferme
                  cultive des produits de qualité tout en valorisant les partenariats locaux et
                  l'ancrage communautaire.`,
    icons: {
      icon: siteIconUrl || '/favicon.ico', // Fallback to static path if fetch fails
      apple: '/apple-touch-icon.png',
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'website',
      locale: 'fr_CA',
      siteName: 'Le Jardin des chefs',
      images: [
        {
          url: '/og-image-default.jpg',
          width: 1200,
          height: 630,
          alt: 'Le Jardin des chefs - Ferme maraîchère à Charlevoix',
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-image-default.jpg'],
    }
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body suppressHydrationWarning={true}>
        <LoadingProvider>
          <NavigationProvider>
            <Suspense fallback={<Loading />}>
              <CsrfProvider>
                <CartProvider>
                  {children}
                  <NavigationLoader />
                </CartProvider>
              </CsrfProvider>
            </Suspense>
          </NavigationProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
