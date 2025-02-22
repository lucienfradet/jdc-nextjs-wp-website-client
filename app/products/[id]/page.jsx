import { getPageFieldsByName } from '@/lib/api';
import { fetchSiteIcon } from "@/lib/api";
import ProductDetail from '@/components/products/ProductDetail';

export async function generateStaticParams() {
  const productsRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/products`);
  const products = await productsRes.json();
  return products.map(product => ({ id: product.id.toString() }));
}

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
    { cache: "no-store" }
  );

  if (!productRes.ok) {
    return {
      notFound: true,
    };
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
