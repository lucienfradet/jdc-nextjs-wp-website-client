import '@/styles/globals.css';
import { CartProvider } from '@/context/CartContext';
import { CsrfProvider } from '@/context/CsrfContext';
import { Suspense } from 'react';
import Loading from '@/components/loading/Loading';
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
    description: `Ferme maraîchère familiale située en Charlevoix, Le Jardin des
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
        <Suspense fallback={<Loading />}>
          <CsrfProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </CsrfProvider>
        </Suspense>
      </body>
    </html>
  );
}
