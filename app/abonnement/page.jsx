import { getPageFieldsByName } from '@/lib/cachedApi';
import Abonnement from '@/components/Abonnement';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

// Generate metadata based on CMS data
export async function generateMetadata() {
  // This fetch is now cached
  const pageData = await getPageFieldsByName("abonnement");
  
  if (!pageData) {
    return null;
  }
  
  // Access the metadata fields from your CMS data
  const { acfFields } = pageData;
  
  return {
    title: acfFields["head-title"] || 'Le Jardin des chefs',
    description: acfFields["head-description"] || undefined,
    alternates: {
      canonical: '/abonnement',
    },
    openGraph: {
      title: acfFields["head-title"] || 'Le Jardin des chefs',
      description: acfFields["head-description"] || undefined,
      url: '/abonnement',
    },
  };
}

export default async function Page() {
  // Fetch data on the server
  const [pageData, headerData, footerData, productsRes, pointsRes] = await Promise.all([
    getPageFieldsByName("abonnement"),
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/products`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/point_de_chute`, { cache: "no-store" })
  ]);

  if (!pageData || !headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  if (!productsRes.ok || !pointsRes.ok) {
    console.error("Error fetching products");
  }

  const products = await productsRes.json();
  const pointDeChute = await pointsRes.json();

  return (
    <Abonnement
      pageData={pageData}
      headerData={headerData}
      footerData={footerData}
      pointDeChute={pointDeChute}
      products={products}
    />
  );
}
