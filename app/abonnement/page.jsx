import { getPageFieldsByName } from '@/lib/api';
import { fetchSiteIcon } from "@/lib/api";
import Abonnement from '@/components/Abonnement';
import { notFound } from 'next/navigation';

export default async function Page() {
  // Fetch data on the server
  const [pageData, headerData, footerData, siteIconUrl, productsRes, pointsRes] = await Promise.all([
    getPageFieldsByName("abonnement"),
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    fetchSiteIcon(),
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
      siteIconUrl={siteIconUrl}
      pointDeChute={pointDeChute}
      products={products}
    />
  );
}
