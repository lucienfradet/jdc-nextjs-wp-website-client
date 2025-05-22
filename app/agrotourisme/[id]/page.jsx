import { getPageFieldsByName } from '@/lib/cachedApi';
import BookingDetailPage from '@/components/booking/BookingDetailPage';
import { notFound } from 'next/navigation';
import { stripHtml } from '@/lib/textUtils';
import { cache } from 'react';

export const revalidate = 1800;
// 0 for testing
// export const revalidate = 0;


// Cached product fetching function
const getProduct = cache(async (id) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/products/by-id/${id}`,
    // { next: { revalidate: 3600 } }
    { next: { revalidate: 0 } }
  );
  
  if (!res.ok) {
    return null;
  }
  
  return res.json();
});

// Generate metadata based on product data
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = getProduct(id);

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
  const [headerData, footerData, product] = await Promise.all([
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    getProduct(id)
  ]);

  if (!headerData || !footerData || !product || Array.isArray(product)) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  return (
    <BookingDetailPage
      headerData={headerData}
      footerData={footerData}
      product={product}
    />
  );
}
