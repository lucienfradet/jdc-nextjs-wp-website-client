import { getPageFieldsByName } from '@/lib/cachedApi';
import BookingDetailPage from '@/components/booking/BookingDetailPage';
import { notFound } from 'next/navigation';
import { stripHtml } from '@/lib/textUtils';
import { cache } from 'react';
import { processProductImages } from '@/lib/api';

export const dynamic = 'force-dynamic'; // we are fetching nextjs api on build! can't be static!
// export const revalidate = 1800;
// 0 for testing
// export const revalidate = 0;


// Cached product fetching function
const getProduct = cache(async (id) => {
  const resultsRaw = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/products/by-id/${id}`,
    { next: { revalidate: 3600 } }
    // { next: { revalidate: 0 } }
  );
  
  if (!resultsRaw.ok) {
    return null;
  }

  const result = await resultsRaw.json();
  
  return result;
});

// Generate metadata based on product data
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Réservation non trouvée',
      description: 'La réservation que vous cherchez n\'existe pas.'
    };
  }
  
  // Strip HTML for description
  const description = product.short_description 
    ? stripHtml(product.short_description) 
    : stripHtml(product.description).substring(0, 160) + '...';
  
  return {
    title: `Réservation - ${product.name}`,
    description: description,
    alternates: {
      canonical: `/agrotourisme/${id}`,
    },
    openGraph: {
      title: `Réservation - ${product.name}`,
      description: description,
      url: `/agrotourisme/${id}`,
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  
  // Fetch data on the server
  const [headerData, footerData, productRaw] = await Promise.all([
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    getProduct(id)
  ]);

  if (!headerData || !footerData || !productRaw || Array.isArray(productRaw)) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  const product = await processProductImages(productRaw);

  return (
    <BookingDetailPage
      headerData={headerData}
      footerData={footerData}
      product={product}
    />
  );
}
