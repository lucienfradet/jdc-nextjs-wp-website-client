import { getPageFieldsByName } from '@/lib/cachedApi';
import ContactPage from '@/components/ContactPage';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

// Generate metadata based on CMS data
export async function generateMetadata() {
  // This fetch is now cached
  const pageData = await getPageFieldsByName("contact");
  
  if (!pageData) {
    return null;
  }
  
  // Access the metadata fields from your CMS data
  const { acfFields } = pageData;
  
  return {
    title: acfFields["head-title"] || 'Le Jardin des chefs',
    description: acfFields["head-description"] || undefined,
    alternates: {
      canonical: '/contact',
    },
    openGraph: {
      title: acfFields["head-title"] || 'Le Jardin des chefs',
      description: acfFields["head-description"] || undefined,
      url: '/contact',
    },
  };
}

export default async function Page() {
  // Fetch data on the server
  const [pageData, headerData, footerData] = await Promise.all([
    getPageFieldsByName("contact"),
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
  ]);

  if (!pageData || !headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <ContactPage
      pageData={pageData}
      headerData={headerData}
      footerData={footerData}
      mapsApiKey={mapsApiKey}
    />
  );
}
