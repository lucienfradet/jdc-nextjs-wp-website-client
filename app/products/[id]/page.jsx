import { getPageFieldsByName } from '@/lib/api';
import ProductDetail from '@/components/products/ProductDetail';
import { notFound } from 'next/navigation';
import { cache } from 'react';

// Enable dynamic parameters
export const dynamicParams = true;

// Set revalidation time for ISR
export const revalidate = 3600; // Revalidate every hour

// Cached product fetching function
const getProduct = cache(async (id) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/products/by-id/${id}`,
    { next: { revalidate: 3600 } }
  );
  
  if (!res.ok) {
    return null;
  }
  
  return res.json();
});

// Generate metadata for the product page
export async function generateMetadata({ params }) {
  try {
    const { id } = await params;
    // Fetch product data (cached)
    const product = await getProduct(id);
    
    if (!product || !Array.isArray(product)) {
      return {
        title: 'Produit non trouvé',
        description: 'Le produit que vous cherchez n\'existe pas.'
      };
    }
    
    // Create a plain text description from HTML content
    const stripHtml = html => html.replace(/<[^>]*>?/gm, '').trim();
    const description = product.short_description 
      ? stripHtml(product.short_description) 
      : stripHtml(product.description).substring(0, 160) + '...';
    
    return {
      title: product.name,
      description: description,
      alternates: {
        canonical: `/products/${id}`,
      },
      openGraph: {
        title: product.name,
        description: description,
        type: 'website',
        images: product.images?.length > 0 ? [product.images[0].src] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: 'Produit',
      description: 'Détails du produit'
    };
  }
}

export default async function ProductPage({ params }) {
  // Await params before using
  const { id } = await params;
  // Fetch common data
  const [headerData, footerData, product] = await Promise.all([
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    getProduct(id)
  ]);
  
  if (!product) {
    notFound();
  }
  
  return (
    <div className="product-page-container">
      <ProductDetail
        product={product}
        headerData={headerData}
        footerData={footerData}
      />
    </div>
  );
}
