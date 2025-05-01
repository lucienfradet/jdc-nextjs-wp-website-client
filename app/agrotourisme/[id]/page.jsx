import { getPageFieldsByName } from '@/lib/cachedApi';
import { fetchBookingProductById } from '@/lib/wooCommerce';
import BookingDetailPage from '@/components/booking/BookingDetailPage';
import { notFound } from 'next/navigation';
import { stripHtml } from '@/lib/textUtils';

export const revalidate = 3600;

// Generate metadata based on product data
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await fetchBookingProductById(id);
  
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
  const { id } = params;
  
  // Fetch data on the server
  const [headerData, footerData, product] = await Promise.all([
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    fetchBookingProductById(id)
  ]);

  if (!headerData || !footerData || !product) {
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
