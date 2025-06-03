import { getPageFieldsByName } from '@/lib/cachedApi';
import ProductsPage from '@/components/ProductsPage';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

// Generate metadata based on CMS data
export async function generateMetadata() {
  // This fetch is now cached
  const pageData = await getPageFieldsByName("produits");
  
  if (!pageData) {
    return null;
  }
  
  // Access the metadata fields from your CMS data
  const { acfFields } = pageData;
  
  return {
    title: acfFields["head-title"] || 'Le Jardin des chefs',
    description: acfFields["head-description"] || undefined,
    alternates: {
      canonical: '/produits',
    },
    openGraph: {
      title: acfFields["head-title"] || 'Le Jardin des chefs',
      description: acfFields["head-description"] || undefined,
      url: '/produits',
    },
  };
}

export default async function Page() {
  // Fetch data on the server
  const [pageData, headerData, footerData] = await Promise.all([
    getPageFieldsByName("produits"),
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
  ]);

  if (!pageData || !headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  return (
    <ProductsPage
      pageData={pageData}
      headerData={headerData}
      footerData={footerData}
    />
  );
}
