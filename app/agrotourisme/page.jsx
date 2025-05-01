import { getPageFieldsByName } from '@/lib/cachedApi';
import { fetchBookingProducts } from '@/lib/wooCommerce';
import AgrotourismePage from '@/components/AgrotourismePage';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

// Generate metadata based on CMS data
export async function generateMetadata() {
  // This fetch is now cached
  const pageData = await getPageFieldsByName("agrotourisme");
  
  if (!pageData) {
    return null;
  }
  
  // Access the metadata fields from your CMS data
  const { acfFields } = pageData;
  
  return {
    title: acfFields["head-title"] || 'Agrotourisme - Le Jardin des chefs',
    description: acfFields["head-description"] || 'Découvrez notre ferme en participant à nos visites guidées',
    alternates: {
      canonical: '/agrotourisme',
    },
    openGraph: {
      title: acfFields["head-title"] || 'Agrotourisme - Le Jardin des chefs',
      description: acfFields["head-description"] || 'Découvrez notre ferme en participant à nos visites guidées',
      url: '/agrotourisme',
    },
  };
}

export default async function Page() {
  // Fetch data on the server
  const [pageData, headerData, footerData, bookingProducts] = await Promise.all([
    getPageFieldsByName("agrotourisme"),
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    fetchBookingProducts()
  ]);

  if (!pageData || !headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  return (
    <AgrotourismePage
      pageData={pageData}
      headerData={headerData}
      footerData={footerData}
      bookingProducts={bookingProducts}
    />
  );
}
