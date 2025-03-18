import { getPageFieldsByName } from '@/lib/cachedApi';
import HomePage from '@/components/HomePage';
import { notFound } from 'next/navigation';

// Page regenerates every hour
// This revalidate takes precedence over the ones defined in
// getPageFieldsByName calls, because of the rule of shortest
// validation time thing
export const revalidate = 3600;

// Generate metadata based on CMS data
export async function generateMetadata() {
  // This fetch is now cached
  const pageData = await getPageFieldsByName("homepage");
  
  if (!pageData) {
    return null;
  }
  
  // Access the metadata fields from your CMS data
  const { acfFields } = pageData;
  
  return {
    title: acfFields["head-title"] || 'Le Jardin des chefs',
    description: acfFields["head-description"] || undefined,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: acfFields["head-title"] || 'Le Jardin des chefs',
      description: acfFields["head-description"] || undefined,
      url: '/',
    },
  };
}

export default async function Page() {
  // Fetch data on the server
  const [pageData, headerData, footerData, siteIconUrl] = await Promise.all([
    getPageFieldsByName("homepage"),
    getPageFieldsByName("header", 86400), // 1 day
    getPageFieldsByName("footer", 86400) // 1 day
  ]);

  if (!pageData || !headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  return (
    <HomePage
      pageData={pageData}
      headerData={headerData}
      footerData={footerData}
      siteIconUrl={siteIconUrl}
    />
  );
}
