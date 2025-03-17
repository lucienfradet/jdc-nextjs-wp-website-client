import { getPageFieldsByName } from '@/lib/cachedApi';
import AProposPage from '@/components/AProposPage';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

// Generate metadata based on CMS data
export async function generateMetadata() {
  // This fetch is now cached
  const pageData = await getPageFieldsByName("a_propos");
  
  if (!pageData) {
    return null;
  }
  
  // Access the metadata fields from your CMS data
  const { acfFields } = pageData;
  
  return {
    title: acfFields["head-title"] || 'Le Jardin des chefs',
    description: acfFields["head-description"] || undefined,
    alternates: {
      canonical: '/about',
    },
    openGraph: {
      title: acfFields["head-title"] || 'Le Jardin des chefs',
      description: acfFields["head-description"] || undefined,
      url: '/about',
    },
  };
}

export default async function Page() {
  // Fetch data on the server
  const [pageData, headerData, footerData] = await Promise.all([
    getPageFieldsByName("a_propos"),
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
  ]);

  if (!pageData || !headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  return (
    <AProposPage
      pageData={pageData}
      headerData={headerData}
      footerData={footerData}
    />
  );
}
