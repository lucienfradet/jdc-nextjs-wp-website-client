import { getPageFieldsByName } from '@/lib/api';
import { fetchSiteIcon } from "@/lib/api";
import ProductDetail from '@/components/products/ProductDetail';
import { notFound } from 'next/navigation';

// Enable dynamic parameters
export const dynamicParams = true;

// Set revalidation time for ISR
export const revalidate = 3600; // Revalidate every hour

export default async function ProductPage({ params }) {
  // Await params before using
  const { id } = await params;
  // Fetch common data
  const [headerData, footerData, siteIconUrl] = await Promise.all([
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    fetchSiteIcon()
  ]);
  
  // Fetch specific product data
  const productRes = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/products/${id}`,
    { next: { revalidate: 3600 } } // Use revalidate instead of no-store for ISR
  );
  
  if (!productRes.ok) {
    notFound();
  }
  
  const product = await productRes.json();
  
  return (
    <div className="product-page-container">
      <ProductDetail
        product={product}
        headerData={headerData}
        footerData={footerData}
        siteIconUrl={siteIconUrl}
      />
    </div>
  );
}
